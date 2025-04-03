import { GoogleGenAI } from "@google/genai";

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

export async function embedText(text: string, taskType: TaskType) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.embedContent({
    model: "gemini-embedding-exp-03-07",
    contents: text,
    config: {
      taskType: taskType,
    },
  });
  console.log("response", response);
  return response.embeddings;
}
