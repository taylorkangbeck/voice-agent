import { RunnableConfig } from "@langchain/core/runnables";
import {
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  AgentConfigurationAnnotation,
  ensureAgentConfiguration,
} from "./configuration.js";
import { loadChatModel } from "./utils.js";

import { executeCypherQuery } from "../../neo4j.js";
import { AgentStateAnnotation, InputStateAnnotation } from "./state.js";
import { Flow, FlowExecution, FlowStep, FlowStepExecution } from "./types.js";

// TODO REVIEW
const getFlows = async (): Promise<Flow[]> => {
  // TODO: use semantic search to find the best flow
  const flowsResult = await executeCypherQuery(`
    MATCH (flow:Flow)
    RETURN flow
  `);

  // Transform the results into Flow objects
  const flows = await Promise.all(
    flowsResult.records.map(async (record) => {
      const flowNode = record.get("flow").properties;
      const flowName = flowNode.name;

      // Find the start step for this flow
      const startStepResult = await executeCypherQuery(
        `
        MATCH (flow:Flow {name: $flowName})-[:START]->(startStep:FlowStep)
        RETURN startStep
      `,
        { flowName }
      );

      if (startStepResult.records.length === 0) {
        return null; // Skip flows with no start step
      }

      const startStep = startStepResult.records[0].get("startStep").properties;

      // Get all steps in order by following NEXT relationships
      const allStepsResult = await getOrderedSteps(startStep.name);

      // Parse context if it exists
      let context = {};
      if (flowNode.context && typeof flowNode.context === "string") {
        try {
          context = JSON.parse(flowNode.context);
        } catch (e) {
          console.error("Error parsing flow context:", e);
        }
      }

      return {
        id: flowNode.id,
        name: flowNode.name,
        description: flowNode.description,
        context,
        steps: allStepsResult,
      };
    })
  );

  // Filter out null flows (those without start steps)
  return flows.filter(Boolean);
};

// TODO REVIEW
// Helper function to get steps in order by traversing NEXT relationships
const getOrderedSteps = async (
  startStepName: string
): Promise<FlowStep<any, any>[]> => {
  const steps: FlowStep<any, any>[] = [];
  let currentStepName: string | null = startStepName;

  while (currentStepName) {
    // Get current step
    const stepResult = await executeCypherQuery(
      `
      MATCH (step:FlowStep {name: $stepName})
      OPTIONAL MATCH (step)-[:EXECUTES]->(action:Action)
      RETURN step, action
    `,
      { stepName: currentStepName }
    );

    if (stepResult.records.length === 0) {
      break;
    }

    const stepNode = stepResult.records[0].get("step").properties;
    const actionNode = stepResult.records[0].get("action")?.properties;

    // Parse schemas from JSON strings if they exist
    let inputSchema = {};
    let outputSchema = {};
    let context = {};

    if (stepNode.inputSchema && typeof stepNode.inputSchema === "string") {
      try {
        inputSchema = JSON.parse(stepNode.inputSchema);
      } catch (e) {
        console.error("Error parsing input schema:", e);
      }
    }

    if (stepNode.outputSchema && typeof stepNode.outputSchema === "string") {
      try {
        outputSchema = JSON.parse(stepNode.outputSchema);
      } catch (e) {
        console.error("Error parsing output schema:", e);
      }
    }

    if (stepNode.context && typeof stepNode.context === "string") {
      try {
        context = JSON.parse(stepNode.context);
      } catch (e) {
        console.error("Error parsing context:", e);
      }
    }

    // Create a step object with action function
    steps.push({
      id: stepNode.id || stepNode.name,
      name: stepNode.name,
      instructions: stepNode.instructions || "",
      inputSchema,
      outputSchema,
      context,
      action: async (input: any) => {
        // This is a placeholder - in a real implementation, you would
        // execute the action based on the action type and input
        console.log(
          `Executing action for step ${stepNode.name} with input:`,
          input
        );
        return Promise.resolve(`Result from step ${stepNode.name}`);
      },
    });

    // Find the next step
    const nextStepResult = await executeCypherQuery(
      `
      MATCH (current:FlowStep {name: $currentStepName})-[:NEXT]->(next:FlowStep)
      RETURN next
    `,
      { currentStepName }
    );

    if (nextStepResult.records.length === 0) {
      currentStepName = null; // No more steps
    } else {
      currentStepName = nextStepResult.records[0].get("next").properties.name;
    }
  }

  return steps;
};

async function selectFlow(
  state: typeof AgentStateAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<typeof AgentStateAnnotation.Update> {
  const flows = await getFlows();
  // TODO pick the best flow
  const flow = flows.length > 0 ? flows[0] : undefined;
  if (!flow) {
    throw new Error("No flows found");
  }
  return {
    flow,
    flowExecution: {
      flow,
      steps: [],
    },
    currentStep: 0,
  };
}

async function executeStep(
  state: typeof AgentStateAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<typeof AgentStateAnnotation.Update> {
  return {
    flowExecution: {
      ...state.flowExecution,
      steps: [
        ...state.flowExecution.steps,
        {
          step: state.flow.steps[state.currentStep],
          result: "Step output",
        },
      ],
    },
    currentStep: state.currentStep + 1,
  };
}

function checkFinished(
  state: typeof AgentStateAnnotation.State
): "executeStep" | "returnFlowExecutionResult" {
  return state.currentStep >= state.flow.steps.length
    ? "returnFlowExecutionResult"
    : "executeStep";
}

const formatFlowExecutionResult = (flowExecution: FlowExecution) => {
  return flowExecution.steps
    .map((step: FlowStepExecution<any, any>) => step.result)
    .join("\n");
};

async function returnFlowExecutionResult(
  state: typeof AgentStateAnnotation.State,
  config: RunnableConfig
): Promise<typeof AgentStateAnnotation.Update> {
  const configuration = ensureAgentConfiguration(config);
  const model = await loadChatModel(configuration.responseModel);
  const context = formatFlowExecutionResult(state.flowExecution);
  const prompt = configuration.resultsSystemPrompt.replace(
    "{context}",
    context
  );
  const messages = [{ role: "system", content: prompt }, ...state.messages];
  const response = await model.invoke(messages);
  return { messages: [response] };
}

// Define the graph
const builder = new StateGraph(
  {
    stateSchema: AgentStateAnnotation,
    input: InputStateAnnotation,
  },
  AgentConfigurationAnnotation
)
  .addNode("selectFlow", selectFlow)
  .addNode("executeStep", executeStep)
  .addNode("returnFlowExecutionResult", returnFlowExecutionResult)
  .addEdge(START, "selectFlow")
  .addEdge("selectFlow", "executeStep")
  .addConditionalEdges("executeStep", checkFinished, [
    "executeStep",
    "returnFlowExecutionResult",
  ])
  .addEdge("returnFlowExecutionResult", END);

// Compile into a graph object that you can invoke and deploy.
export const graph = builder
  .compile()
  .withConfig({ runName: "RetrievalGraph" });
