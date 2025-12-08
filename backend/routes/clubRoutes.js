const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const { upload } = require('../config/cloudinary');

router.post('/', upload.single('image'), clubController.createClub);
router.get('/', clubController.getAllClubs);
router.get('/:id', clubController.getClubById);
router.get('/:id/messages', clubController.getClubMessages);
router.post('/:id/join', clubController.joinClub);
router.post('/:id/leave', clubController.leaveClub);

module.exports = router;
