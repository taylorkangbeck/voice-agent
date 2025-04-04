import https from "https";
import type { UltravoxCreateCallResponse } from "../../types";
import { getFlowTools } from "./tools";

// Configuration
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
const ULTRAVOX_API_URL = "https://api.ultravox.ai/api/calls";

if (!ULTRAVOX_API_KEY) {
  throw new Error("ULTRAVOX_API_KEY must be set");
}

const BASE_SYSTEM_PROMPT = `
You are receiving a phone call. You are a helpful assistant. Do not say your name. Be friendly and concise. The first thing you say should be "What's up?".

You have access to tools to help achieve the caller's goals.
Use the hangUp tool to end the call.
Use these tools to execute tasks on behalf of the caller:
TODO
`;

export const BASE_CALL_CONFIG = {
  model: "fixie-ai/ultravox",
  voice: "David-English-British",
  // temperature: 0.3,
  firstSpeaker: "FIRST_SPEAKER_AGENT",
  medium: { twilio: {} },
  languageHint: "en-US",
  description: "The introduction stage of the conversation",
  systemPrompt: BASE_SYSTEM_PROMPT,
};

export const createCallConfig = async () => {
  const callConfig = {
    ...BASE_CALL_CONFIG,
    selectedTools: [
      {
        toolName: "hangUp",
      },
      ...(await getFlowTools()),
    ],
  };

  return callConfig;
};

export async function createUltravoxCall(): Promise<UltravoxCreateCallResponse> {
  const callConfig = await createCallConfig();
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
