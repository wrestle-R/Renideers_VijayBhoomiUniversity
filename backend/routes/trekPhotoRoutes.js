// routes/trekPhotoRoutes.js
const express = require('express');
const router = express.Router();
const trekPhotoController = require('../controllers/trekPhotoController');


router.get('/test-ai', trekPhotoController.testAI);
router.post('/identify-species', trekPhotoController.identifySpecies);
router.post('/species-details', trekPhotoController.getSpeciesDetails);

module.exports = router;
