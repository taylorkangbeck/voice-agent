import { randomUUID } from "crypto";
import neo4j from "neo4j-driver";
import { embedText, TaskType } from "./embeddings";

// Node type definitions
export type CreateActionNodeParams = {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
};

export type CreateFlowNodeParams = {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
};

export type CreateFlowStepNodeParams = {
  name: string;
  instructions: string;
};

// Node response types
export type ActionNode = {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  embedding?: number[];
};

export type FlowNode = {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
};

export type FlowStepNode = {
  id: string;
  name: string;
  instructions: string;
};

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

export const createActionNode = async (params: CreateActionNodeParams) => {
  const { name, description, inputSchema, outputSchema } = params;
  const inputSchemaString = JSON.stringify(inputSchema);
  const outputSchemaString = JSON.stringify(outputSchema);

  return await executeCypherQuery(
    `
      CREATE (action:Action {
        id: $id,
        name: $name,
        description: $description,
        inputSchema: $inputSchema,
        outputSchema: $outputSchema
      })
      RETURN action
    `,
    {
      id: randomUUID(),
      name,
      description,
      inputSchema: inputSchemaString,
      outputSchema: outputSchemaString,
    }
  );
};

/**
 * Parse the properties of an Action node
 * @param result The Neo4j result containing an Action node
 * @returns The Action node with parsed properties
 */
export const parseActionNode = (result: any): ActionNode | null => {
  if (!result || !result.records || result.records.length === 0) {
    return null;
  }

  const action = { ...result.records[0].get("action").properties };

  // Parse the input and output schemas
  if (action.inputSchema && typeof action.inputSchema === "string") {
    try {
      action.inputSchema = JSON.parse(action.inputSchema);
    } catch (error) {
      console.error("Error parsing Action inputSchema:", error);
    }
  }

  if (action.outputSchema && typeof action.outputSchema === "string") {
    try {
      action.outputSchema = JSON.parse(action.outputSchema);
    } catch (error) {
      console.error("Error parsing Action outputSchema:", error);
    }
  }

  return action as ActionNode;
};

/**
 * Get an Action node by ID with parsed schemas
 * @param id The ID of the Action to find
 * @returns The Action node with parsed schemas if found, or null if not found
 */
export const getActionNodeById = async (
  id: string
): Promise<ActionNode | null> => {
  const result = await findActionNodeById(id);
  return parseActionNode(result);
};

/**
 * Get an Action node by name with parsed schemas
 * @param name The name of the Action to find
 * @returns The Action node with parsed schemas if found, or null if not found
 */
export const getActionNodeByName = async (
  name: string
): Promise<ActionNode | null> => {
  const result = await findActionNodeByName(name);
  return parseActionNode(result);
};

/**
 * Find an ActionNode by ID
 * @param id The ID of the ActionNode to find
 * @returns The ActionNode result if found, or null if not found
 */
