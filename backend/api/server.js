import { createServer } from 'http';
import app from '../backend/server.js'; // Adjust the path as per your project structure

const server = createServer(app);

export default server; // Export the server for Vercel to handle
