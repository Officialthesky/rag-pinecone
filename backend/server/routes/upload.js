import express from 'express';
import multer from 'multer';
import { EmbeddingService } from '../services/embeddings.js';
import { PineconeService } from '../services/pinecone.js';
import { createIndexAndUpsert } from '../scripts/pinecodeEmbeddings.js';

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
});

const embeddingService = new EmbeddingService();

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }


    // Process Excel file and get embeddings
    const vectors = await embeddingService.processExcelFile(req.file.path);

    await createIndexAndUpsert(vectors)

    res.json({
      message: 'File processed and uploaded successfully',
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

router.post('/query', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No query text provided' });
    }

    // Get embedding for query text
    const queryEmbedding = await embeddingService.getEmbedding(text);

    // Search Pinecone
    const pineconeService = new PineconeService(req.app.locals.pinecone);
    const results = await pineconeService.query(queryEmbedding);

    res.json({ results });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Error processing query' });
  }
});

export default router;
