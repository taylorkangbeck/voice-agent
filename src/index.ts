import bodyParser from "body-parser";
import express from "express";
import twilio from "twilio";
import { createUltravoxCall } from "./lib/ultravox/agent.js";
import { getToolByName } from "./lib/ultravox/tools";

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

// // New endpoint for langgraph agent
// app.post("/langgraph", async (req, res) => {
//   try {
//     const { task } = req.body;

//     if (!task || typeof task !== "string") {
//       return res.status(400).json({
//         error: "A 'task' parameter is required in the request body",
//       });
//     }

//     console.log(`Executing langgraph agent for task: ${task}`);

//     const result = await runLanggraphAgent(task);

//     res.status(200).json({
//       task,
//       result,
//     });
//   } catch (error) {
//     console.error("Error executing langgraph agent:", error);
//     res.status(500).json({
//       error: "Error executing langgraph agent",
//       message: error instanceof Error ? error.message : String(error),
//     });
//   }
// });

// Flows handler
app.post("/tools/:toolName", async (req, res) => {
  try {
    const { toolName } = req.params;
    console.log(`Tool request received for: ${toolName}`);

    // Look up the tool with the matching name
    const tool = await getToolByName(toolName);

    if (!tool) {
      console.error(`Tool not found: ${toolName}`);
      return res.status(404).json({
        error: `Tool '${toolName}' not found`,
      });
    }

    // Call the tool with the request body
    console.log("Tool request body:\n", JSON.stringify(req.body, null, 2));

    // Parse any JSON string values in the request body
    const parsedBody = Object.entries(req.body).reduce((acc, [key, value]) => {
      if (
        typeof value === "string" &&
        (value.startsWith("{") || value.startsWith("["))
      ) {
        try {
          acc[key] = JSON.parse(value);
        } catch (e) {
          // If parsing fails, keep the original string
          acc[key] = value;
        }
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const result = await tool(parsedBody);

    console.log("Tool call result:\n", JSON.stringify(result, null, 2));

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
