import neo4j from "neo4j-driver";

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
