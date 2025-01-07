import { Pinecone } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from 'uuid'; // Import UUID
import dotenv from 'dotenv';
dotenv.config();

const pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const indexName = "suraj";

const createIndexIfNotExists = async () => {
  try {
    console.log("✅ Checking if the Pinecone index exists...");
    const existingIndexes = await pineconeClient.listIndexes();
    const indexNames = existingIndexes.indexes.map(index => index?.name);

    if (!indexNames.includes(indexName)) {
      console.log("⏳ Creating a new Pinecone index...");
      await pineconeClient.createIndex({
        name: indexName,
        dimension: 384,
        metric: 'cosine',
        spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
      });
      console.log(`✅ Pinecone index "${indexName}" created successfully.`);
    } else {
      console.log(`✅ Pinecone index "${indexName}" already exists.`);
    }
  } catch (error) {
    console.error("❌ Error creating Pinecone index:", error.message);
    throw error;
  }
};

const storeEmbeddingsInPinecone = async (embeddings) => {
  try {
    const index = pineconeClient.Index(indexName);
    console.log("⏳ Storing multiple embeddings in Pinecone...");

    // Ensure `embeddings` is formatted as an array
   
    const upsertData = embeddings.map((embedding) => {
      console.log(embedding.metadata,'ttt');
      return {
          id: embedding.id,
          values: embedding.values,
          metadata: { text: embedding.metadata.text },
      };
  });
  


    // Pass `vectors` key with the array to `upsert`
    await index.upsert(upsertData);

    console.log("✅ Embeddings successfully stored in Pinecone.");
  } catch (error) {
    console.error("❌ Error storing embeddings in Pinecone:", error.message);
    throw error;
  }
};

export const createIndexAndUpsert = async (embeddings) => {
  try {
    console.log("🚀 Starting Pinecone Integration Process...");

    // Step 1: Create Index (if necessary)
    await createIndexIfNotExists();

    // Step 2: Store Embeddings in Pinecone
    await storeEmbeddingsInPinecone(embeddings);
    

    console.log("🎉 Process completed successfully!");
  } catch (error) {
    console.error("❌ Process failed:", error.message);
  }
};

export const deletePineconeIndex = async (indexName) => {
  try {
    // Delete the Pinecone index
    await pineconeClient.index(indexName).delete();
    console.log(`Index "${indexName}" deleted successfully.`);
  } catch (error) {
    console.error(`Failed to delete index: ${error.message}`);
  }
};

