#!/usr/bin/env node

import {
  createFlowNode,
  createFlowStepNode,
  getActionNodeByName,
  setFlowStartStep,
  setFlowStepAction,
  setFlowStepNext,
} from "../lib/neo4j";

async function main() {
  try {
    // Create the flow steps
    console.log("Creating search step...");
    const searchStep = await createFlowStepNode({
      name: "NotionSearchForPageStep",
      instructions:
        "For a task, the page name is under result.properties?.['Task name']?.title?.[0]?.plain_text",
    });
    const searchStepId = searchStep.records[0].get("step").properties.id;
    console.log(`Search step created with ID: ${searchStepId}`);

    console.log("Creating update page step...");
    const updateStep = await createFlowStepNode({
      name: "NotionUpdatePageStatusStep",
      instructions:
        "Update the page status to the provided status by passing it in the properties object. Valid statuses are 'On Hold', 'In Progress', 'Completed', and 'Not Started'.", // really there should be another step to get valid statuses
    });
    const updateStepId = updateStep.records[0].get("step").properties.id;
    console.log(`Update step created with ID: ${updateStepId}`);

    // Get the ID for the Search action node
    const searchAction = await getActionNodeByName("NotionSearch");
    if (!searchAction) {
      throw new Error("NotionSearch action not found");
    }
    const searchActionId = searchAction.id;

    // Set the implementations for the steps
    console.log("Setting Search action for search step...");
    await setFlowStepAction(searchStepId, searchActionId);

    // Get the ID for the UpdatePage action node
    const updateAction = await getActionNodeByName("NotionUpdatePage");
    if (!updateAction) {
      throw new Error("NotionUpdatePage action not found");
    }
    const updateActionId = updateAction.id;

    console.log("Setting NotionUpdatePage action for update step...");
    await setFlowStepAction(updateStepId, updateActionId);

    // Create the NEXT edge from search to update
    console.log("Creating NEXT edge from search to update step...");
    await setFlowStepNext(searchStepId, updateStepId);

    // Create the Flow node
    console.log("Creating flow node...");
    const result = await createFlowNode({
      name: "NotionFindPageAndUpdateStatus",
      description: "Searches for a Notion page and then updates its status",
      inputSchema: {
        type: "object",
        properties: {
          pageName: { type: "string" },
          status: { type: "string" },
        },
      },
    });
    const flowId = result.records[0].get("flow").properties.id;
    // Set the start step
    console.log("Setting start step...");
    await setFlowStartStep(flowId, searchStepId);

    console.log("Flow created successfully!");
    console.log(result.records[0].get("flow").properties);
    process.exit(0);
  } catch (error) {
    console.error("Error creating flow:", error);
    process.exit(1);
  }
}

main().catch(console.error);
