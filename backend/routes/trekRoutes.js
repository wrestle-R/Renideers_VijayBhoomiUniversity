const express = require('express');
const trekController = require('../controllers/trekController');

const router = express.Router();

// GET /treks - Return all treks as JSON
router.get('/', trekController.getAllTreks);

// GET /treks/:id - Return single trek by ID
router.get('/:id', trekController.getTrekById);

module.exports = router;
