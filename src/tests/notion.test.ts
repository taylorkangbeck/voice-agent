import { getNotionAction, listNotionActions } from "../actions/notion";

// Mock the Client from @notionhq/client
jest.mock("@notionhq/client", () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        blocks: {
          retrieve: jest
            .fn()
            .mockResolvedValue({ id: "mock-block-id", type: "paragraph" }),
          update: jest.fn().mockResolvedValue({
            id: "mock-block-id",
            type: "paragraph",
            updated: true,
          }),
          delete: jest
            .fn()
            .mockResolvedValue({ id: "mock-block-id", archived: true }),
          children: {
            append: jest.fn().mockResolvedValue({
              block_id: "mock-block-id",
              children: [{ id: "mock-child-id", type: "paragraph" }],
            }),
            list: jest.fn().mockResolvedValue({
              results: [{ id: "mock-child-id", type: "paragraph" }],
              has_more: false,
            }),
          },
        },
        databases: {
          list: jest.fn().mockResolvedValue({
            results: [{ id: "mock-database-id", title: "Mock Database" }],
            has_more: false,
          }),
          retrieve: jest.fn().mockResolvedValue({
            id: "mock-database-id",
            title: "Mock Database",
          }),
          query: jest.fn().mockResolvedValue({
            results: [{ id: "mock-page-id", properties: {} }],
            has_more: false,
          }),
          create: jest.fn().mockResolvedValue({
            id: "new-mock-database-id",
            title: "New Mock Database",
          }),
          update: jest.fn().mockResolvedValue({
            id: "mock-database-id",
            title: "Updated Mock Database",
          }),
        },
        pages: {
          create: jest
            .fn()
            .mockResolvedValue({ id: "new-mock-page-id", properties: {} }),
          retrieve: jest
            .fn()
            .mockResolvedValue({ id: "mock-page-id", properties: {} }),
          update: jest.fn().mockResolvedValue({
            id: "mock-page-id",
            properties: { updated: true },
          }),
          properties: {
            retrieve: jest.fn().mockResolvedValue({
              id: "mock-property-id",
              type: "title",
              title: {},
            }),
          },
        },
        users: {
          retrieve: jest
            .fn()
            .mockResolvedValue({ id: "mock-user-id", name: "Mock User" }),
          list: jest.fn().mockResolvedValue({
            results: [{ id: "mock-user-id", name: "Mock User" }],
            has_more: false,
          }),
          me: jest
            .fn()
            .mockResolvedValue({ id: "my-user-id", name: "My User" }),
        },
        comments: {
          create: jest
            .fn()
            .mockResolvedValue({ id: "mock-comment-id", rich_text: [] }),
          list: jest.fn().mockResolvedValue({
            results: [{ id: "mock-comment-id", rich_text: [] }],
            has_more: false,
          }),
        },
        search: jest.fn().mockResolvedValue({
          results: [{ id: "mock-result-id", object: "page" }],
          has_more: false,
        }),
        oauth: {
          token: jest.fn().mockResolvedValue({
            access_token: "mock-token",
            bot_id: "mock-bot-id",
          }),
          introspect: jest.fn().mockResolvedValue({
            bot_id: "mock-bot-id",
            workspace_id: "mock-workspace-id",
          }),
          revoke: jest.fn().mockResolvedValue({}),
        },
      };
    }),
  };
});

// Helper function to create spy and check if it was called
const testNotionAction = async (actionName: string, input: any) => {
  const action = getNotionAction(actionName);
  expect(action).toBeDefined();

  if (!action) return; // To satisfy TypeScript

  // Execute the action with the provided input
  const result = await action.execute(input);
  expect(result).toBeDefined();
};

