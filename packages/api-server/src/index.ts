import bodyParser from "body-parser";
import express from "express";
import twilio from "twilio";
import { createUltravoxCall } from "./lib/ultravox";

const app = express();
const port = 3000;

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// Handle incoming calls
app.post("/incoming", async (req, res) => {
  try {
    console.log("Incoming call received");
    // Start with the Introduction stage
    const response = await createUltravoxCall("Introduction");
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

// Tools handler
app.post("/tools/:toolName", async (req, res) => {
  try {
    const { toolName } = req.params;
    console.log(`Tool request received for: ${toolName}`);

    // Import the tools dynamically from ultravox.ts
    const { getToolByName } = await import("./lib/ultravox");

    // Look up the tool with the matching name
    const tool = getToolByName(toolName);

    if (!tool) {
      console.error(`Tool not found: ${toolName}`);
      return res.status(404).json({
        error: `Tool '${toolName}' not found`,
      });
    }

    // Call the tool with the request body
    const result = await tool(req.body);

    // Send the response
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
    }

    res.status(200).json(result.body || result);
  } catch (error) {
    console.error(`Error executing tool ${req.params.toolName}:`, error);
    res.status(500).json({
      error: "Error executing tool",
      message: error instanceof Error ? error.message : String(error),
    });
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
