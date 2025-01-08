import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

import uploadRouter from './server/routes/upload.js';
import chatRouter from './server/routes/chat.js';

const app = express();
const port = process.env.PORT || 3002; // Fallback to 3002 for local development

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://rag-pinecone.vercel.app' : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

app.use('/api', uploadRouter);
app.use('/api', chatRouter);

// Route for testing the server
app.get('/', (req, res) => {
  res.send("Backend is working...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// If you are on Vercel, don't need to use app.listen() since Vercel handles it
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}
