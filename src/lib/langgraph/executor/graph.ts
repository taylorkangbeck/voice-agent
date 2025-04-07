import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { Flow } from "../../../types";
import { getFlowById } from "../../neo4j";
import { ensureAgentConfiguration } from "./configuration";

const getActionTools = (flow: Flow) => {
  return flow.steps.map((step) => {
    return tool(step.action.execute, {
      name: step.action.name,
      description: step.action.description,
      schema: step.action.inputSchema,
    });
  });
};

const getSystemPrompt = (flow: Flow) => {
  const systemPrompt = `You are a workflow execution assistant that helps users complete the "${
    flow.name
  }" flow.

The flow is a way to automate tasks and get things done to achieve the caller's goals.
The flow has a start step and a series of steps that need to be executed in order.
Each step has a name, instructions, and an action tool that can be used to execute the step.

INSTRUCTIONS:
You have access to tools that correspond to each step in the workflow. Use these tools to execute the steps. The tools are called actions.
You will receive a plain text request for running the flow that should include information needed to complete the flow.
However, the request may be incomplete or missing information. Sometimes things may be misspelled or unclear.
If you need to clarify something or additional information to complete the flow, ask the user for clarification.
While you are executing the flow, you should inform the user of your thought process and the progress of the flow.
If you encounter any issues or errors, do not keep trying to execute the flow. You should tell the user that the flow failed and provide a detailed explanation of the error as well as any suggestions for how to resolve the issue.
When all steps are completed successfully, inform the user that the workflow is complete and provide a summary of the results.

WORKFLOW DESCRIPTION:
${flow.description || "None provided."}

WORKFLOW INPUT SCHEMA:
${JSON.stringify(flow.inputSchema, null, 2)}

STEPS TO EXECUTE (in order):
${flow.steps
  .map(
    (step, index) =>
      `
Step #${index + 1}:
- name: ${step.name}
- associated action tool: ${step.action.name}
- additional instructions: ${step.instructions || "None provided."}`
  )
  .join("\n")}
`;

  return systemPrompt;
};

export const getAgentForFlow = async (flowId: string) => {
  const flow = await getFlowById(flowId);

  if (!flow) {
    throw new Error(`Flow with id ${flowId} not found`);
  }

  const configuration = ensureAgentConfiguration({});

  const systemPrompt = getSystemPrompt(flow);

  const model = new ChatAnthropic({
    model: configuration.queryModel,
    temperature: 0,
  });

  const agent = createReactAgent({
    llm: model,
    tools: getActionTools(flow),
    prompt: systemPrompt,
  });

  return agent;
};

export const makeGraph = async (config: LangGraphRunnableConfig) => {
  const testFlowId = "feb37840-05b1-411b-a9e1-94513e749245";
  const agent = await getAgentForFlow(testFlowId);
  return agent;
};
