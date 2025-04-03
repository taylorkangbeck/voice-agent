import https from "https";
import type { UltravoxCreateCallResponse } from "../types";

// Configuration
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
const ULTRAVOX_API_URL = "https://api.ultravox.ai/api/calls";
const BASE_URL = process.env.BASE_URL;

if (!ULTRAVOX_API_KEY || !BASE_URL) {
  throw new Error("ULTRAVOX_API_KEY and BASE_URL must be set");
}

type Stage = {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
};

type StageMap = {
  [key: string]: Stage;
};

const COMMON_SYSTEM_PROMPT = `
Your name is Todd. You are receiving a phone call. You are a helpful assistant. 
`;

const STAGES: StageMap = {
  Introduction: {
    name: "Introduction",
    description: "The introduction stage of the conversation",
    systemPrompt: `
    The phone call just started. Find out how to help the caller.
`,
    tools: ["getWeather"],
  },
  Closing: {
    name: "Closing",
    description:
      "The closing stage of the conversation, when the caller is ready to hang up.",
    systemPrompt: "Say goodbye to the caller and tell them 5+5 is 10.",
    tools: [],
  },
};

export const getStage = (stageName: string): Stage | undefined => {
  return STAGES[stageName];
};

export const listStages = (): string[] => {
  return Object.keys(STAGES);
};

export const BASE_CALL_CONFIG = {
  model: "fixie-ai/ultravox",
  voice: "David-English-British",
  temperature: 0.3,
  firstSpeaker: "FIRST_SPEAKER_AGENT",
  medium: { twilio: {} },
  languageHint: "en-US",
};

// Create Ultravox call and get join URL
export async function createUltravoxCall(
  stageName = "Introduction"
): Promise<UltravoxCreateCallResponse> {
  const callConfig = getCallConfigForStage(stageName);
  console.log(callConfig);

  const request = https.request(ULTRAVOX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": ULTRAVOX_API_KEY,
    },
  });

  return new Promise((resolve, reject) => {
    let data = "";

    request.on("response", (response) => {
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => resolve(JSON.parse(data)));
    });

    request.on("error", reject);
    request.write(JSON.stringify(callConfig));
    request.end();
  });
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

// Tools registry
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

// Registry of all available tools
const toolsRegistry: Record<string, Tool> = {
  changeStage: {
    modelToolName: "changeStage",
    description: `Change the stage of the conversation, when it's appropriate. \
    Here are the stages you can change to, and their descriptions:
     ${listStages()
       .map((stage) => `${stage}: ${getStage(stage)?.description}`)
       .join("\n")}`,
    dynamicParameters: [
      {
        name: "stage",
        location: "PARAMETER_LOCATION_BODY",
        schema: {
          description: `The new stage of the conversation, from options: ${listStages().join(
            ", "
          )}`,
          type: "string",
        },
        required: true,
      },
    ],
    execute: (requestBody: any) => {
      console.log("changeStage requestBody", requestBody);
      const newStage = requestBody.stage;

      const responseBody = {
        systemPrompt: getStage(newStage)?.systemPrompt,
        toolResultText: `(New Stage: ${newStage} - ${
          getStage(newStage)?.description
        })`,
      };

      return {
        body: responseBody,
        headers: {
          "X-Ultravox-Response-Type": "new-stage",
        },
      };
    },
  },
  getWeather: {
    modelToolName: "getWeather",
    description: "Get the weather for a given location",
    dynamicParameters: [
      {
        name: "location",
        location: "PARAMETER_LOCATION_BODY",
        schema: {
          description: "The location to get weather for",
          type: "string",
        },
        required: true,
      },
    ],
    execute: (requestBody: any) => {
      return {
        body: {
          weather: "sunny with a purple sky",
        },
      };
    },
  },
  // Add more tools here as needed
};

// Function to get a tool by name
export const getToolByName = (toolName: string): ToolFunction | undefined => {
  const tool = toolsRegistry[toolName];
  return tool ? tool.execute : undefined;
};

// Function to list all available tool names
export const listTools = (): string[] => {
  return Object.keys(toolsRegistry);
};

// Function to convert tools to selected tools format for the call config
export const getSelectedToolsConfig = (toolNames: string[]) => {
  return toolNames
    .map((toolName) => {
      const tool = toolsRegistry[toolName];
      if (!tool) return null;

      return {
        temporaryTool: {
          modelToolName: tool.modelToolName,
          description: tool.description,
          dynamicParameters: tool.dynamicParameters || [],
          http: {
            baseUrlPattern: `${BASE_URL}/tools/${toolName}`,
            httpMethod: "POST",
          },
        },
      };
    })
    .filter(Boolean); // Remove any null values
};

// Create call config with tools for a specific stage
export const getCallConfigForStage = (stageName: string) => {
  const stage = getStage(stageName);
  if (!stage) return BASE_CALL_CONFIG;

  // Get the tools for this stage
  const stageTools = stage.tools || [];
  const toolsToInclude = ["changeStage", ...stageTools];
  const selectedTools = getSelectedToolsConfig(toolsToInclude);

  // Create tool instructions section for the system prompt
  const toolInstructions = `
  You have access to the following tools:\n
  ${toolsToInclude
    .map((toolName) => {
      const tool = toolsRegistry[toolName];
      if (!tool) return null;
      return `- ${toolName}`;
    })
    .filter(Boolean)
    .join("\n")}

  You can use these tools to help you with the conversation.
  `;

  // Combine stage system prompt with tool instructions
  const systemPrompt = `${COMMON_SYSTEM_PROMPT}\n${stage.systemPrompt}\n${toolInstructions}`;

  const callConfig = {
    ...BASE_CALL_CONFIG,
    systemPrompt,
    selectedTools,
  };

  console.log(JSON.stringify(callConfig, null, 2));

  return callConfig;
};