export const findActionNodeById = async (id: string) => {
  const result = await executeCypherQuery(
    `
      MATCH (action:Action {id: $id})
      RETURN action
    `,
    { id }
  );

  return result.records.length > 0 ? result : null;
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
 * Delete an ActionNode by ID
 * @param id The ID of the ActionNode to delete
 * @returns The result of the delete operation
 */
export const deleteActionNodeById = async (id: string) => {
  return await executeCypherQuery(
    `
      MATCH (action:Action {id: $id})
      DELETE action
    `,
    { id }
  );
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
 * @param id The ID of the ActionNode to update
 * @returns Result of the operation
 */
export const setActionNodeEmbedding = async (id: string) => {
  // First, retrieve the node text that we want to embed
  const actionNode = await findActionNodeById(id);
  if (!actionNode || actionNode.records.length === 0) {
    throw new Error(`ActionNode with ID ${id} not found`);
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
    MATCH (a:Action {id: $id})
    CALL db.create.setNodeVectorProperty(a, 'embedding', $embedding)
    RETURN a
    `,
    {
      id,
      embedding: embedding[0].values, // Extract the actual vector values
    }
  );
};

/**
 * Calculate an embedding for text using Vertex AI (Gemini) and set it on an ActionNode
 * @param name The name of the ActionNode to update
 * @returns Result of the operation
 */
export const setActionNodeEmbeddingByName = async (name: string) => {
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
 * @param id The ID of the reference ActionNode to find similar nodes for
 * @param limit The maximum number of similar nodes to return (default: 10)
 * @param threshold The minimum similarity score to include (default: 0.7)
 * @returns Array of similar ActionNodes with their similarity scores
 */
export const findSimilarActionNodes = async (
  id: string,
  limit: number = 10,
  threshold: number = 0.7
) => {
  // First check if the index exists
  const indexExists = await vectorIndexExists();
  if (!indexExists) {
    throw new Error("Vector index 'action_embeddings' does not exist");
  }

  // Get the reference node
  const actionNode = await findActionNodeById(id);
  if (!actionNode || actionNode.records.length === 0) {
    throw new Error(`ActionNode with ID ${id} not found`);
  }

  // Check if the reference node has an embedding
  const nodeProperties = actionNode.records[0].get("action").properties;
  if (!nodeProperties.embedding) {
    throw new Error(`ActionNode with ID ${id} does not have an embedding`);
  }

  // Query similar nodes using vector index
  return await executeCypherQuery(
    `
    MATCH (a:Action {id: $id})
    CALL db.index.vector.queryNodes('action_embeddings', $limit, a.embedding)
    YIELD node AS similarNode, score
    WHERE score >= $threshold AND similarNode.id <> $id
    RETURN similarNode.id AS id, similarNode.name AS name, similarNode.description AS description, score
    ORDER BY score DESC
    `,
    { id, limit, threshold }
  );
};

/**
 * Find similar ActionNodes using vector similarity search by name
 * @param name The name of the reference ActionNode to find similar nodes for
 * @param limit The maximum number of similar nodes to return (default: 10)
 * @param threshold The minimum similarity score to include (default: 0.7)
 * @returns Array of similar ActionNodes with their similarity scores
 */
export const findSimilarActionNodesByName = async (
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
 * @param id1 First ActionNode ID
 * @param id2 Second ActionNode ID
 * @returns The similarity score between the two nodes
 */
export const calculateActionNodeSimilarity = async (
  id1: string,
  id2: string
) => {
  const result = await executeCypherQuery(
    `
    MATCH (a1:Action {id: $id1}), (a2:Action {id: $id2})
    WHERE a1.embedding IS NOT NULL AND a2.embedding IS NOT NULL
    RETURN vector.similarity.cosine(a1.embedding, a2.embedding) AS similarity
    `,
    { id1, id2 }
  );

  if (result.records.length === 0) {
    throw new Error(
      "Could not calculate similarity, nodes may not have embeddings"
    );
  }

  return result.records[0].get("similarity");
};

/**
 * Direct similarity search between two ActionNodes using names
 * @param name1 First ActionNode name
 * @param name2 Second ActionNode name
 * @returns The similarity score between the two nodes
 */
export const calculateActionNodeSimilarityByName = async (
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

/**
 * Create a Flow node
 * @param params Parameters for creating a Flow node
 * @returns The created Flow node
 */
export const createFlowNode = async (params: CreateFlowNodeParams) => {
  return await executeCypherQuery(
    `
      CREATE (flow:Flow {
        id: $id,
        name: $name,
        description: $description,
        inputSchema: $inputSchema
      })
      RETURN flow
    `,
    {
      id: randomUUID(),
      ...params,
      inputSchema: JSON.stringify(params.inputSchema),
    }
  );
};

/**
 * Find a Flow node by name
 * @param name The name of the Flow to find
 * @returns The Flow result if found, or null if not found
 */
export const findFlowNodeByName = async (name: string) => {
  const result = await executeCypherQuery(
    `
      MATCH (flow:Flow {name: $name})
      RETURN flow
    `,
    { name }
  );

  return result.records.length > 0 ? result : null;
};

/**
 * Parse the properties of a Flow node
 * @param result The Neo4j result containing a Flow node
 * @returns The Flow node with parsed properties
 */
export const parseFlowNode = (result: any): FlowNode | null => {
  if (!result || !result.records || result.records.length === 0) {
    return null;
  }

  const flow = { ...result.records[0].get("flow").properties };

  // Parse the input schema
  if (flow.inputSchema && typeof flow.inputSchema === "string") {
    try {
      flow.inputSchema = JSON.parse(flow.inputSchema);
    } catch (error) {
      console.error("Error parsing Flow inputSchema:", error);
    }
  }

  return flow as FlowNode;
};

/**
 * Delete a Flow node by ID
 * @param id The ID of the Flow to delete
 * @returns The result of the delete operation
 */
export const deleteFlowNodeById = async (id: string) => {
  return await executeCypherQuery(
    `
      MATCH (flow:Flow {id: $id})
      DETACH DELETE flow
    `,
    { id }
  );
};

/**
 * Delete a Flow node by name
 * @param name The name of the Flow to delete
 * @returns The result of the delete operation
 */
export const deleteFlowNodeByName = async (name: string) => {
  return await executeCypherQuery(
    `
      MATCH (flow:Flow {name: $name})
      DELETE flow
    `,
    { name }
  );
};

/**
 * Get a Flow node by name with parsed properties
 * @param name The name of the Flow to find
 * @returns The Flow node if found, or null if not found
 */
export const getFlowNodeByName = async (
  name: string
): Promise<FlowNode | null> => {
  const result = await findFlowNodeByName(name);
  return parseFlowNode(result);
};

/**
 * Set the start step for a Flow
 * @param flowId The ID of the Flow
 * @param stepId The ID of the FlowStep to set as start
 * @returns Result of the operation
 */
export const setFlowStartStep = async (flowId: string, stepId: string) => {
  return await executeCypherQuery(
    `
    MATCH (flow:Flow {id: $flowId})
    MATCH (step:FlowStep {id: $stepId})
    MERGE (flow)-[r:START]->(step)
    RETURN flow, step
    `,
    { flowId, stepId }
  );
};

/**
 * Set the start step for a Flow
 * @param flowName The name of the Flow
 * @param stepName The name of the FlowStep to set as start
 * @returns Result of the operation
 */
export const setFlowStartStepByName = async (
  flowName: string,
  stepName: string
) => {
  return await executeCypherQuery(
    `
    MATCH (flow:Flow {name: $flowName})
    MATCH (step:FlowStep {name: $stepName})
    MERGE (flow)-[r:START]->(step)
    RETURN flow, step
    `,
    { flowName, stepName }
  );
};

/**
 * Create a FlowStep node
 * @param params Parameters for creating a FlowStep node
 * @returns The created FlowStep node
 */
export const createFlowStepNode = async (params: CreateFlowStepNodeParams) => {
  return await executeCypherQuery(
    `
      CREATE (step:FlowStep {
        id: $id,
        name: $name,
        instructions: $instructions
      })
      RETURN step
    `,
    {
      id: randomUUID(),
      ...params,
      instructions: params.instructions,
    }
  );
};

/**
 * Find a FlowStep node by name
 * @param name The name of the FlowStep to find
 * @returns The FlowStep result if found, or null if not found
 */
export const findFlowStepByName = async (name: string) => {
  const result = await executeCypherQuery(
    `
      MATCH (step:FlowStep {name: $name})
      RETURN step
    `,
    { name }
  );

  return result.records.length > 0 ? result : null;
};

/**
 * Parse the properties of a FlowStep node
 * @param result The Neo4j result containing a FlowStep node
 * @returns The FlowStep node with parsed properties
 */
export const parseFlowStepNode = (result: any): FlowStepNode | null => {
  if (!result || !result.records || result.records.length === 0) {
    return null;
  }

  const step = { ...result.records[0].get("step").properties };
  return step as FlowStepNode;
};

/**
 * Get a FlowStep node by name with parsed properties
 * @param name The name of the FlowStep to find
 * @returns The FlowStep node if found, or null if not found
 */
export const getFlowStepByName = async (
  name: string
): Promise<FlowStepNode | null> => {
  const result = await findFlowStepByName(name);
  return parseFlowStepNode(result);
};

/**
 * Delete a FlowStep node by name
 * @param name The name of the FlowStep to delete
 * @returns The result of the delete operation
 */
export const deleteFlowStepByName = async (name: string) => {
  return await executeCypherQuery(
    `
      MATCH (step:FlowStep {name: $name})
      DETACH DELETE step
    `,
    { name }
  );
};

/**
 * Set the next step for a FlowStep
 * @param currentStepId The ID of the current FlowStep
 * @param nextStepId The ID of the next FlowStep
 * @returns Result of the operation
 */
export const setFlowStepNext = async (
  currentStepId: string,
  nextStepId: string
) => {
  return await executeCypherQuery(
    `
    MATCH (current:FlowStep {id: $currentStepId})
    MATCH (next:FlowStep {id: $nextStepId})
    MERGE (current)-[r:NEXT]->(next)
    RETURN current, next
    `,
    { currentStepId, nextStepId }
  );
};

/**
 * Set the next step for a FlowStep using names
 * @param currentStepName The name of the current FlowStep
 * @param nextStepName The name of the next FlowStep
 * @returns Result of the operation
 */
export const setFlowStepNextByName = async (
  currentStepName: string,
  nextStepName: string
) => {
  return await executeCypherQuery(
    `
    MATCH (current:FlowStep {name: $currentStepName})
    MATCH (next:FlowStep {name: $nextStepName})
    MERGE (current)-[r:NEXT]->(next)
    RETURN current, next
    `,
    { currentStepName, nextStepName }
  );
};

/**
 * Set the implementation for a FlowStep (Action)
 * @param stepId The ID of the FlowStep
 * @param actionId The ID of the implementation
 * @returns Result of the operation
 */
export const setFlowStepAction = async (stepId: string, actionId: string) => {
  const implementationLabel = "Action";

  return await executeCypherQuery(
    `
    MATCH (step:FlowStep {id: $stepId})
    MATCH (impl:${implementationLabel} {id: $implementationId})
    MERGE (step)-[r:EXECUTES]->(impl)
    RETURN step, impl
    `,
    { stepId, implementationId: actionId }
  );
};

/**
 * Set the implementation for a FlowStep (Action) using names
 * @param stepName The name of the FlowStep
 * @param implementationName The name of the implementation
 * @returns Result of the operation
 */
export const setFlowStepActionByName = async (
  stepName: string,
  implementationName: string
) => {
  const implementationLabel = "Action";

  return await executeCypherQuery(
    `
    MATCH (step:FlowStep {name: $stepName})
    MATCH (impl:${implementationLabel} {name: $implementationName})
    MERGE (step)-[r:EXECUTES]->(impl)
    RETURN step, impl
    `,
    { stepName, implementationName }
  );
};

/**
 * Find a Flow node by ID
 * @param id The ID of the Flow to find
 * @returns The Flow result if found, or null if not found
 */
export const findFlowNodeById = async (id: string) => {
  const result = await executeCypherQuery(
    `
      MATCH (flow:Flow {id: $id})
      RETURN flow
    `,
    { id }
  );

  return result.records.length > 0 ? result : null;
};

/**
 * Get a Flow node by ID with parsed properties
 * @param id The ID of the Flow to find
 * @returns The Flow node if found, or null if not found
 */
export const getFlowNodeById = async (id: string): Promise<FlowNode | null> => {
  const result = await findFlowNodeById(id);
  return parseFlowNode(result);
};

/**
 * Find a FlowStep node by ID
 * @param id The ID of the FlowStep to find
 * @returns The FlowStep result if found, or null if not found
 */
export const findFlowStepById = async (id: string) => {
  const result = await executeCypherQuery(
    `
      MATCH (step:FlowStep {id: $id})
      RETURN step
    `,
    { id }
  );

  return result.records.length > 0 ? result : null;
};

/**
 * Get a FlowStep node by ID with parsed properties
 * @param id The ID of the FlowStep to find
 * @returns The FlowStep node if found, or null if not found
 */
export const getFlowStepById = async (
  id: string
): Promise<FlowStepNode | null> => {
  const result = await findFlowStepById(id);
  return parseFlowStepNode(result);
};

/**
 * Delete a FlowStep node by ID
 * @param id The ID of the FlowStep to delete
 * @returns The result of the delete operation
 */
export const deleteFlowStepById = async (id: string) => {
  return await executeCypherQuery(
    `
      MATCH (step:FlowStep {id: $id})
      DETACH DELETE step
    `,
    { id }
  );
};
