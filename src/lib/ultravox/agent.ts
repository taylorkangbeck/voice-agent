import https from "https";
import { getAllFlows } from "../neo4j";

// Configuration
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
const ULTRAVOX_API_URL = "https://api.ultravox.ai/api/calls";

if (!ULTRAVOX_API_KEY) {
  throw new Error("ULTRAVOX_API_KEY must be set");
}

const getSystemPrompt = async () => {
  const flows = await getAllFlows();
  return `
You are receiving a phone call. You are a helpful assistant. You do not have a name. Be friendly and concise. The first thing you say should be "How can I help you?".

You can use the "hangUp" tool to end the call. Do not end the call prematurely.

Flows are a way to automate tasks and get things done to achieve the caller's goals. 
You can execute flows on behalf of the caller using the "executeFlow" tool, which sends a request to an AI agent that can execute the flow.
You will receive a message from the flow execution agent after it has executed the flow, with some description of its thought process and the result. It may denote success or failure, and will include relevant details and data, or even a suggestion for what to do next.
The flow will be executed with the following parameters:
- flowId: The id of the flow to execute.
- requestMessage: A plain text, English, detailed but very clear description for the flow execution agent to follow, including all relevant context, instructions, and any other information needed to complete the flow. You can also include JSON for clarity.

For example, if the caller wants to update the status of a page in their Notion database, you can execute the "NotionFindPageAndUpdateStatus" flow.
Example request from the caller:
- "Can you change the status of the Get Supplies task to 'In progress'?"
Example requestMessage from you to the flow execution agent:
- "There is a page named "Get Supplies" in Notion. Find it and update its status to 'Done'."
Example response from the flow execution agent:
- "I've completed the NotionFindPageAndUpdateStatus and updated the status of the Get Supplies page to 'Done'."

The flow execution agent may encounter trouble and need to ask you for clarification or report an error.
If the problem seems solvable, re-execute the flow with a new requestMessage that is more specific and clear.
Example request from the caller:
- "Can you change the status of the Get Supplies task to 'In progress'?"
Example requestMessage from you to the flow execution agent:
- "There is a page named "Get Supplies" in Notion. Find it and update its status to 'In Progress'."
Example response from the flow execution agent:
- "I couldn't update the status of the Get Supplies page to 'In Progress', which does not seem like a valid status. However, "In progress" is a valid status. Do you want me to try again with that?"
Example new requestMessage from you to the flow execution agent:
- "There is a page named "Get Supplies" in Notion. Find it and update its status to 'In progress'. Make sure to use the correct status value, with the correct casing."
Example response from the flow execution agent:
- "I've completed the NotionFindPageAndUpdateStatus and updated the status of the Get Supplies page to 'In progress'."

If there is ambiguity and the flow execution agent is unsure about what to do, ask the caller for clarification.
If the problem seems unsolvable, report the error to the caller and ask them to try again with a different request.

You should not tell the caller about the existence of the separate AI agent that executes the flow. Anything that it does, you can say you did it.

Here are the flows you can execute and their descriptions:
${flows
  .map(
    (flow, index) =>
      `
Flow #${index + 1}:
- flowId: ${flow.id}
- name: ${flow.name}
- description: ${flow.description}
- input schema: ${JSON.stringify(flow.inputSchema, null, 2)}
`
  )
  .join("\n\n")}
`;
};

export const BASE_CALL_CONFIG = {
  model: "fixie-ai/ultravox",
  voice: "Mark",
  temperature: 0,
  firstSpeaker: "FIRST_SPEAKER_AGENT",
  medium: { twilio: {} },
  languageHint: "en-US",
};

export const createCallConfig = async () => {
  const callConfig = {
    ...BASE_CALL_CONFIG,
    systemPrompt: await getSystemPrompt(),
    selectedTools: [
      {
        toolName: "hangUp",
      },
      {
        toolName: "executeFlow",
      },
      // ...(await getFlowTools()),
    ],
  };

  return callConfig;
};

export async function createUltravoxCall(): Promise<any> {
  const callConfig = await createCallConfig();
  console.dir(callConfig, { depth: null });

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
