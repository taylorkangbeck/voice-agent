# (WIP) Towards Teachable Agents with Composable Skills

(Note: this README was AI-generated and may contain errors)

## Overview

This repository contains a prototype implementation of a teachable agent system that can learn and compose skills. The system is designed to allow users to teach the agent new capabilities which can then be combined to solve complex tasks.

## Features

- **Skill Composition**: Combine multiple skills to solve complex tasks
- **Neo4j Backend**: Graph database for storing and querying skills and their relationships
- **API Integration**: Support for various AI models including OpenAI, Anthropic, and Google's Gemini
- **Voice Interface**: Twilio integration for voice-based interaction
- **Extensible Architecture**: Easy to add new tools and capabilities

## Getting Started

### Prerequisites

- Node.js
- Docker and Docker Compose
- API keys for supported AI models

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/voice-agent.git
   cd voice-agent
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   ```bash
   cp .env.example .env
   ```

   Then edit the `.env` file with your API keys and configuration.

4. Start the Neo4j database

   ```bash
   docker-compose up -d
   ```

5. Build and run the application
   ```bash
   npm run build
   npm start
   ```

## Architecture

The system uses a TypeScript backend with the following components:

- **Neo4j Database**: Stores skills, flows, and their relationships
- **Express Server**: Handles API requests and WebSocket connections
- **LangChain Integration**: For structured interactions with language models
- **Ultravox Tools**: Framework for defining and executing tools

## Development

### Project Structure

- `src/`: Source code
  - `lib/`: Core libraries
    - `ultravox/`: Tool framework implementation
  - `tools/`: Implemented tools and skills
  - `routes/`: API endpoints

### Building
