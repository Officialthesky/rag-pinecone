import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';
dotenv.config();
let client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
let indexName = "suraj"
export class PineconeService {
 

  async upsertVectors(vectors) {
    const index = this.client.Index(this.indexName);

    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert({
        upsertRequest: {
          vectors: batch
        }
      });
    }
  }

  async query(queryVector, topK = 5) {
    const index = client.Index(indexName);

    const queryResponse = await index.query({
      queryRequest: {
        vector: queryVector,
        topK,
        includeMetadata: true
      }
    });

    return queryResponse.matches;
  }
}
