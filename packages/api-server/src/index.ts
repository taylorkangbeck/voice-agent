import express from "express";
import https from "https";
import twilio from "twilio";
import { ULTRAVOX_SYSTEM_PROMPT } from "./prompts";

const app = express();
const port = 3000;

// Configuration
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
const ULTRAVOX_API_URL = "https://api.ultravox.ai/api/calls";

const ULTRAVOX_CALL_CONFIG = {
  systemPrompt: ULTRAVOX_SYSTEM_PROMPT,
  model: "fixie-ai/ultravox",
  voice: "David-English-British",
  temperature: 0.3,
  firstSpeaker: "FIRST_SPEAKER_AGENT",
  medium: { twilio: {} },
  languageHint: "en-US",
};

// Create Ultravox call and get join URL
async function createUltravoxCall(): Promise<UltravoxCreateCallResponse> {
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
    request.write(JSON.stringify(ULTRAVOX_CALL_CONFIG));
    request.end();
  });
}

// Handle incoming calls
app.post("/incoming", async (req, res) => {
  try {
    console.log("Incoming call received");
    const response = await createUltravoxCall();
    const twiml = new twilio.twiml.VoiceResponse();
    const connect = twiml.connect();
    connect.stream({
      url: response.joinUrl,
      name: "ultravox",
    });

    const twimlString = twiml.toString();
    res.type("text/xml");
    res.send(twimlString);
  } catch (error) {
    console.error("Error handling incoming call:", error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Sorry, there was an error connecting your call.");
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

// Test
app.get("/test", async (req, res) => {
  res.send("OK");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
