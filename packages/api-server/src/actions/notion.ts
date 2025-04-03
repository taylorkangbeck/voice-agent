import { Client } from "@notionhq/client";
import type {
  AppendBlockChildrenParameters,
  AppendBlockChildrenResponse,
  CreateCommentParameters,
  CreateCommentResponse,
  CreateDatabaseParameters,
  CreateDatabaseResponse,
  CreatePageParameters,
  CreatePageResponse,
  DeleteBlockParameters,
  DeleteBlockResponse,
  GetBlockParameters,
  GetBlockResponse,
  GetDatabaseParameters,
  GetDatabaseResponse,
  GetPageParameters,
  GetPagePropertyParameters,
  GetPagePropertyResponse,
  GetPageResponse,
  GetSelfParameters,
  GetSelfResponse,
  GetUserParameters,
  GetUserResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  ListCommentsParameters,
  ListCommentsResponse,
  ListDatabasesParameters,
  ListDatabasesResponse,
  ListUsersParameters,
  ListUsersResponse,
  OauthIntrospectParameters,
  OauthIntrospectResponse,
  OauthRevokeParameters,
  OauthRevokeResponse,
  OauthTokenParameters,
  OauthTokenResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
  SearchParameters,
  SearchResponse,
  UpdateBlockParameters,
  UpdateBlockResponse,
  UpdateDatabaseParameters,
  UpdateDatabaseResponse,
  UpdatePageParameters,
  UpdatePageResponse,
} from "@notionhq/client/build/src/api-endpoints";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

type NotionAction<TInput, TOutput> = {
  name: string;
  description: string;
  input: TInput;
  output: TOutput;
  execute: (input: TInput) => Promise<TOutput>;
};

type NotionActionMap = {
  [key: string]: NotionAction<any, any>;
};

