const express = require('express');
const router = express.Router();
const followerController = require('../controllers/followerController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

router.post('/follow', followerController.followUser);
router.post('/unfollow', followerController.unfollowUser);
router.post('/accept', followerController.acceptRequest);
router.post('/remove', followerController.removeFollower);

router.get('/followers', followerController.getFollowers);
router.get('/following', followerController.getFollowing);
router.get('/pending', followerController.getPendingRequests);
router.get('/sent', followerController.getSentRequests);
router.get('/search', followerController.searchUsers);
router.get('/stats', followerController.getStats);

module.exports = router;
