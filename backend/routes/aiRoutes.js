const express = require('express');
const aiController = require('../controllers/aiController');
const router = express.Router();

router.post('/recommend', aiController.getRecommendations);
router.post('/summary', aiController.getTrekSummary);
router.post('/chat', aiController.chat);
router.post('/optimize', aiController.optimizeItinerary);
router.post('/estimate', aiController.estimateDifficulty);

module.exports = router;