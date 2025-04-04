CREATE VECTOR INDEX `description-embeddings`
FOR (n: Flow) ON (n.description_embedding)
OPTIONS {indexConfig: {
 `vector.dimensions`: 1536,
 `vector.similarity_function`: 'cosine'
}};
