import { Client } from "@notionhq/client";
import type {
  AppendBlockChildrenParameters,
  CreateCommentParameters,
  CreateDatabaseParameters,
  CreatePageParameters,
  DeleteBlockParameters,
  GetBlockParameters,
  GetDatabaseParameters,
  GetPageParameters,
  GetPagePropertyParameters,
  GetSelfParameters,
  GetUserParameters,
  ListBlockChildrenParameters,
  ListCommentsParameters,
  ListDatabasesParameters,
  ListUsersParameters,
  OauthIntrospectParameters,
  OauthRevokeParameters,
  OauthTokenParameters,
  QueryDatabaseParameters,
  SearchParameters,
  UpdateBlockParameters,
  UpdateDatabaseParameters,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import { Action } from "../types";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

type NotionActionMap = {
  [key: string]: Action;
};

// TODO might need to make key and names same case

// Create a record of all available Notion actions
const notionActions: NotionActionMap = {
  // Block actions
  NotionRetrieveBlock: {
    name: "NotionRetrieveBlock",
    description: "Retrieves a Block object using the ID specified.",
    inputSchema: {
      type: "object",
      required: ["block_id"],
      properties: {
        block_id: {
          type: "string",
          description: "Identifier for a block",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        type: { type: "string" },
        created_time: { type: "string" },
        last_edited_time: { type: "string" },
        has_children: { type: "boolean" },
      },
    },
    execute: async (input: GetBlockParameters) => {
      try {
        return await notion.blocks.retrieve(input);
      } catch (error) {
        console.error("Error retrieving block:", error);
        throw error;
      }
    },
  },

  NotionUpdateBlock: {
    name: "NotionUpdateBlock",
    description: "Updates the content of the block specified by ID.",
    inputSchema: {
      type: "object",
      required: ["block_id"],
      properties: {
        block_id: {
          type: "string",
          description: "Identifier for a block",
        },
        archived: {
          type: "boolean",
          description: "Whether the block is archived",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        type: { type: "string" },
        created_time: { type: "string" },
        last_edited_time: { type: "string" },
        has_children: { type: "boolean" },
      },
    },
    execute: async (input: UpdateBlockParameters) => {
      try {
        return await notion.blocks.update(input);
      } catch (error) {
        console.error("Error updating block:", error);
        throw error;
      }
    },
  },

  NotionDeleteBlock: {
    name: "NotionDeleteBlock",
    description: "Sets a block to archived: true using the ID specified.",
    inputSchema: {
      type: "object",
      required: ["block_id"],
      properties: {
        block_id: {
          type: "string",
          description: "Identifier for a block",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        type: { type: "string" },
        archived: { type: "boolean" },
      },
    },
    execute: async (input: DeleteBlockParameters) => {
      try {
        return await notion.blocks.delete(input);
      } catch (error) {
        console.error("Error deleting block:", error);
        throw error;
      }
    },
  },

  NotionAppendBlockChildren: {
    name: "NotionAppendBlockChildren",
    description:
      "Creates and appends new children blocks to the parent block specified by ID.",
    inputSchema: {
      type: "object",
      required: ["block_id", "children"],
      properties: {
        block_id: {
          type: "string",
          description: "Identifier for a block",
        },
        children: {
          type: "array",
          items: {
            type: "object",
          },
          description: "Child blocks to append",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        results: {
          type: "array",
          items: {
            type: "object",
          },
        },
      },
    },
    execute: async (input: AppendBlockChildrenParameters) => {
      try {
        return await notion.blocks.children.append(input);
      } catch (error) {
        console.error("Error appending block children:", error);
        throw error;
      }
    },
  },

  NotionListBlockChildren: {
    name: "NotionListBlockChildren",
    description:
      "Returns a paginated array of child block objects for the block specified by ID.",
    inputSchema: {
      type: "object",
      required: ["block_id"],
      properties: {
        block_id: {
          type: "string",
          description: "Identifier for a block",
        },
        start_cursor: {
          type: "string",
          description: "Pagination cursor",
        },
        page_size: {
          type: "number",
          description: "Number of items to return per page",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        results: {
          type: "array",
          items: {
            type: "object",
          },
        },
        next_cursor: { type: "string" },
        has_more: { type: "boolean" },
      },
    },
    execute: async (input: ListBlockChildrenParameters) => {
      try {
        return await notion.blocks.children.list(input);
      } catch (error) {
        console.error("Error listing block children:", error);
        throw error;
      }
    },
  },

  // Database actions
  NotionListDatabases: {
    name: "NotionListDatabases",
    description:
      "Returns a paginated list of databases that the integration has access to.",
    inputSchema: {
      type: "object",
      properties: {
        start_cursor: {
          type: "string",
          description: "Pagination cursor",
        },
        page_size: {
          type: "number",
          description: "Number of items to return per page",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        results: {
          type: "array",
          items: {
            type: "object",
          },
        },
        next_cursor: { type: "string" },
        has_more: { type: "boolean" },
      },
    },
    execute: async (input: ListDatabasesParameters) => {
      try {
        return await notion.databases.list(input);
      } catch (error) {
        console.error("Error listing databases:", error);
        throw error;
      }
    },
  },

  NotionRetrieveDatabase: {
    name: "NotionRetrieveDatabase",
    description: "Retrieves a Database object using the ID specified.",
    inputSchema: {
      type: "object",
      required: ["database_id"],
      properties: {
        database_id: {
          type: "string",
          description: "Identifier for a database",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        created_time: { type: "string" },
        last_edited_time: { type: "string" },
        title: {
          type: "array",
          items: { type: "object" },
        },
        properties: { type: "object" },
      },
    },
    execute: async (input: GetDatabaseParameters) => {
      try {
        return await notion.databases.retrieve(input);
      } catch (error) {
        console.error("Error retrieving database:", error);
        throw error;
      }
    },
  },

  NotionQueryDatabase: {
    name: "NotionQueryDatabase",
    description:
      "Gets a list of Pages from a database with provided filter and sort options.",
    inputSchema: {
      type: "object",
      required: ["database_id"],
      properties: {
        database_id: {
          type: "string",
          description: "Identifier for a database",
        },
        filter: {
          type: "object",
          description: "Filter criteria",
        },
        sorts: {
          type: "array",
          items: { type: "object" },
          description: "Sort criteria",
        },
        start_cursor: {
          type: "string",
          description: "Pagination cursor",
        },
        page_size: {
          type: "number",
          description: "Number of items to return per page",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        results: {
          type: "array",
          items: { type: "object" },
        },
        next_cursor: { type: "string" },
        has_more: { type: "boolean" },
      },
    },
    execute: async (input: QueryDatabaseParameters) => {
      try {
        return await notion.databases.query(input);
      } catch (error) {
        console.error("Error querying database:", error);
        throw error;
      }
    },
  },

  NotionCreateDatabase: {
    name: "NotionCreateDatabase",
    description:
      "Creates a database as a child of the specified parent page, with the specified properties schema.",
    inputSchema: {
      type: "object",
      required: ["parent", "title", "properties"],
      properties: {
        parent: {
          type: "object",
          description: "Parent page",
        },
        title: {
          type: "array",
          items: { type: "object" },
          description: "Title of the database",
        },
        properties: {
          type: "object",
          description: "Database properties schema",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        created_time: { type: "string" },
        last_edited_time: { type: "string" },
        title: {
          type: "array",
          items: { type: "object" },
        },
        properties: { type: "object" },
      },
    },
    execute: async (input: CreateDatabaseParameters) => {
      try {
        return await notion.databases.create(input);
      } catch (error) {
        console.error("Error creating database:", error);
        throw error;
      }
    },
  },

  NotionUpdateDatabase: {
    name: "NotionUpdateDatabase",
    description:
      "Updates an existing database as specified by the ID, allowing title and properties schema changes.",
    inputSchema: {
      type: "object",
      required: ["database_id"],
      properties: {
        database_id: {
          type: "string",
          description: "Identifier for a database",
        },
        title: {
          type: "array",
          items: { type: "object" },
          description: "Title of the database",
        },
        properties: {
          type: "object",
          description: "Database properties schema",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        created_time: { type: "string" },
        last_edited_time: { type: "string" },
        title: {
          type: "array",
          items: { type: "object" },
        },
        properties: { type: "object" },
      },
    },
    execute: async (input: UpdateDatabaseParameters) => {
      try {
        return await notion.databases.update(input);
      } catch (error) {
        console.error("Error updating database:", error);
        throw error;
      }
    },
  },

  // Page actions
  NotionCreatePage: {
    name: "NotionCreatePage",
    description: "Creates a new page in the specified parent page or database.",
    inputSchema: {
      type: "object",
      required: ["parent", "properties"],
      properties: {
        parent: {
          type: "object",
          description: "Parent page or database",
        },
        properties: {
          type: "object",
          description: "Page properties",
        },
        children: {
          type: "array",
          items: { type: "object" },
          description: "Page content blocks",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        created_time: { type: "string" },
        last_edited_time: { type: "string" },
        parent: { type: "object" },
        properties: { type: "object" },
      },
    },
    execute: async (input: CreatePageParameters) => {
      try {
        return await notion.pages.create(input);
      } catch (error) {
        console.error("Error creating page:", error);
        throw error;
      }
    },
  },

  NotionRetrievePage: {
    name: "NotionRetrievePage",
    description: "Retrieves a Page object using the ID specified.",
    inputSchema: {
      type: "object",
      required: ["page_id"],
      properties: {
        page_id: {
          type: "string",
          description: "Identifier for a page",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        created_time: { type: "string" },
        last_edited_time: { type: "string" },
        parent: { type: "object" },
        properties: { type: "object" },
      },
    },
    execute: async (input: GetPageParameters) => {
      try {
        return await notion.pages.retrieve(input);
      } catch (error) {
        console.error("Error retrieving page:", error);
        throw error;
      }
    },
  },

  NotionUpdatePage: {
    name: "NotionUpdatePage",
    description: "Updates page property values for the specified page.",
    inputSchema: {
      type: "object",
      required: ["page_id"],
      properties: {
        page_id: {
          type: "string",
          description: "Identifier for a page",
        },
        properties: {
          type: "object",
          description: "Page properties to update",
        },
        archived: {
          type: "boolean",
          description: "Whether the page is archived",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        created_time: { type: "string" },
        last_edited_time: { type: "string" },
        parent: { type: "object" },
        properties: { type: "object" },
      },
    },
    execute: async (input: UpdatePageParameters) => {
      try {
        return await notion.pages.update(input);
      } catch (error) {
        console.error("Error updating page:", error);
        throw error;
      }
    },
  },

  NotionRetrievePageProperty: {
    name: "NotionRetrievePageProperty",
    description:
      "Retrieves a page property item for the specified page and property.",
    inputSchema: {
      type: "object",
      required: ["page_id", "property_id"],
      properties: {
        page_id: {
          type: "string",
          description: "Identifier for a page",
        },
        property_id: {
          type: "string",
          description: "Identifier for a property",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        results: {
          type: "array",
          items: { type: "object" },
        },
        next_cursor: { type: "string" },
        has_more: { type: "boolean" },
      },
    },
    execute: async (input: GetPagePropertyParameters) => {
      try {
        return await notion.pages.properties.retrieve(input);
      } catch (error) {
        console.error("Error retrieving page property:", error);
        throw error;
      }
    },
  },

  // User actions
  NotionRetrieveUser: {
    name: "NotionRetrieveUser",
    description: "Retrieves a User object using the ID specified.",
    inputSchema: {
      type: "object",
      required: ["user_id"],
      properties: {
        user_id: {
          type: "string",
          description: "Identifier for a user",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        name: { type: "string" },
        avatar_url: { type: "string" },
        type: { type: "string" },
      },
    },
    execute: async (input: GetUserParameters) => {
      try {
        return await notion.users.retrieve(input);
      } catch (error) {
        console.error("Error retrieving user:", error);
        throw error;
      }
    },
  },

  NotionListUsers: {
    name: "NotionListUsers",
    description: "Returns a paginated list of Users for the workspace.",
    inputSchema: {
      type: "object",
      properties: {
        start_cursor: {
          type: "string",
          description: "Pagination cursor",
        },
        page_size: {
          type: "number",
          description: "Number of items to return per page",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        results: {
          type: "array",
          items: { type: "object" },
        },
        next_cursor: { type: "string" },
        has_more: { type: "boolean" },
      },
    },
    execute: async (input: ListUsersParameters) => {
      try {
        return await notion.users.list(input);
      } catch (error) {
        console.error("Error listing users:", error);
        throw error;
      }
    },
  },

  NotionRetrieveCurrentUser: {
    name: "NotionRetrieveCurrentUser",
    description: "Retrieves the bot User associated with the API token.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        name: { type: "string" },
        avatar_url: { type: "string" },
        type: { type: "string" },
      },
    },
    execute: async (input: GetSelfParameters) => {
      try {
        return await notion.users.me(input);
      } catch (error) {
        console.error("Error retrieving current user:", error);
        throw error;
      }
    },
  },

  // Comment actions
  NotionCreateComment: {
    name: "NotionCreateComment",
    description:
      "Creates a comment in a discussion within a page or as a standalone comment.",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "object",
          description: "Parent page or discussion",
        },
        discussion_id: {
          type: "string",
          description: "Identifier for a discussion",
        },
        rich_text: {
          type: "array",
          items: { type: "object" },
          description: "Rich text content",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        id: { type: "string" },
        parent: { type: "object" },
        discussion_id: { type: "string" },
        rich_text: {
          type: "array",
          items: { type: "object" },
        },
        created_time: { type: "string" },
        last_edited_time: { type: "string" },
      },
    },
    execute: async (input: CreateCommentParameters) => {
      try {
        return await notion.comments.create(input);
      } catch (error) {
        console.error("Error creating comment:", error);
        throw error;
      }
    },
  },

  NotionListComments: {
    name: "NotionListComments",
    description:
      "Returns a paginated list of comments for the specified block.",
    inputSchema: {
      type: "object",
      properties: {
        block_id: {
          type: "string",
          description: "Identifier for a block",
        },
        start_cursor: {
          type: "string",
          description: "Pagination cursor",
        },
        page_size: {
          type: "number",
          description: "Number of items to return per page",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        results: {
          type: "array",
          items: { type: "object" },
        },
        next_cursor: { type: "string" },
        has_more: { type: "boolean" },
      },
    },
    execute: async (input: ListCommentsParameters) => {
      try {
        return await notion.comments.list(input);
      } catch (error) {
        console.error("Error listing comments:", error);
        throw error;
      }
    },
  },

  // Search action
  NotionSearch: {
    name: "NotionSearch",
    description:
      "Searches all pages and databases that the integration has access to.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
        filter: {
          type: "object",
          description: "Filter criteria",
        },
        sort: {
          type: "object",
          description: "Sort criteria",
        },
        start_cursor: {
          type: "string",
          description: "Pagination cursor",
        },
        page_size: {
          type: "number",
          description: "Number of items to return per page",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        object: { type: "string" },
        results: {
          type: "array",
          items: { type: "object" },
        },
        next_cursor: { type: "string" },
        has_more: { type: "boolean" },
      },
    },
    execute: async (input: SearchParameters) => {
      try {
        return await notion.search(input);
      } catch (error) {
        console.error("Error searching:", error);
        throw error;
      }
    },
  },

  // OAuth actions
  NotionOauthToken: {
    name: "NotionOAuthToken",
    description:
      "Exchanges the authorization code for an access token and bot ID.",
    inputSchema: {
      type: "object",
      required: [
        "grant_type",
        "code",
        "redirect_uri",
        "client_id",
        "client_secret",
      ],
      properties: {
        grant_type: {
          type: "string",
          enum: ["authorization_code"],
          description: "The grant type",
        },
        code: {
          type: "string",
          description: "The authorization code",
        },
        redirect_uri: {
          type: "string",
          description: "The redirect URI",
        },
        client_id: {
          type: "string",
          description: "Client ID",
        },
        client_secret: {
          type: "string",
          description: "Client secret",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        access_token: { type: "string" },
        token_type: { type: "string" },
        bot_id: { type: "string" },
        workspace_id: { type: "string" },
        workspace_name: { type: "string" },
        workspace_icon: { type: "string" },
      },
    },
    execute: async (
      input: OauthTokenParameters & { client_id: string; client_secret: string }
    ) => {
      try {
        return await notion.oauth.token(input);
      } catch (error) {
        console.error("Error getting OAuth token:", error);
        throw error;
      }
    },
  },

  NotionOauthIntrospect: {
    name: "NotionOAuthIntrospect",
    description:
      "Check if the token is valid and retrieve basic information about the token.",
    inputSchema: {
      type: "object",
      required: ["token", "client_id", "client_secret"],
      properties: {
        token: {
          type: "string",
          description: "The token to introspect",
        },
        client_id: {
          type: "string",
          description: "Client ID",
        },
        client_secret: {
          type: "string",
          description: "Client secret",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        bot_id: { type: "string" },
        owner: { type: "object" },
      },
    },
    execute: async (
      input: OauthIntrospectParameters & {
        client_id: string;
        client_secret: string;
      }
    ) => {
      try {
        return await notion.oauth.introspect(input);
      } catch (error) {
        console.error("Error introspecting OAuth token:", error);
        throw error;
      }
    },
  },

  NotionOauthRevoke: {
    name: "NotionOAuthRevoke",
    description: "Revokes an access token.",
    inputSchema: {
      type: "object",
      required: ["token", "client_id", "client_secret"],
      properties: {
        token: {
          type: "string",
          description: "The token to revoke",
        },
        client_id: {
          type: "string",
          description: "Client ID",
        },
        client_secret: {
          type: "string",
          description: "Client secret",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {},
    },
    execute: async (
      input: OauthRevokeParameters & {
        client_id: string;
        client_secret: string;
      }
    ) => {
      try {
        return await notion.oauth.revoke(input);
      } catch (error) {
        console.error("Error revoking OAuth token:", error);
        throw error;
      }
    },
  },
};

// Function to get a NotionAction by name
export const getNotionAction = (actionName: string): Action | undefined => {
  return notionActions[actionName];
};

// Function to list all available NotionAction names
export const listNotionActions = (): string[] => {
  return Object.keys(notionActions);
};

export default notionActions;
