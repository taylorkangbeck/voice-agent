#!/usr/bin/env node

import { getAgentForFlow } from "../lib/langgraph/executor/graph";

async function main() {
  try {
    // TODO define flowId and inputData
    const flowId = "123";

    console.log("Running LangGraph executor agent...");

    // Execute the graph with the flow and input data
    const result = (await getAgentForFlow(flowId)).invoke({
      messages: [{ role: "user", content: "Execute this workflow" }], // TODO: Add chat history
    });

    console.log("Flow execution completed:");
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error running langgraph entry point:", error);
    process.exit(1);
  }
}

main().catch(console.error);
