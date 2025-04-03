import neo4j from "neo4j-driver";
import { embedText } from "./embeddings";

// Import the TaskType enum from embeddings.ts
// If it's not exported, use the one from our integration test
enum TaskType {
  SEMANTIC_SIMILARITY = "SEMANTIC_SIMILARITY",
  CLASSIFICATION = "CLASSIFICATION",
  CLUSTERING = "CLUSTERING",
  RETRIEVAL_DOCUMENT = "RETRIEVAL_DOCUMENT",
  RETRIEVAL_QUERY = "RETRIEVAL_QUERY",
  QUESTION_ANSWERING = "QUESTION_ANSWERING",
  FACT_VERIFICATION = "FACT_VERIFICATION",
  CODE_RETRIEVAL_QUERY = "CODE_RETRIEVAL_QUERY",
}

const getNeo4jDriver = () => {
  if (!process.env.NEO4J_URI) {
    throw new Error("NEO4J_URI environment variable is required");
  }
  if (!process.env.NEO4J_PASSWORD) {
    throw new Error("NEO4J_PASSWORD environment variable is required");
  }
  if (!process.env.NEO4J_USER) {
    throw new Error("NEO4J_USERNAME environment variable is required");
  }
  return neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
    { disableLosslessIntegers: true } // (3)
  );
};

export const executeCypherQuery = async (
  query: string,
  params: Record<string, any> = {}
) => {
  const session = neo4jDriver.session();
  try {
    return await session.run(query, params);
  } finally {
    session.close();
  }
};

export const neo4jDriver = getNeo4jDriver();

type CreateActionNodeParams = {
  name: string;
  description: string;
};

export const createActionNode = async (params: CreateActionNodeParams) => {
  return await executeCypherQuery(
    `
      CREATE (action:Action {
        name: $name,
        description: $description,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN action
    `,
    params
  );
};

/**
 * Find an ActionNode by name
 * @param name The name of the ActionNode to find
 * @returns The ActionNode result if found, or null if not found
 */
export const findActionNodeByName = async (name: string) => {
  const result = await executeCypherQuery(
    `
      MATCH (action:Action {name: $name})
      RETURN action
    `,
    { name }
  );

  return result.records.length > 0 ? result : null;
};

/**
 * Delete an ActionNode by name
 * @param name The name of the ActionNode to delete
 * @returns The result of the delete operation
 */
export const deleteActionNodeByName = async (name: string) => {
  return await executeCypherQuery(
    `
      MATCH (action:Action {name: $name})
      DELETE action
    `,
    { name }
  );
};

/**
 * Create a vector index for ActionNodes
 * @param dimensions The number of dimensions for the embedding vectors (default: 768 for Gemini embeddings)
 * @param similarityFunction The similarity function to use (default: cosine)
 * @returns The result of the index creation operation
 */
export const createActionNodeVectorIndex = async (
  dimensions: number = 768,
  similarityFunction: string = "cosine"
) => {
  return await executeCypherQuery(
    `
    CREATE VECTOR INDEX action_embeddings
    FOR (n:Action) ON (n.embedding)
    OPTIONS {
      indexConfig: {
        "vector.dimensions": $dimensions,
        "vector.similarity_function": $similarityFunction
      }
    }
    `,
    { dimensions, similarityFunction }
  );
};

/**
 * Check if a vector index exists
 * @param indexName The name of the index to check
 * @returns Boolean indicating if the index exists
 */
export const vectorIndexExists = async (
  indexName: string = "action_embeddings"
) => {
  const result = await executeCypherQuery(
    `
    SHOW INDEXES
    WHERE name = $indexName
    `,
    { indexName }
  );

  return result.records.length > 0;
};

/**
 * Drop a vector index if it exists
 * @param indexName The name of the index to drop
 * @returns The result of the drop operation
 */
export const dropVectorIndex = async (
  indexName: string = "action_embeddings"
) => {
  const exists = await vectorIndexExists(indexName);
  if (exists) {
    return await executeCypherQuery(
      `
      DROP INDEX ${indexName}
      `
    );
  }
  return null;
};

/**
 * Calculate an embedding for text using Vertex AI (Gemini) and set it on an ActionNode
 * @param name The name of the ActionNode to update
 * @returns Result of the operation
 */
export const setActionNodeEmbedding = async (name: string) => {
  // First, retrieve the node text that we want to embed
  const actionNode = await findActionNodeByName(name);
  if (!actionNode || actionNode.records.length === 0) {
    throw new Error(`ActionNode with name ${name} not found`);
  }

  const description =
    actionNode.records[0].get("action").properties.description;

  // Use Vertex AI (Gemini) to generate embedding
  const embedding = await embedText(description, TaskType.SEMANTIC_SIMILARITY);
  if (!embedding || embedding.length === 0) {
    throw new Error("Failed to generate embedding");
  }

  // Set the embedding as a property on the ActionNode
  return await executeCypherQuery(
    `
    MATCH (a:Action {name: $name})
    CALL db.create.setNodeVectorProperty(a, 'embedding', $embedding)
    RETURN a
    `,
    {
      name,
      embedding: embedding[0].values, // Extract the actual vector values
    }
  );
};

/**
 * Find similar ActionNodes using vector similarity search
 * @param name The name of the reference ActionNode to find similar nodes for
 * @param limit The maximum number of similar nodes to return (default: 10)
 * @param threshold The minimum similarity score to include (default: 0.7)
 * @returns Array of similar ActionNodes with their similarity scores
 */
export const findSimilarActionNodes = async (
  name: string,
  limit: number = 10,
  threshold: number = 0.7
) => {
  // First check if the index exists
  const indexExists = await vectorIndexExists();
  if (!indexExists) {
    throw new Error("Vector index 'action_embeddings' does not exist");
  }

  // Get the reference node
  const actionNode = await findActionNodeByName(name);
  if (!actionNode || actionNode.records.length === 0) {
    throw new Error(`ActionNode with name ${name} not found`);
  }

  // Check if the reference node has an embedding
  const nodeProperties = actionNode.records[0].get("action").properties;
  if (!nodeProperties.embedding) {
    throw new Error(`ActionNode with name ${name} does not have an embedding`);
  }

  // Query similar nodes using vector index
  return await executeCypherQuery(
    `
    MATCH (a:Action {name: $name})
    CALL db.index.vector.queryNodes('action_embeddings', $limit, a.embedding)
    YIELD node AS similarNode, score
    WHERE score >= $threshold AND similarNode.name <> $name
    RETURN similarNode.name AS name, similarNode.description AS description, score
    ORDER BY score DESC
    `,
    { name, limit, threshold }
  );
};

/**
 * Direct similarity search between two ActionNodes
 * @param name1 First ActionNode name
 * @param name2 Second ActionNode name
 * @returns The similarity score between the two nodes
 */
export const calculateActionNodeSimilarity = async (
  name1: string,
  name2: string
) => {
  const result = await executeCypherQuery(
    `
    MATCH (a1:Action {name: $name1}), (a2:Action {name: $name2})
    WHERE a1.embedding IS NOT NULL AND a2.embedding IS NOT NULL
    RETURN vector.similarity.cosine(a1.embedding, a2.embedding) AS similarity
    `,
    { name1, name2 }
  );

  if (result.records.length === 0) {
    throw new Error(
      "Could not calculate similarity, nodes may not have embeddings"
    );
  }

  return result.records[0].get("similarity");
};
