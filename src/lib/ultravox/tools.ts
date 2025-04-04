import { executeCypherQuery } from "../neo4j";

const BASE_DOMAIN = process.env.BASE_DOMAIN;

if (!BASE_DOMAIN) {
  throw new Error("BASE_DOMAIN must be set");
}

// Tool function type definition
export type ToolFunction = (
  requestBody: any
) => Promise<ToolResponse> | ToolResponse;

// Tool response type
export interface ToolResponse {
  body?: any;
  headers?: Record<string, string | number | boolean>;
}

export interface Tool {
  modelToolName: string;
  description: string;
  execute: ToolFunction;
  dynamicParameters?: Array<{
    name: string;
    location: string;
    schema: {
      description: string;
      type: string;
      [key: string]: any;
    };
    required: boolean;
  }>;
}

// Function to get a tool by name
export const getToolByName = async (
  toolName: string
): Promise<ToolFunction | undefined> => {
  // Convert the array from getFlowTools() into a proper Record<string, Tool>
  const flowTools = await getFlowTools();
  const allTools: Record<string, Tool> = {};

  // Add each flow tool to the tools record
  for (const tool of flowTools) {
    if (tool.temporaryTool && tool.temporaryTool.modelToolName) {
      allTools[tool.temporaryTool.modelToolName] = {
        modelToolName: tool.temporaryTool.modelToolName,
        description: tool.temporaryTool.description,
        dynamicParameters: tool.temporaryTool.dynamicParameters,
        execute: async () => ({ body: {} }), // Default implementation
      };
    }
  }
  const tool = allTools[toolName];
  return tool ? tool.execute : undefined;
};

export async function getFlowTools() {
  try {
    const result = await executeCypherQuery(`
      MATCH (flow:Flow)
      RETURN flow
    `);

    if (!result || !result.records || result.records.length === 0) {
      console.log("No flow tools found");
      return [];
    }

    // Convert Flow nodes to tool configurations
    const flowTools = result.records.map((record) => {
      const flow = record.get("flow").properties;

      return {
        temporaryTool: {
          modelToolName: flow.name,
          // location: "PARAMETER_LOCATION_BODY",
          description: flow.description || `${flow.name}`,
          dynamicParameters: [
            ...(flow.inputSchema
              ? Object.entries(flow.inputSchema.properties || {}).map(
                  ([name, schema]) => ({
                    name,
                    location: "PARAMETER_LOCATION_BODY",
                    schema: schema as Record<string, any>,
                    required:
                      flow.inputSchema.required?.includes(name) || false,
                  })
                )
              : []),
          ],
          http: {
            baseUrlPattern: `https://${BASE_DOMAIN}/tools/${flow.id}`,
            httpMethod: "POST",
          },
        },
      };
    });

    console.log(`Found ${flowTools.length} flow tools`);
    return flowTools;
  } catch (error) {
    console.error("Error fetching Flow tools:", error);
    return [];
  }
}
