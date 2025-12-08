const express = require('express');
const router = express.Router();
const { auth, getProfile, updateProfile, getUserById } = require('../controllers/userControllers');

router.post('/auth', auth);
router.get('/:userId', getUserById);
router.get('/profile/:userId', getProfile);
router.post('/profile', updateProfile);

module.exports = router;
