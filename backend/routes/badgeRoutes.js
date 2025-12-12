const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');

// GET /api/badges - Get all badges
router.get('/', async (req, res) => {
  try {
    const badges = await Badge.find();
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

module.exports = router;