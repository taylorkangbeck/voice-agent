curl --request POST \
  --url https://api.ultravox.ai/api/tools \
  --header 'Content-Type: application/json' \
  --header 'X-API-Key: $ULTRAVOX_API_KEY' \
  --data '{
  "name": "executeFlow",
  "definition": {
    "modelToolName": "executeFlow",
    "description": "Execute a flow",
    "dynamicParameters": [
      {
        "name": "flowId",
        "location": "PARAMETER_LOCATION_BODY",
        "schema": {
          "type": "string",
          "description": "The id of the flow to execute"
        },
        "required": true
      },
      {
        "name": "requestMessage",
        "location": "PARAMETER_LOCATION_BODY",
        "schema": {
          "type": "string",
          "description": "A detailed description for the flow execution agent to follow, including all relevant context, instructions, and any other information needed to complete the flow."
        },
        "required": true
      }
    ],
    "timeout": "20s",
    "http": {
      "baseUrlPattern": "https://ladybird-winning-shiner.ngrok-free.app/flows/execute",
      "httpMethod": "POST"
    }
  }
}'