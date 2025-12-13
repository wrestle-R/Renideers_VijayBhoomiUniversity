const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.get('/feed', auth, activityController.getFeed);
router.get('/:id', auth, activityController.getActivityById);
router.get('/:id/insights', auth, activityController.getActivityInsights);

module.exports = router;
