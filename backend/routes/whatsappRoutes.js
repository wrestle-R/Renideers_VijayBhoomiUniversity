const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Twilio webhook endpoint for incoming WhatsApp messages
router.post('/webhook', whatsappController.incoming);

module.exports = router;
