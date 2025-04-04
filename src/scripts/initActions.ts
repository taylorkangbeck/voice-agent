#!/usr/bin/env node

import notionActions from "../actions/notion";
import { createActionNode } from "../lib/neo4j";

async function main() {
  try {
    console.log("Creating Notion action nodes...");

    // Get all Notion actions
    const actions = Object.values(notionActions);

    // Create an action node for each Notion action
    for (const action of actions) {
      console.log(`Creating action node: ${action.name}`);
      await createActionNode({
        name: action.name,
        description: action.description,
        inputSchema: action.inputSchema,
        outputSchema: action.outputSchema,
      });
    }

    console.log(`Successfully created ${actions.length} Notion action nodes`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating actions:", error);
    process.exit(1);
  }
}

main().catch(console.error);
