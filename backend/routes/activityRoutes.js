const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.get('/feed', auth, activityController.getFeed);

module.exports = router;