// Create a record of all available Notion actions
const notionActions: NotionActionMap = {
  // Block actions
  retrieveBlock: {
    name: "RetrieveBlock",
    description: "Retrieves a Block object using the ID specified.",
    input: {} as GetBlockParameters,
    output: {} as GetBlockResponse,
    execute: async (input: GetBlockParameters) => {
      try {
        return await notion.blocks.retrieve(input);
      } catch (error) {
        console.error("Error retrieving block:", error);
        throw error;
      }
    },
  },

  updateBlock: {
    name: "UpdateBlock",
    description: "Updates the content of the block specified by ID.",
    input: {} as UpdateBlockParameters,
    output: {} as UpdateBlockResponse,
    execute: async (input: UpdateBlockParameters) => {
      try {
        return await notion.blocks.update(input);
      } catch (error) {
        console.error("Error updating block:", error);
        throw error;
      }
    },
  },

  deleteBlock: {
    name: "DeleteBlock",
    description: "Sets a block to archived: true using the ID specified.",
    input: {} as DeleteBlockParameters,
    output: {} as DeleteBlockResponse,
    execute: async (input: DeleteBlockParameters) => {
      try {
        return await notion.blocks.delete(input);
      } catch (error) {
        console.error("Error deleting block:", error);
        throw error;
      }
    },
  },

  appendBlockChildren: {
    name: "AppendBlockChildren",
    description:
      "Creates and appends new children blocks to the parent block specified by ID.",
    input: {} as AppendBlockChildrenParameters,
    output: {} as AppendBlockChildrenResponse,
    execute: async (input: AppendBlockChildrenParameters) => {
      try {
        return await notion.blocks.children.append(input);
      } catch (error) {
        console.error("Error appending block children:", error);
        throw error;
      }
    },
  },

  listBlockChildren: {
    name: "ListBlockChildren",
    description:
      "Returns a paginated array of child block objects for the block specified by ID.",
    input: {} as ListBlockChildrenParameters,
    output: {} as ListBlockChildrenResponse,
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
  listDatabases: {
    name: "ListDatabases",
    description:
      "Returns a paginated list of databases that the integration has access to.",
    input: {} as ListDatabasesParameters,
    output: {} as ListDatabasesResponse,
    execute: async (input: ListDatabasesParameters) => {
      try {
        return await notion.databases.list(input);
      } catch (error) {
        console.error("Error listing databases:", error);
        throw error;
      }
    },
  },

  retrieveDatabase: {
    name: "RetrieveDatabase",
    description: "Retrieves a Database object using the ID specified.",
    input: {} as GetDatabaseParameters,
    output: {} as GetDatabaseResponse,
    execute: async (input: GetDatabaseParameters) => {
      try {
        return await notion.databases.retrieve(input);
      } catch (error) {
        console.error("Error retrieving database:", error);
        throw error;
      }
    },
  },

  queryDatabase: {
    name: "QueryDatabase",
    description:
      "Gets a list of Pages from a database with provided filter and sort options.",
    input: {} as QueryDatabaseParameters,
    output: {} as QueryDatabaseResponse,
    execute: async (input: QueryDatabaseParameters) => {
      try {
        return await notion.databases.query(input);
      } catch (error) {
        console.error("Error querying database:", error);
        throw error;
      }
    },
  },

  createDatabase: {
    name: "CreateDatabase",
    description:
      "Creates a database as a child of the specified parent page, with the specified properties schema.",
    input: {} as CreateDatabaseParameters,
    output: {} as CreateDatabaseResponse,
    execute: async (input: CreateDatabaseParameters) => {
      try {
        return await notion.databases.create(input);
      } catch (error) {
        console.error("Error creating database:", error);
        throw error;
      }
    },
  },

  updateDatabase: {
    name: "UpdateDatabase",
    description:
      "Updates an existing database as specified by the ID, allowing title and properties schema changes.",
    input: {} as UpdateDatabaseParameters,
    output: {} as UpdateDatabaseResponse,
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
  createPage: {
    name: "CreatePage",
    description: "Creates a new page in the specified parent page or database.",
    input: {} as CreatePageParameters,
    output: {} as CreatePageResponse,
    execute: async (input: CreatePageParameters) => {
      try {
        return await notion.pages.create(input);
      } catch (error) {
        console.error("Error creating page:", error);
        throw error;
      }
    },
  },

  retrievePage: {
    name: "RetrievePage",
    description: "Retrieves a Page object using the ID specified.",
    input: {} as GetPageParameters,
    output: {} as GetPageResponse,
    execute: async (input: GetPageParameters) => {
      try {
        return await notion.pages.retrieve(input);
      } catch (error) {
        console.error("Error retrieving page:", error);
        throw error;
      }
    },
  },

  updatePage: {
    name: "UpdatePage",
    description: "Updates page property values for the specified page.",
    input: {} as UpdatePageParameters,
    output: {} as UpdatePageResponse,
    execute: async (input: UpdatePageParameters) => {
      try {
        return await notion.pages.update(input);
      } catch (error) {
        console.error("Error updating page:", error);
        throw error;
      }
    },
  },

  retrievePageProperty: {
    name: "RetrievePageProperty",
    description:
      "Retrieves a page property item for the specified page and property.",
    input: {} as GetPagePropertyParameters,
    output: {} as GetPagePropertyResponse,
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
  retrieveUser: {
    name: "RetrieveUser",
    description: "Retrieves a User object using the ID specified.",
    input: {} as GetUserParameters,
    output: {} as GetUserResponse,
    execute: async (input: GetUserParameters) => {
      try {
        return await notion.users.retrieve(input);
      } catch (error) {
        console.error("Error retrieving user:", error);
        throw error;
      }
    },
  },

  listUsers: {
    name: "ListUsers",
    description: "Returns a paginated list of Users for the workspace.",
    input: {} as ListUsersParameters,
    output: {} as ListUsersResponse,
    execute: async (input: ListUsersParameters) => {
      try {
        return await notion.users.list(input);
      } catch (error) {
        console.error("Error listing users:", error);
        throw error;
      }
    },
  },

  retrieveCurrentUser: {
    name: "RetrieveCurrentUser",
    description: "Retrieves the bot User associated with the API token.",
    input: {} as GetSelfParameters,
    output: {} as GetSelfResponse,
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
  createComment: {
    name: "CreateComment",
    description:
      "Creates a comment in a discussion within a page or as a standalone comment.",
    input: {} as CreateCommentParameters,
    output: {} as CreateCommentResponse,
    execute: async (input: CreateCommentParameters) => {
      try {
        return await notion.comments.create(input);
      } catch (error) {
        console.error("Error creating comment:", error);
        throw error;
      }
    },
  },

  listComments: {
    name: "ListComments",
    description:
      "Returns a paginated list of comments for the specified block.",
    input: {} as ListCommentsParameters,
    output: {} as ListCommentsResponse,
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
  search: {
    name: "Search",
    description:
      "Searches all pages and databases that the integration has access to.",
    input: {} as SearchParameters,
    output: {} as SearchResponse,
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
  oauthToken: {
    name: "OAuthToken",
    description:
      "Exchanges the authorization code for an access token and bot ID.",
    input: {} as OauthTokenParameters & {
      client_id: string;
      client_secret: string;
    },
    output: {} as OauthTokenResponse,
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

  oauthIntrospect: {
    name: "OAuthIntrospect",
    description:
      "Check if the token is valid and retrieve basic information about the token.",
    input: {} as OauthIntrospectParameters & {
      client_id: string;
      client_secret: string;
    },
    output: {} as OauthIntrospectResponse,
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

  oauthRevoke: {
    name: "OAuthRevoke",
    description: "Revokes an access token.",
    input: {} as OauthRevokeParameters & {
      client_id: string;
      client_secret: string;
    },
    output: {} as OauthRevokeResponse,
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
export const getNotionAction = (
  actionName: string
): NotionAction<any, any> | undefined => {
  return notionActions[actionName];
};

// Function to list all available NotionAction names
export const listNotionActions = (): string[] => {
  return Object.keys(notionActions);
};

export default notionActions;