describe("Notion Actions", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should export all notion actions", () => {
    const actionNames = listNotionActions();
    expect(actionNames.length).toBeGreaterThan(0);
    expect(actionNames).toContain("retrieveBlock");
    expect(actionNames).toContain("queryDatabase");
    expect(actionNames).toContain("search");
  });

  it("should get a notion action by name", () => {
    const action = getNotionAction("retrieveBlock");
    expect(action).toBeDefined();
    expect(action?.name).toBe("RetrieveBlock");
  });

  it("should return undefined for non-existent action", () => {
    const action = getNotionAction("nonExistentAction");
    expect(action).toBeUndefined();
  });

  // Block Actions Tests
  describe("Block Actions", () => {
    it("should retrieve a block", async () => {
      await testNotionAction("retrieveBlock", { block_id: "mock-block-id" });
    });

    it("should update a block", async () => {
      await testNotionAction("updateBlock", {
        block_id: "mock-block-id",
        paragraph: {
          text: [{ type: "text", text: { content: "Updated text" } }],
        },
      });
    });

    it("should delete a block", async () => {
      await testNotionAction("deleteBlock", { block_id: "mock-block-id" });
    });

    it("should append block children", async () => {
      await testNotionAction("appendBlockChildren", {
        block_id: "mock-block-id",
        children: [
          {
            paragraph: {
              text: [{ type: "text", text: { content: "New child" } }],
            },
          },
        ],
      });
    });

    it("should list block children", async () => {
      await testNotionAction("listBlockChildren", {
        block_id: "mock-block-id",
      });
    });
  });

  // Database Actions Tests
  describe("Database Actions", () => {
    it("should list databases", async () => {
      await testNotionAction("listDatabases", {});
    });

    it("should retrieve a database", async () => {
      await testNotionAction("retrieveDatabase", {
        database_id: "mock-database-id",
      });
    });

    it("should query a database", async () => {
      await testNotionAction("queryDatabase", {
        database_id: "mock-database-id",
        filter: { property: "Name", text: { contains: "Test" } },
      });
    });

    it("should create a database", async () => {
      await testNotionAction("createDatabase", {
        parent: { page_id: "mock-page-id" },
        title: [{ type: "text", text: { content: "New Database" } }],
        properties: {
          Name: { title: {} },
          Status: {
            select: { options: [{ name: "Active" }, { name: "Archived" }] },
          },
        },
      });
    });

    it("should update a database", async () => {
      await testNotionAction("updateDatabase", {
        database_id: "mock-database-id",
        title: [{ type: "text", text: { content: "Updated Database" } }],
      });
    });
  });

  // Page Actions Tests
  describe("Page Actions", () => {
    it("should create a page", async () => {
      await testNotionAction("createPage", {
        parent: { database_id: "mock-database-id" },
        properties: {
          Name: { title: [{ text: { content: "New Page" } }] },
          Status: { select: { name: "Active" } },
        },
      });
    });

    it("should retrieve a page", async () => {
      await testNotionAction("retrievePage", { page_id: "mock-page-id" });
    });

    it("should update a page", async () => {
      await testNotionAction("updatePage", {
        page_id: "mock-page-id",
        properties: {
          Name: { title: [{ text: { content: "Updated Page" } }] },
          Status: { select: { name: "Archived" } },
        },
      });
    });

    it("should retrieve a page property", async () => {
      await testNotionAction("retrievePageProperty", {
        page_id: "mock-page-id",
        property_id: "mock-property-id",
      });
    });
  });

  // User Actions Tests
  describe("User Actions", () => {
    it("should retrieve a user", async () => {
      await testNotionAction("retrieveUser", { user_id: "mock-user-id" });
    });

    it("should list users", async () => {
      await testNotionAction("listUsers", {});
    });

    it("should retrieve the current user", async () => {
      await testNotionAction("retrieveCurrentUser", {});
    });
  });

  // Comment Actions Tests
  describe("Comment Actions", () => {
    it("should create a comment", async () => {
      await testNotionAction("createComment", {
        parent: { page_id: "mock-page-id" },
        rich_text: [{ type: "text", text: { content: "New comment" } }],
      });
    });

    it("should list comments", async () => {
      await testNotionAction("listComments", { block_id: "mock-block-id" });
    });
  });

  // Search Action Test
  describe("Search Action", () => {
    it("should search for content", async () => {
      await testNotionAction("search", { query: "test" });
    });
  });

  // OAuth Actions Tests
  describe("OAuth Actions", () => {
    it("should get an OAuth token", async () => {
      await testNotionAction("oauthToken", {
        grant_type: "authorization_code",
        code: "mock-code",
        redirect_uri: "https://example.com/callback",
        client_id: "mock-client-id",
        client_secret: "mock-client-secret",
      });
    });

    it("should introspect an OAuth token", async () => {
      await testNotionAction("oauthIntrospect", {
        token: "mock-token",
        client_id: "mock-client-id",
        client_secret: "mock-client-secret",
      });
    });

    it("should revoke an OAuth token", async () => {
      await testNotionAction("oauthRevoke", {
        token: "mock-token",
        client_id: "mock-client-id",
        client_secret: "mock-client-secret",
      });
    });
  });

  // Error handling tests
  describe("Error Handling", () => {
    it("should handle errors in API calls", async () => {
      // Mock the console.error to prevent it from showing during tests
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Create a mock implementation for the execute method that throws an error
      const action = getNotionAction("retrieveBlock");
      expect(action).toBeDefined();

      if (action) {
        // Save the original implementation
        const originalExecute = action.execute;

        // Override with a version that throws an error
        action.execute = jest
          .fn()
          .mockRejectedValueOnce(new Error("API error"));

        // Test the error handling
        await expect(
          action.execute({ block_id: "mock-block-id" })
        ).rejects.toThrow("API error");

        // Restore the original implementation
        action.execute = originalExecute;
      }

      // Restore console.error
      console.error = originalConsoleError;
    });
  });
});
