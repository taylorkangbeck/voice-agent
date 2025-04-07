import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { Flow, FlowExecution } from "../../../types.js";

/**
 * Represents the input state for the agent.
 * This is a restricted version of the State that defines a narrower interface
 * to the outside world compared to what is maintained internally.
 */
export const InputStateAnnotation = Annotation.Root({
  /**
   * Messages track the primary execution state of the agent.
   * @type {BaseMessage[]}
   * @description
   * Typically accumulates a pattern of Human/AI/Human/AI messages. If combined with a
   * tool-calling ReAct agent pattern, it may follow this sequence:
   * 1. HumanMessage - user input
   * 2. AIMessage with .tool_calls - agent picking tool(s) to use
   * 3. ToolMessage(s) - responses (or errors) from executed tools
   *    (... repeat steps 2 and 3 as needed ...)
   * 4. AIMessage without .tool_calls - agent's unstructured response to user
   * 5. HumanMessage - user's next conversational turn
   *    (... repeat steps 2-5 as needed ...)
   */
  ...MessagesAnnotation.spec,

  flowId: Annotation<string>,
});

/**
 * Represents the state of the tasker graph / agent.
 */
export const AgentStateAnnotation = Annotation.Root({
  ...InputStateAnnotation.spec,

  flow: Annotation<Flow>,
  flowExecution: Annotation<FlowExecution>,
  currentStep: Annotation<number>,

  // Routing and validation state
  needsMoreInfo: Annotation<boolean>,

  // Step execution state
  lastStepSuccess: Annotation<boolean>,
  lastStepOutput: Annotation<any>,
  lastStepError: Annotation<string>,

  // Evaluation state
  outputEvaluation: Annotation<string>,
  isOutputValid: Annotation<boolean>,
  failed: Annotation<boolean>,
  failedReason: Annotation<string>,
  completed: Annotation<boolean>,
});
