import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSchema } from './db/db.js';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'StudyApp Server' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function start() {
  try {
    await initSchema();
    app.listen(PORT, () => {
      console.log(`StudyApp server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
