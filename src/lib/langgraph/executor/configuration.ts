import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation } from "@langchain/langgraph";

import { RESULTS_SYSTEM_PROMPT } from "./prompts.js";

/**
 * The configuration for the agent.
 */
export const AgentConfigurationAnnotation = Annotation.Root({
  // models
  /**
   * Name of the embedding model to use. Must be a valid embedding model name.
   */
  embeddingModel: Annotation<string>,

  /**
   * The language model used for processing and refining queries.
   * Should be in the form: provider/model-name.
   */
  queryModel: Annotation<string>,

  // For thinking and reasoning
  reasoningModel: Annotation<string>,

  /**
   * The language model used for generating responses.
   * Should be in the form: provider/model-name.
   */
  responseModel: Annotation<string>,

  /**
   * The system prompt used for generating responses.
   */
  resultsSystemPrompt: Annotation<string>,
});

/**
 * Create a typeof ConfigurationAnnotation.State instance from a RunnableConfig object.
 *
 * @param config - The configuration object to use.
 * @returns An instance of typeof ConfigurationAnnotation.State with the specified configuration.
 */
export function ensureAgentConfiguration(
  config: RunnableConfig
): typeof AgentConfigurationAnnotation.State {
  const configurable = (config?.configurable || {}) as Partial<
    typeof AgentConfigurationAnnotation.State
  >;
  return {
    embeddingModel:
      configurable.embeddingModel || "openai/text-embedding-3-small",
    queryModel: configurable.queryModel || "claude-3-5-haiku-latest",
    reasoningModel: configurable.reasoningModel || "claude-3-7-sonnet-latest",
    responseModel: configurable.responseModel || "claude-3-7-sonnet-latest",
    resultsSystemPrompt:
      configurable.resultsSystemPrompt || RESULTS_SYSTEM_PROMPT,
  };
}
