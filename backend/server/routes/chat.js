// routes/chat.js
import express from 'express';
import { EmbeddingService } from '../services/embeddings.js';
import { PineconeService } from '../services/pinecone.js';
import { GeminiService } from '../services/gemini.js';
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';
dotenv.config();

let client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
let indexName = "suraj"

const router = express.Router();
const embeddingService = new EmbeddingService();
const geminiService = new GeminiService();

router.post('/sendMessage', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Get embedding for query
    const queryEmbedding = await embeddingService.getEmbedding(message);

    // Search Pinecone for relevant context
    let index = client.Index(indexName)

    const searchResults = await index.query({ vector: queryEmbedding, topK: 5, includeMetadata: true  });

    console.log(JSON.stringify(searchResults, null, 2), "Raw searchResults");

    // Check matches and metadata
    if (!searchResults.matches || searchResults.matches.length === 0) {
      console.warn("No matches found in Pinecone.");
      return res.status(404).json({ error: "No relevant context found." });
    }

    // Extract context
    const context = searchResults.matches
      .map(result => result.metadata?.content || result.metadata?.text || "No metadata available")
      .join('\n');

    console.log(context, "Generated Context");

    // Generate response using Gemini
    const response = await geminiService.generateResponse(
      context,
      message,
      history
    );

    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      error: 'Error processing chat request',
      details: error.message
    });
  }
});

export default router;