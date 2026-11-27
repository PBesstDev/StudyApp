import express from 'express';
import multer from 'multer';
import { pool } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';

// Create scoped constants for the notes router and file upload handler
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Require authentication for all notes routes
router.use(authMiddleware);

// Upload JSON or JSONL cards and save them for the authenticated user
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Create scoped constants for the authenticated user and submitted subject
    const userId = req.user.id;
    let subject = req.body.subject;
    let cards = [];

    // Read cards from an uploaded file or from the request body
    if (req.file) {
      const content = req.file.buffer.toString('utf-8');
      const filename = req.file.originalname.toLowerCase();
      if (filename.endsWith('.jsonl')) {
        const lines = content.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            // Parse each JSONL line and add valid cards
            const parsed = JSON.parse(line);
            if (parsed.keyword !== undefined && parsed.notes !== undefined) {
              cards.push({ keyword: parsed.keyword, notes: parsed.notes, subject: parsed.subject || subject });
            }
          } catch (e) {
            console.warn('Invalid JSONL line:', line);
          }
        }
      } else {
        const data = JSON.parse(content);
        subject = data.subject || subject;
        cards = data.cards || [];
      }
    } else if (req.body.cards) {
      // Parse cards from JSON text or use the submitted card array
      cards = typeof req.body.cards === 'string' ? JSON.parse(req.body.cards) : req.body.cards;
    } else {
      return res.status(400).json({ error: 'No cards or file provided' });
    }

    if (!subject) {
      return res.status(400).json({ error: 'Subject required' });
    }
    if (!cards.length) {
      return res.status(400).json({ error: 'No valid cards found' });
    }

    // Insert or update cards in a transaction for the selected subject
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const card of cards) {
        // Create a scoped constant for the card subject and upsert the card
        const subj = card.subject || subject;
        await client.query(
          `INSERT INTO cards (user_id, subject, keyword, notes)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, subject, keyword) DO UPDATE SET notes = EXCLUDED.notes`,
          [userId, subj, card.keyword || '', card.notes || '']
        );
      }
      // Commit the card changes and return the upload result
      await client.query('COMMIT');
      res.json({ message: `Uploaded ${cards.length} cards to subject "${subject}"` });
    } catch (err) {
      // Roll back the transaction if a card insert fails
      await client.query('ROLLBACK');
      throw err;
    } finally {
      // Release the database client connection
      client.release();
    }
  } catch (err) {
    // Report and reject any card upload error
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// Download cards for a subject in JSON or JSONL format
router.get('/download/:subject', async (req, res) => {
  try {
    // Create scoped constants for the authenticated user, subject, and format
    const userId = req.user.id;
    const { subject } = req.params;
    const format = req.query.format || 'json';

    // Query cards for the authenticated user and selected subject
    const result = await pool.query(
      'SELECT keyword, notes FROM cards WHERE user_id = $1 AND subject = $2 ORDER BY id',
      [userId, subject]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No cards found for subject' });
    }

    if (format === 'jsonl') {
      // Create a scoped constant for the JSONL lines and return it as an attachment
      const lines = result.rows.map(row => JSON.stringify({ subject, keyword: row.keyword, notes: row.notes })).join('\n');
      res.setHeader('Content-Type', 'application/jsonl');
      res.setHeader('Content-Disposition', `attachment; filename="${subject}.jsonl"`);
      res.send(lines);
    } else {
      // Return the subject and cards as JSON
      res.json({ subject, cards: result.rows });
    }
  } catch (err) {
    // Report and reject any card download error
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

// List the distinct subjects belonging to the authenticated user
router.get('/subjects', async (req, res) => {
  try {
    // Query and return the user's subject names
    const result = await pool.query(
      'SELECT DISTINCT subject FROM cards WHERE user_id = $1 ORDER BY subject',
      [req.user.id]
    );
    res.json(result.rows.map(r => r.subject));
  } catch (err) {
    // Report and reject any subject listing error
    console.error('Subjects error:', err);
    res.status(500).json({ error: 'Failed to list subjects' });
  }
});

// Search the authenticated user's cards by keyword or notes
router.get('/search', async (req, res) => {
  try {
    // Create scoped constants for the authenticated user and search query
    const userId = req.user.id;
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Query required' });
    }
    // Create a scoped constant for the SQL ILIKE search term
    const searchTerm = `%${q.trim()}%`;

    // Query matching cards and limit the returned results
    const result = await pool.query(
      `SELECT subject, keyword, notes
       FROM cards
       WHERE user_id = $1
         AND (keyword ILIKE $2 OR notes ILIKE $2)
       ORDER BY subject, keyword
       LIMIT 50`,
      [userId, searchTerm]
    );

    res.json(result.rows);
  } catch (err) {
    // Report and reject any search error
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
