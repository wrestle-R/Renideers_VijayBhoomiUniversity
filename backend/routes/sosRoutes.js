const express = require('express');
const router = express.Router();
const nearbySosController = require('../controllers/nearbySosController');

/**
 * POST /api/sos/nearby
 * Notify nearby active trekkers about an SOS event
 */
router.post('/nearby', nearbySosController.notifyNearbyTrekkers);

/**
 * GET /api/sos/nearby/check
 * Check for nearby active trekkers (testing/debugging)
 */
router.get('/nearby/check', nearbySosController.checkNearbyTrekkers);

module.exports = router;
