// routes/photoRoutes.js
const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');


router.get('/test-ai', photoController.testAI);
router.post('/identify-species', photoController.identifySpecies);
router.post('/species-details', photoController.getSpeciesDetails);

module.exports = router;
