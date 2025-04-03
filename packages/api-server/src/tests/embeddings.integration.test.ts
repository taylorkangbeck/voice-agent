import { GoogleGenAI } from "@google/genai";
import { embedText } from "../lib/embeddings";

// Need to import or redeclare TaskType enum
enum TaskType {
  SEMANTIC_SIMILARITY = "SEMANTIC_SIMILARITY",
  CLASSIFICATION = "CLASSIFICATION",
  CLUSTERING = "CLUSTERING",
  RETRIEVAL_DOCUMENT = "RETRIEVAL_DOCUMENT",
  RETRIEVAL_QUERY = "RETRIEVAL_QUERY",
  QUESTION_ANSWERING = "QUESTION_ANSWERING",
  FACT_VERIFICATION = "FACT_VERIFICATION",
  CODE_RETRIEVAL_QUERY = "CODE_RETRIEVAL_QUERY",
}

// Mock the GoogleGenAI class
jest.mock("@google/genai", () => {
  // Create a mock implementation factory that we can modify during tests
  const mockImplementation = jest.fn().mockImplementation(() => {
    return {
      models: {
        embedContent: jest.fn().mockResolvedValue({
          embeddings: [
            {
              values: [0.1, 0.2, 0.3, 0.4, 0.5],
              statistics: {
                truncated: false,
                tokenCount: 5,
              },
            },
          ],
        }),
      },
    };
  });

  return {
    GoogleGenAI: mockImplementation,
  };
});

describe("Embeddings Integration Tests", () => {
  const originalEnv = process.env;
  let mockGoogleGenAI: jest.Mock;

  beforeEach(() => {
    // Set up test environment
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.GEMINI_API_KEY = "test-api-key";

    // Get reference to the mock constructor
    mockGoogleGenAI = GoogleGenAI as unknown as jest.Mock;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it("should generate embeddings for text", async () => {
    // Test text to embed
    const textToEmbed = "This is a sample text for embedding";

    // Call the embedText function with SEMANTIC_SIMILARITY task type
    const result = await embedText(textToEmbed, TaskType.SEMANTIC_SIMILARITY);

    // Verify the GoogleGenAI constructor was called with the correct API key
    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-api-key" });

    // Expect the result to be defined and have the mock structure
    expect(result).toBeDefined();
    if (result && result.length > 0) {
      const embedding = result[0];
      if (embedding) {
        expect(embedding.values).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
        expect(embedding.statistics?.truncated).toBe(false);
        expect(embedding.statistics?.tokenCount).toBe(5);
      }
    }
  });

  it("should generate embeddings for different task types", async () => {
    // Create a spy on the embedContent method
    const mockEmbedContent = jest.fn().mockResolvedValue({
      embeddings: [
        {
          values: [0.1, 0.2, 0.3, 0.4, 0.5],
          statistics: {
            truncated: false,
            tokenCount: 5,
          },
        },
      ],
    });

    // Override the mock implementation for this test
    mockGoogleGenAI.mockImplementationOnce(() => {
      return {
        models: {
          embedContent: mockEmbedContent,
        },
      } as any;
    });

    // Test text to embed
    const textToEmbed = "This is a sample text for embedding";

    // Test with RETRIEVAL_QUERY task type
    await embedText(textToEmbed, TaskType.RETRIEVAL_QUERY);

    // Verify embedContent was called with correct parameters
    expect(mockEmbedContent).toHaveBeenCalledWith({
      model: "gemini-embedding-exp-03-07",
      contents: textToEmbed,
      config: {
        taskType: TaskType.RETRIEVAL_QUERY,
      },
    });
  });

  it("should throw an error when API key is missing", async () => {
    // Remove the API key
    delete process.env.GEMINI_API_KEY;

    // Update mock to throw error when constructed without API key
    mockGoogleGenAI.mockImplementationOnce(() => {
      throw new Error("API key not provided");
    });

    // Test text to embed
    const textToEmbed = "This is a sample text for embedding";

    // Expect the function to throw an error
    await expect(
      embedText(textToEmbed, TaskType.SEMANTIC_SIMILARITY)
    ).rejects.toThrow("API key not provided");
  });

  it("should handle API errors gracefully", async () => {
    // Override mock to throw an API error
    mockGoogleGenAI.mockImplementationOnce(() => {
      return {
        models: {
          embedContent: jest.fn().mockRejectedValue(new Error("API Error")),
        },
      } as any;
    });

    // Test text to embed
    const textToEmbed = "This is a sample text for embedding";

    // Expect the function to pass the error through
    await expect(
      embedText(textToEmbed, TaskType.SEMANTIC_SIMILARITY)
    ).rejects.toThrow("API Error");
  });
});
