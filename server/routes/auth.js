import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/db.js';
import { generateToken } from '../middleware/auth.js';

// Create a scoped constant for the authentication route router
const router = express.Router();

// Register a new user and return a signed authentication token
router.post('/register', async (req, res) => {
  try {
    // Create scoped constants for the submitted username and password
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create scoped constants for the password hash and inserted user
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hashed]
    );
    const user = result.rows[0];
    const token = generateToken(user.id, user.username);
    res.status(201).json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    // Report the registration error and handle duplicate usernames
    console.error('Register error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Log in an existing user and return a signed authentication token
router.post('/login', async (req, res) => {
  try {
    // Create scoped constants for the submitted username and password
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Create scoped constants for the database result and matching user
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    // Validate the submitted password against the stored password hash
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken(user.id, user.username);
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    // Report and reject any login error
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
