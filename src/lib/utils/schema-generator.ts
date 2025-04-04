import path from "path";
import { createGenerator } from "ts-json-schema-generator";
import { getNotionAction, listNotionActions } from "../../actions/notion";

// Action name to type name mapping
const ACTION_TYPE_MAP: Record<string, string> = {
  search: "SearchParameters",
  updatePage: "UpdatePageParameters",
  retrievePage: "GetPageParameters",
  createPage: "CreatePageParameters",
  queryDatabase: "QueryDatabaseParameters",
  retrieveDatabase: "GetDatabaseParameters",
  listDatabases: "ListDatabasesParameters",
  updateDatabase: "UpdateDatabaseParameters",
  createDatabase: "CreateDatabaseParameters",
  retrieveBlock: "GetBlockParameters",
  updateBlock: "UpdateBlockParameters",
  deleteBlock: "DeleteBlockParameters",
  appendBlockChildren: "AppendBlockChildrenParameters",
  listBlockChildren: "ListBlockChildrenParameters",
  retrieveUser: "GetUserParameters",
  listUsers: "ListUsersParameters",
  retrieveCurrentUser: "GetSelfParameters",
  createComment: "CreateCommentParameters",
  listComments: "ListCommentsParameters",
  retrievePageProperty: "GetPagePropertyParameters",
};

// Property name mappings (camelCase to snake_case)
const PROPERTY_MAPPINGS: Record<string, Record<string, string>> = {
  updatePage: {
    pageId: "page_id",
  },
  retrievePage: {
    pageId: "page_id",
  },
  retrieveBlock: {
    blockId: "block_id",
  },
  updateBlock: {
    blockId: "block_id",
  },
  deleteBlock: {
    blockId: "block_id",
  },
  appendBlockChildren: {
    blockId: "block_id",
  },
  listBlockChildren: {
    blockId: "block_id",
    startCursor: "start_cursor",
    pageSize: "page_size",
  },
  retrieveDatabase: {
    databaseId: "database_id",
  },
  queryDatabase: {
    databaseId: "database_id",
    startCursor: "start_cursor",
    pageSize: "page_size",
  },
  updateDatabase: {
    databaseId: "database_id",
  },
  retrievePageProperty: {
    pageId: "page_id",
    propertyId: "property_id",
  },
  retrieveUser: {
    userId: "user_id",
  },
  search: {
    startCursor: "start_cursor",
    pageSize: "page_size",
  },
};

/**
 * Convert TypeScript types to JSON schemas
 */
export function generateJsonSchemaFromType(typeName: string): any {
  const config = {
    path: path.resolve(
      process.cwd(),
      "node_modules/@notionhq/client/build/src/api-endpoints.d.ts"
    ),
    tsconfig: path.resolve(process.cwd(), "tsconfig.json"),
    type: typeName,
    skipTypeCheck: true,
  };

  try {
    const generator = createGenerator(config);
    return generator.createSchema(typeName);
  } catch (error) {
    console.error(`Error generating schema for ${typeName}:`, error);
    return null;
  }
}

/**
 * Convert Notion action input types to dynamic parameters
 */
export function generateDynamicParametersFromAction(
  actionName: string
): Array<any> {
  const typeName = ACTION_TYPE_MAP[actionName];
  if (!typeName) {
    console.warn(`No type mapping found for action: ${actionName}`);
    return [];
  }

  // Generate the schema
  const schema = generateJsonSchemaFromType(typeName);
  if (!schema) return [];

  // Extract properties from schema
  const properties = schema.definitions?.[typeName]?.properties || {};

  // Convert schema properties to dynamic parameters
  return Object.entries(properties).map(
    ([propName, propSchema]: [string, any]) => {
      // Convert snake_case to camelCase for better UX
      const paramName = propName.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );

      // Special handling for known complex objects
      let schemaType = propSchema.type || "string";
      let schemaProps = {};

      // Handle object types better
      if (schemaType === "object" || propSchema.properties) {
        schemaProps = {
          properties: propSchema.properties || {},
          additionalProperties: true,
          // For Ultravox, we should note that objects can be passed as strings
          description: `${
            propSchema.description || `The ${propName} parameter`
          } (Can be provided as a JSON string or an object)`,
        };
      } else {
        schemaProps = {
          description: propSchema.description || `The ${propName} parameter`,
          ...(propSchema.enum ? { enum: propSchema.enum } : {}),
        };
      }

      return {
        name: paramName,
        location: "PARAMETER_LOCATION_BODY",
        schema: {
          type: schemaType,
          ...schemaProps,
        },
        required:
          schema.definitions?.[typeName]?.required?.includes(propName) || false,
      };
    }
  );
}

/**
 * Generate mapping of camelCase to snake_case property names
 */
export function generatePropertyMappings(
  actionName: string
): Record<string, string> {
  return PROPERTY_MAPPINGS[actionName] || {};
}

/**
 * Get a list of all available Notion actions
 */
export function getAllNotionActions(): string[] {
  return listNotionActions().filter(
    (action) => ACTION_TYPE_MAP[action] !== undefined
  );
}

/**
 * Generate tool configurations for all Notion actions
 */
export function generateAllNotionToolConfigs(): Record<string, any> {
  const tools: Record<string, any> = {};

  getAllNotionActions().forEach((actionName) => {
    const action = getNotionAction(actionName);
    if (!action) return;

    const dynamicParameters = generateDynamicParametersFromAction(actionName);

    tools[`${actionName}Notion`] = {
      modelToolName: `${actionName}Notion`,
      description: action.description,
      dynamicParameters,
    };
  });

  return tools;
}
