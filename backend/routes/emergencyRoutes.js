const express = require('express');
const router = express.Router();
const { sendSOS } = require('../controllers/emergencyController');

/**
 * POST /api/emergency/send-sos
 * Send emergency SOS SMS automatically (no user interaction)
 */
router.post('/send-sos', sendSOS);

module.exports = router;
