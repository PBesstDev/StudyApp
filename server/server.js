import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSchema } from './db/db.js';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';

dotenv.config();

// Create scoped constants for the Express application and server port
const app = express();
const PORT = process.env.PORT || 3001;

// Configure cross-origin requests and JSON or URL-encoded request parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Return server health and service status for the health check route
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'StudyApp Server' }));

// Connect authentication and notes routes under their API prefixes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// Handle unexpected server errors and return a generic response
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Return a not-found response when no route matches the request
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize the database schema and start the Express server
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
