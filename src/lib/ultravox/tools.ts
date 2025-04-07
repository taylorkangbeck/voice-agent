import { getAgentForFlow } from "../langgraph/executor/graph";
import { executeCypherQuery, getFlowNodeById } from "../neo4j";

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

export const executeFlowById = async (
  flowNodeId: string,
  requestMessage: string
) => {
  // Convert the array from getFlowTools() into a proper Record<string, Tool>
  const flow = await getFlowNodeById(flowNodeId);

  if (!flow) {
    throw new Error(`Flow with id ${flowNodeId} not found`);
  }

  const flowAgent = await getAgentForFlow(flowNodeId);
  const result = await flowAgent.invoke({
    messages: [
      {
        role: "user",
        content: requestMessage,
      },
    ],
  });

  console.log("Flow agent messages:\n", result.messages);

  return result.messages
    .filter((message) => message.getType() === "ai")
    .map((message) => message.content)
    .join("\n");
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
          description: flow.description || `No description provided.`,
          dynamicParameters: [
            {
              name: "requestMessage",
              location: "PARAMETER_LOCATION_BODY",
              schema: {
                type: "string",
                description: "The message to send to the flow execution agent",
              },
              required: true,
            },
            // ...(flow.inputSchema
            //   ? Object.entries(flow.inputSchema.properties || {}).map(
            //       ([name, schema]) => ({
            //         name,
            //         location: "PARAMETER_LOCATION_BODY",
            //         schema: schema as Record<string, any>,
            //         required:
            //           flow.inputSchema.required?.includes(name) || false,
            //       })
            //     )
            //   : []),
          ],
          http: {
            baseUrlPattern: `https://${BASE_DOMAIN}/flows/${flow.id}`,
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
