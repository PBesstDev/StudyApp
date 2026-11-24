import express from 'express';
import multer from 'multer';
import { pool } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Upload JSON or JSONL
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    let subject = req.body.subject;
    let cards = [];

    if (req.file) {
      const content = req.file.buffer.toString('utf-8');
      const filename = req.file.originalname.toLowerCase();
      if (filename.endsWith('.jsonl')) {
        const lines = content.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
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

    // Upsert cards
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const card of cards) {
        const subj = card.subject || subject;
        await client.query(
          `INSERT INTO cards (user_id, subject, keyword, notes)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, subject, keyword) DO UPDATE SET notes = EXCLUDED.notes`,
          [userId, subj, card.keyword || '', card.notes || '']
        );
      }
      await client.query('COMMIT');
      res.json({ message: `Uploaded ${cards.length} cards to subject "${subject}"` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// Download as JSON or JSONL
router.get('/download/:subject', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject } = req.params;
    const format = req.query.format || 'json';

    const result = await pool.query(
      'SELECT keyword, notes FROM cards WHERE user_id = $1 AND subject = $2 ORDER BY id',
      [userId, subject]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No cards found for subject' });
    }

    if (format === 'jsonl') {
      const lines = result.rows.map(row => JSON.stringify({ subject, keyword: row.keyword, notes: row.notes })).join('\n');
      res.setHeader('Content-Type', 'application/jsonl');
      res.setHeader('Content-Disposition', `attachment; filename="${subject}.jsonl"`);
      res.send(lines);
    } else {
      res.json({ subject, cards: result.rows });
    }
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

// List subjects
router.get('/subjects', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT subject FROM cards WHERE user_id = $1 ORDER BY subject',
      [req.user.id]
    );
    res.json(result.rows.map(r => r.subject));
  } catch (err) {
    console.error('Subjects error:', err);
    res.status(500).json({ error: 'Failed to list subjects' });
  }
});

// Search
router.get('/search', async (req, res) => {
  try {
    const userId = req.user.id;
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Query required' });
    }
    const searchTerm = `%${q.trim()}%`;

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
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
