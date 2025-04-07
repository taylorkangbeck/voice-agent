#!/usr/bin/env node

import { executeCypherQuery } from "../lib/neo4j";

async function main() {
  try {
    console.log(`Resetting database...`);
    await executeCypherQuery(`MATCH (n) DETACH DELETE n`);

    console.log(`Database reset successfully`);
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

main().catch(console.error);
