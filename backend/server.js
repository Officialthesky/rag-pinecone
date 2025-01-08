import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

import uploadRouter from './server/routes/upload.js';
import chatRouter from './server/routes/chat.js';
// ... existing imports ...

// Add this with your other app.use statements


dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());


app.listen(3002, () => {
  console.log('Backend running on http://localhost:3002');
});

app.post('/delete-index', async (req, res) => {
  try {
    await deletePineconeIndex('suraj');
    res.status(200).send('Index deleted');
  } catch (error) {
    res.status(500).send('Error deleting index');
  }
});


app.use('/api', uploadRouter);
app.use('/api', chatRouter);
app.use('/', () =>{
  return res.send("working...")
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});



