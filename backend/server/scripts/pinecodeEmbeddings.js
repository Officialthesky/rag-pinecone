import { Pinecone } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const indexName = "suraj";
const BATCH_SIZE = 2000; // Adjust based on your needs

const createIndexIfNotExists = async () => {
  try {
    const existingIndexes = await pineconeClient.listIndexes();
    const indexNames = existingIndexes.indexes.map(index => index?.name);

    if (!indexNames.includes(indexName)) {
      await pineconeClient.createIndex({
        name: indexName,
        dimension: 384,
        metric: 'cosine',
        spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
      });
    }
  } catch (error) {
    console.error("Error creating Pinecone index:", error.message);
    throw error;
  }
};

const storeEmbeddingsInPinecone = async (embeddings) => {
  try {
    const index = pineconeClient.Index(indexName);
    
    // Split embeddings into chunks
    for (let i = 0; i < embeddings.length; i += BATCH_SIZE) {
      const chunk = embeddings.slice(i, i + BATCH_SIZE);
      
      const upsertData = chunk.map((embedding) => ({
        id: embedding.id,
        values: embedding.values,
        metadata: { text: embedding.metadata.text },
      }));

      await index.upsert(upsertData);
      console.log(`Processed batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(embeddings.length/BATCH_SIZE)}`);
    }
  } catch (error) {
    console.error("Error storing embeddings in Pinecone:", error.message);
    throw error;
  }
};

export const createIndexAndUpsert = async (embeddings) => {
  try {
    await createIndexIfNotExists();
    await storeEmbeddingsInPinecone(embeddings);
    return true;
  } catch (error) {
    console.error("Process failed:", error.message);
    throw error;
  }
};

export const deletePineconeIndex = async (indexName) => {
  try {
    await pineconeClient.index(indexName).delete();
    return true;
  } catch (error) {
    console.error(`Failed to delete index: ${error.message}`);
    throw error;
  }
};