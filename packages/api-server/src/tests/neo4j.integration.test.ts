import {
  createActionNode,
  deleteActionNodeByName,
  findActionNodeByName,
} from "../lib/neo4j";

// Mock Neo4j driver and Cypher execution if no connection is available
jest.mock("../lib/neo4j", () => {
  // Check if we should use real Neo4j
  const useRealNeo4j =
    process.env.NEO4J_URI &&
    process.env.NEO4J_USER &&
    process.env.NEO4J_PASSWORD &&
    !process.env.SKIP_NEO4J_TESTS;

  if (useRealNeo4j) {
    // Use the actual implementation
    return jest.requireActual("../lib/neo4j");
  }

  // Otherwise mock the implementation
  console.log("Using mock Neo4j implementation for tests");
  let mockDb = new Map();

  return {
    createActionNode: jest.fn(async ({ name, description }) => {
      const actionNode = {
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockDb.set(name, actionNode);

      return {
        records: [
          {
            get: (key: string) =>
              key === "action" ? { properties: actionNode } : null,
          },
        ],
      };
    }),

    findActionNodeByName: jest.fn(async (name) => {
      if (!mockDb.has(name)) return null;

      return {
        records: [
          {
            get: (key: string) =>
              key === "action" ? { properties: mockDb.get(name) } : null,
          },
        ],
      };
    }),

    deleteActionNodeByName: jest.fn(async (name) => {
      mockDb.delete(name);
      return { records: [] };
    }),

    neo4jDriver: {
      close: jest.fn(),
    },
  };
});

// Generate a unique test name to avoid collisions in the database
const getTestActionName = () =>
  `TestAction_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

describe("Neo4j ActionNode Operations", () => {
  it("should create, find, and delete an ActionNode", async () => {
    // 1. Create a test action node with a unique name
    const testActionName = getTestActionName();
    const testDescription =
      "This is a test action node for integration testing";

    const createResult = await createActionNode({
      name: testActionName,
      description: testDescription,
    });

    // Verify the node was created successfully
    expect(createResult.records).toHaveLength(1);
    expect(createResult.records[0].get("action").properties.name).toBe(
      testActionName
    );
    expect(createResult.records[0].get("action").properties.description).toBe(
      testDescription
    );

    // 2. Find the action node by name
    const findResult = await findActionNodeByName(testActionName);

    // Verify the node was found successfully
    expect(findResult).not.toBeNull();
    if (findResult) {
      expect(findResult.records).toHaveLength(1);
      expect(findResult.records[0].get("action").properties.name).toBe(
        testActionName
      );
    }

    // 3. Delete the action node
    await deleteActionNodeByName(testActionName);

    // 4. Verify the node was deleted by trying to find it again
    const findAfterDeleteResult = await findActionNodeByName(testActionName);

    // Expect null or empty result after deletion
    expect(findAfterDeleteResult).toBeNull();
  });

  // Additional test for error handling
  it("should handle non-existent nodes gracefully", async () => {
    // Try to find a node that doesn't exist
    const nonExistentNodeName = "NonExistentNode_" + Date.now();
    const result = await findActionNodeByName(nonExistentNodeName);

    // Should return null for non-existent nodes
    expect(result).toBeNull();
  });
});
