const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Create a new session (called by agent)
router.post('/', (req, res) => {
  const { campaignSource } = req.body;
  const sessionId = uuidv4();
  try {
    db.prepare(`INSERT INTO sessions (id, campaign_source, status) VALUES (?, ?, 'initiated')`)
      .run(sessionId, campaignSource || 'direct');
    res.json({ success: true, sessionId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get session details
router.get('/:id', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
