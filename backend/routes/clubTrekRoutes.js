const express = require('express');
const router = express.Router();
const clubTrekController = require('../controllers/clubTrekController');

/**
 * POST /api/clubs/:clubId/start-trek
 * Start a club trek (leader only)
 */
router.post('/:clubId/start-trek', clubTrekController.startClubTrek);

/**
 * POST /api/clubs/:clubId/join-trek
 * Join an active club trek (members only)
 */
router.post('/:clubId/join-trek', clubTrekController.joinClubTrek);

/**
 * GET /api/clubs/:clubId/live-status
 * Get live club trek status
 */
router.get('/:clubId/live-status', clubTrekController.getLiveStatus);

/**
 * POST /api/clubs/:clubId/analyze
 * Analyze club trek and generate intelligence (leader only)
 */
router.post('/:clubId/analyze', clubTrekController.analyzeClubTrek);

/**
 * POST /api/clubs/:clubId/stop-trek
 * Stop club trek (leader only)
 */
router.post('/:clubId/stop-trek', clubTrekController.stopClubTrek);

module.exports = router;
