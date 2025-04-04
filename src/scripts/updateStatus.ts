#!/usr/bin/env node

import notionActions from "../actions/notion";

async function main() {
  try {
    // Search for the page by name
    console.log("Searching for page 'Improve website copy'...");
    const searchResults = await notionActions.search.execute({
      query: "Improve website copy",
    });

    // Find the page in the results
    const page = searchResults.results.find(
      (result: any) =>
        result.object === "page" &&
        result.properties?.["Task name"]?.title?.[0]?.plain_text ===
          "Improve website copy"
    );

    if (!page) {
      console.error("Page 'Improve website copy' not found");
      console.log(JSON.stringify(searchResults, null, 2));
      process.exit(1);
      return;
    }

    console.log(`Found page with ID: ${page.id}`);

    // Update the page status to "Done"
    console.log("Updating status to 'Done'...");
    await notionActions.updatePage.execute({
      page_id: page.id,
      properties: {
        Status: {
          status: {
            name: "Done",
          },
        },
      },
    });

    console.log("Successfully updated page status to Done");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main().catch(console.error);
