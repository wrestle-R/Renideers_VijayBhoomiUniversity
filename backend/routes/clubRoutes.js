const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const clubTrekController = require('../controllers/clubTrekController');
const { upload } = require('../config/cloudinary');

router.post('/', upload.single('image'), clubController.createClub);
router.get('/', clubController.getAllClubs);
router.get('/:id', clubController.getClubById);
router.get('/:id/messages', clubController.getClubMessages);
router.post('/:id/join', clubController.joinClub);
router.post('/:id/leave', clubController.leaveClub);

// Club Trek Live Intelligence Routes
router.get('/:clubId/active-trek', clubTrekController.getActiveClubTrek);
router.post('/:clubId/start-trek', clubTrekController.startClubTrek);
router.post('/:clubId/join-trek', clubTrekController.joinClubTrek);
router.get('/:clubId/live-status', clubTrekController.getLiveStatus);
router.post('/:clubId/analyze', clubTrekController.analyzeClubTrek);
router.post('/:clubId/stop-trek', clubTrekController.stopClubTrek);

module.exports = router;
