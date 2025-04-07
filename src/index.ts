import bodyParser from "body-parser";
import express from "express";
import twilio from "twilio";
import { createUltravoxCall } from "./lib/ultravox/agent.js";
import { executeFlowById } from "./lib/ultravox/tools";

const app = express();
const port = 3000;

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

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

app.post("/flows/execute", async (req, res) => {
  try {
    console.log(
      `Tool request received for flow ${req.body.flowId}: ${req.body.requestMessage}`
    );

    // Execute the flow
    const result = await executeFlowById(
      req.body.flowId,
      req.body.requestMessage
    );

    console.log("Flow execution result:\n", result);

    res.status(200).json(result);
  } catch (error) {
    console.error(`Error executing tool for ${req.body.flowNodeId}:`, error);
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
