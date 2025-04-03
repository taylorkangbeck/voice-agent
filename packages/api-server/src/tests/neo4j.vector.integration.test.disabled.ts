import {
  calculateActionNodeSimilarity,
  createActionNode,
  createActionNodeVectorIndex,
  deleteActionNodeByName,
  dropVectorIndex,
  findSimilarActionNodes,
  setActionNodeEmbedding,
  vectorIndexExists,
} from "../lib/neo4j";

// Define types for our mock objects
interface MockActionNode {
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  embedding?: number[];
}

interface MockIndex {
  name: string;
  dimensions: number;
  similarityFunction: string;
}

interface MockSimilarityResult {
  name: string;
  description: string;
  score: number;
}

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

  let mockDb = new Map<string, MockActionNode>();
  let mockIndex: MockIndex | null = null;

  // Mock embeddings for vector operations
  const mockEmbeddings: Record<string, number[]> = {
    actionA: [0.1, 0.2, 0.3, 0.4, 0.5],
    actionB: [0.15, 0.25, 0.35, 0.45, 0.55],
    actionC: [0.9, 0.8, 0.7, 0.6, 0.5],
  };

  return {
    createActionNode: jest.fn(async ({ name, description }) => {
      const actionNode: MockActionNode = {
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

    createActionNodeVectorIndex: jest.fn(
      async (dimensions = 768, similarityFunction = "cosine") => {
        mockIndex = {
          name: "action_embeddings",
          dimensions,
          similarityFunction,
        };
        return {
          records: [
            {
              get: (key: string) =>
                key === "name" ? "action_embeddings" : null,
            },
          ],
        };
      }
    ),

    vectorIndexExists: jest.fn(async (indexName = "action_embeddings") => {
      return mockIndex !== null && mockIndex.name === indexName;
    }),

    dropVectorIndex: jest.fn(async (indexName = "action_embeddings") => {
      if (mockIndex && mockIndex.name === indexName) {
        mockIndex = null;
        return { records: [] };
      }
      return null;
    }),

    setActionNodeEmbedding: jest.fn(async (name: string) => {
      if (!mockDb.has(name))
        throw new Error(`ActionNode with name ${name} not found`);

      const node = mockDb.get(name)!;
      // Use predefined mock embeddings or a default
      const embeddingValues = mockEmbeddings[name] || [0.1, 0.2, 0.3, 0.4, 0.5];
      node.embedding = embeddingValues;
      mockDb.set(name, node);

      return {
        records: [
          {
            get: (key: string) => (key === "a" ? { properties: node } : null),
          },
        ],
      };
    }),

    findSimilarActionNodes: jest.fn(
      async (name: string, limit = 10, threshold = 0.7) => {
        if (!mockIndex)
          throw new Error("Vector index 'action_embeddings' does not exist");
        if (!mockDb.has(name))
          throw new Error(`ActionNode with name ${name} not found`);

        const referenceNode = mockDb.get(name)!;
        if (!referenceNode.embedding)
          throw new Error(
            `ActionNode with name ${name} does not have an embedding`
          );

        // Calculate similarity with all other nodes
        const results: MockSimilarityResult[] = [];
        for (const [otherName, otherNode] of mockDb.entries()) {
          if (otherName !== name && otherNode.embedding) {
            // Simple mock similarity - in real application this would use vector math
            const score = otherName.includes(name.substring(0, 3)) ? 0.9 : 0.5;
            if (score >= threshold) {
              results.push({
                name: otherName,
                description: otherNode.description,
                score,
              });
            }
          }
        }

        // Sort by score and limit
        results.sort((a, b) => b.score - a.score);
        const limitedResults = results.slice(0, limit);

        return {
          records: limitedResults.map((result) => ({
            get: (key: string) => result[key as keyof MockSimilarityResult],
          })),
        };
      }
    ),

    calculateActionNodeSimilarity: jest.fn(
      async (name1: string, name2: string) => {
        if (!mockDb.has(name1) || !mockDb.has(name2)) {
          throw new Error("One or both nodes not found");
        }

        const node1 = mockDb.get(name1)!;
        const node2 = mockDb.get(name2)!;

        if (!node1.embedding || !node2.embedding) {
          throw new Error(
            "Could not calculate similarity, nodes may not have embeddings"
          );
        }

        // Simple mock similarity - in real application this would use cosine similarity
        const score =
          name1.substring(0, 3) === name2.substring(0, 3) ? 0.9 : 0.5;

        // Return the score directly as a number, not as a Neo4j result record
        return score;
      }
    ),

    neo4jDriver: {
      close: jest.fn(),
    },
  };
});

// Mock the embeddings module
jest.mock("../lib/embeddings", () => {
  return {
    embedText: jest.fn().mockResolvedValue([
      {
        values: [0.1, 0.2, 0.3, 0.4, 0.5],
        statistics: {
          truncated: false,
          tokenCount: 5,
        },
      },
    ]),
  };
});

// Generate a unique test name to avoid collisions in the database
const getTestActionName = () =>
  `TestAction_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

describe("Neo4j Vector Operations", () => {
  // Array to track created test nodes for cleanup
  const testNodes: string[] = [];

  // Make sure index exists before each test
  beforeEach(async () => {
    // Check if index exists, create if not
    const exists = await vectorIndexExists();
    if (!exists) {
      await createActionNodeVectorIndex();
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    // Drop the index
    await dropVectorIndex();

    // Delete any test nodes
    for (const nodeName of testNodes) {
      await deleteActionNodeByName(nodeName);
    }
  });

  it("should create and drop a vector index for ActionNodes", async () => {
    // Create the vector index
    await createActionNodeVectorIndex();

    // Verify it exists
    const exists = await vectorIndexExists();
    expect(exists).toBe(true);

    // Drop the index
    await dropVectorIndex();

    // Verify it no longer exists
    const existsAfterDrop = await vectorIndexExists();
    expect(existsAfterDrop).toBe(false);

    // Recreate for subsequent tests
    await createActionNodeVectorIndex();
  });

  it("should create an ActionNode and set its embedding", async () => {
    // Create a test node
    const testName = getTestActionName();
    testNodes.push(testName); // Track for cleanup

    await createActionNode({
      name: testName,
      description: "This is a test node for vector embedding",
    });

    // Set the embedding
    const result = await setActionNodeEmbedding(testName);

    // Verify
    expect(result).toBeDefined();
    expect(result.records).toHaveLength(1);

    // In our mock implementation, verify the node now has an embedding property
    const node = result.records[0].get("a");
    expect(node).toBeDefined();
    expect(node.properties.embedding).toBeDefined();
  });

  it("should find similar ActionNodes using vector search", async () => {
    // Create multiple test nodes
    const baseTestName = `VectorTest_${Date.now()}`;
    const testNames = [
      `${baseTestName}_A`,
      `${baseTestName}_B`,
      `${baseTestName}_C`,
    ];

    // Create nodes and set embeddings
    for (const name of testNames) {
      testNodes.push(name); // Track for cleanup
      await createActionNode({
        name,
        description: `This is a vector test node ${name}`,
      });
      await setActionNodeEmbedding(name);
    }

    // Find similar nodes to the first node
    const similarResults = await findSimilarActionNodes(testNames[0]);

    // Verify we get results
    expect(similarResults).toBeDefined();
    expect(similarResults.records.length).toBeGreaterThan(0);

    // Verify the similar nodes have names, descriptions and scores
    const firstResult = similarResults.records[0];
    expect(firstResult.get("name")).toBeDefined();
    expect(firstResult.get("description")).toBeDefined();
    expect(firstResult.get("score")).toBeDefined();
  });

  it("should calculate similarity between two ActionNodes", async () => {
    // Create two similar test nodes
    const baseTestName = `SimilarityTest_${Date.now()}`;
    const testName1 = `${baseTestName}_X`;
    const testName2 = `${baseTestName}_Y`;

    testNodes.push(testName1, testName2); // Track for cleanup

    // Create nodes with similar descriptions
    await createActionNode({
      name: testName1,
      description: "This is a test node about vector similarity calculation",
    });

    await createActionNode({
      name: testName2,
      description: "This test node is also about vector similarity calculation",
    });

    // Set embeddings
    await setActionNodeEmbedding(testName1);
    await setActionNodeEmbedding(testName2);

    // Calculate similarity
    const similarityScore = await calculateActionNodeSimilarity(
      testName1,
      testName2
    );

    // Verify we get a score between 0 and 1
    expect(similarityScore).toBeDefined();
    expect(typeof similarityScore).toBe("number");
    expect(similarityScore).toBeGreaterThanOrEqual(0);
    expect(similarityScore).toBeLessThanOrEqual(1);
  });
});
