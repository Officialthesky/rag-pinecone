import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import uploadRouter from './server/routes/upload.js';
import chatRouter from './server/routes/chat.js';

// Cache directory for transformers (fallback for older versions)
import { env } from 'process';
env.TRANSFORMERS_CACHE = '/tmp/transformers-cache'; // Writable directory for serverless

const app = express();
const port = process.env.PORT || 3002;

const allowedOrigins = [
  'https://rag-pinecone.vercel.app', // Your Vercel domain
  'http://localhost:3000', // Local development
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

app.use('/api', uploadRouter);
app.use('/api', chatRouter);

// Test route
app.get('/', (req, res) => {
  res.send("Backend is working...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

console.log(`Environment: ${process.env.NODE_ENV}`);

export default app; // Export the app for external use (e.g., API handler)

// Local development (only runs with NODE_ENV !== 'production')
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}
