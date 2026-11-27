import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Create a scoped constant for the PostgreSQL pool constructor
const { Pool } = pg;

// Create a new PostgreSQL connection pool using the database URL from the environment
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/studyapp',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize the database schema and create required tables and indexes
export async function initSchema() {
  // Create a scoped constant for a PostgreSQL client connection
  const client = await pool.connect();
  try {
    // Create the users and cards tables plus search indexes if they do not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        keyword TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, subject, keyword)
      );

      CREATE INDEX IF NOT EXISTS idx_cards_user_subject ON cards(user_id, subject);
      CREATE INDEX IF NOT EXISTS idx_cards_search ON cards USING gin(to_tsvector('english', coalesce(keyword, '') || ' ' || coalesce(notes, '')));
    `);
    console.log('Schema initialized');
  } catch (err) {
    // Report and rethrow any schema initialization error
    console.error('Schema init error:', err);
    throw err;
  } finally {
    // Release the database client connection
    client.release();
  }
}
