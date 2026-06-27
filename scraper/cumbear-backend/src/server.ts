import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getLiveVideos } from './controllers/videoController';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['https://cumbear.in', 'http://localhost:5173']
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/api/videos', getLiveVideos);

app.get('/health', (req, res) => {
  res.json({ status: 'live', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Cumbear Core Aggregator running on Port ${PORT}`);
});

