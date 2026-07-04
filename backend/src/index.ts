import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import exercisesRouter from './routes/exercises.js';
import workoutsRouter from './routes/workouts.js';
import profileRouter from './routes/profile.js';
import { uploadRouter } from './routes/Upload.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const mongoUri = process.env.MONGO_URI;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/exercises', exercisesRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/profile', profileRouter);
app.use('/api', uploadRouter);

if (!mongoUri) {
  console.error('Missing MONGO_URI. Create backend/.env with MONGO_URI=<your MongoDB connection string>.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
