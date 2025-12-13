const express = require('express');
const router = express.Router();
const Activity = require('../models/activity');
const User = require('../models/User');
const UserProfile = require('../models/UserProfiles');
const trekController = require('../controllers/trekController');
const Badge = require('../models/Badge');

// Helper: Find badges user hasn't earned yet
async function getEarnableBadges(profile) {
  const allBadges = await Badge.find();
  const earnedIds = (profile.badges || []).map(b => b.toString());
  return allBadges.filter(b => !earnedIds.includes(b._id.toString()));
}

// Call this after marking an activity as completed
async function checkAndAwardBadges(userId, activity) {
  // Guard: ensure UserProfile model exists and userId provided
  if (!UserProfile || !userId) return [];
  const profile = await UserProfile.findOne({ user_id: userId }).populate('badges');
  if (!profile) return [];
  const earnable = await getEarnableBadges(profile);
  const newBadges = [];

  // Example criteria
  const completedCount = await Activity.countDocuments({ userId, status: 'completed' });

  for (const badge of earnable) {
    if (badge.code === 'first_trek' && completedCount >= 1) newBadges.push(badge._id);
    if (badge.code === 'ten_treks' && completedCount >= 10) newBadges.push(badge._id);
    if (badge.code === 'mountain_goat' && activity.altitude > 2000) newBadges.push(badge._id);
    // Add more criteria as needed
  }

  if (newBadges.length > 0) {
    profile.badges = [...(profile.badges || []), ...newBadges];
    await profile.save();
  }

  return Badge.find({ _id: { $in: newBadges } });
}
// Create new trek session
router.post('/start', async (req, res) => {
  try {
    const { firebaseUid, title, initialLocation } = req.body;
    
    if (!firebaseUid) {
      return res.status(400).json({ error: 'Firebase UID is required' });
    }
    
    // Find or create user
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      // Create user if not found (basic info will be updated from auth later)
      user = new User({
        firebaseUid,
        fullName: title || 'Trek User',
        email: `${firebaseUid}@temp.com`, // Temporary, will be updated from auth
      });
      await user.save();
    }
    
    // Create new activity
    const activity = new Activity({
      userId: user._id,
      firebaseUid,
      title: title || `Activity ${new Date().toLocaleDateString()}`,
      startTime: new Date(),
      status: 'active',
    });
    
    // Add initial location if provided
    if (initialLocation) {
      activity.addLocationPoint({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        altitude: initialLocation.altitude || 0,
        accuracy: initialLocation.accuracy,
        timestamp: new Date(),
        speed: initialLocation.speed || 0,
        heading: initialLocation.heading,
      });
    }

    await activity.save();

    res.status(201).json({
      success: true,
      activity: {
        _id: activity._id,
        title: activity.title,
        status: activity.status,
        startTime: activity.startTime,
      },
    });
  } catch (error) {
    console.error('Error starting trek:', error);
    res.status(500).json({ error: 'Failed to start trek', details: error.message });
  }
});

// Update trek with location point
router.post('/:trekId/location', async (req, res) => {
  try {
    const { trekId } = req.params;
    const { latitude, longitude, altitude, accuracy, speed, heading, timestamp } = req.body;
    
    const activity = await Activity.findById(trekId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.status !== 'active') {
      return res.status(400).json({ error: 'Activity is not active' });
    }

    activity.addLocationPoint({
      latitude,
      longitude,
      altitude: altitude || 0,
      accuracy,
      speed: speed || 0,
      heading,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    await activity.save();

    res.json({ success: true, pointsCount: activity.path.length });
  } catch (error) {
    console.error('Error adding location:', error);
    res.status(500).json({ error: 'Failed to add location', details: error.message });
  }
});

// Update trek with metrics snapshot
router.post('/:trekId/metrics', async (req, res) => {
  try {
    const { trekId } = req.params;
    const { steps, elevation, heartRate, caloriesBurned, speed, distance, timestamp } = req.body;
    
    const activity = await Activity.findById(trekId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.status !== 'active') {
      return res.status(400).json({ error: 'Activity is not active' });
    }

    activity.addMetricsSnapshot({
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      steps: steps || 0,
      elevation: elevation || 0,
      heartRate,
      caloriesBurned: caloriesBurned || 0,
      speed: speed || 0,
      distance: distance || 0,
    });

    await activity.save();

    res.json({ success: true, metricsCount: activity.metricsHistory.length });
  } catch (error) {
    console.error('Error adding metrics:', error);
    res.status(500).json({ error: 'Failed to add metrics', details: error.message });
  }
});

// Pause trek
router.post('/:trekId/pause', async (req, res) => {
  try {
    const { trekId } = req.params;
    
    const activity = await Activity.findById(trekId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    activity.status = 'paused';
    await activity.save();

    res.json({ success: true, status: activity.status });
  } catch (error) {
    console.error('Error pausing trek:', error);
    res.status(500).json({ error: 'Failed to pause trek', details: error.message });
  }
});

// Resume trek
router.post('/:trekId/resume', async (req, res) => {
  try {
    const { trekId } = req.params;
    
    const activity = await Activity.findById(trekId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    activity.status = 'active';
    await activity.save();

    res.json({ success: true, status: activity.status });
  } catch (error) {
    console.error('Error resuming trek:', error);
    res.status(500).json({ error: 'Failed to resume trek', details: error.message });
  }
});

// Complete trek
router.post('/:trekId/complete', async (req, res) => {
  try {
    const { trekId } = req.params;
    const { notes, difficulty, weather, tags } = req.body;
    
    const activity = await Activity.findById(trekId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    activity.complete();

    // Add optional metadata
    if (notes) activity.notes = notes;
    if (difficulty) activity.difficulty = difficulty;
    if (weather) activity.weather = weather;
    if (tags) activity.tags = tags;

    await activity.save();

    let newBadges = [];
    try {
      newBadges = await checkAndAwardBadges(activity.userId, activity);
    } catch (badgeErr) {
      console.error('Error awarding badges (non-fatal):', badgeErr);
      // proceed without failing the complete request
      newBadges = [];
    }

    res.json({
      success: true,
      activity: {
        _id: activity._id,
        title: activity.title,
        status: activity.status,
        startTime: activity.startTime,
        endTime: activity.endTime,
        duration: activity.duration,
        summary: activity.summary,
        path: activity.path,
      },
      newBadges,
    });
  } catch (error) {
    console.error('Error completing trek:', error);
    res.status(500).json({ error: 'Failed to complete trek', details: error.message });
  }
});

// Get trek by ID
router.get('/:trekId', async (req, res) => {
  try {
    const { trekId } = req.params;
    
    const activity = await Activity.findById(trekId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ success: true, activity });
  } catch (error) {
    console.error('Error fetching trek:', error);
    res.status(500).json({ error: 'Failed to fetch trek', details: error.message });
  }
});

// Get user's trek history
router.get('/user/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { status, limit = 20, page = 1 } = req.query;
    
    const query = { firebaseUid };
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const activities = await Activity.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-metricsHistory -path');
    
    const total = await Activity.countDocuments(query);

    res.json({
      success: true,
      activities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching trek history:', error);
    res.status(500).json({ error: 'Failed to fetch trek history', details: error.message });
  }
});

// Get active trek for user
router.get('/user/:firebaseUid/active', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const activity = await Activity.findOne({
      firebaseUid,
      status: { $in: ['active', 'paused'] },
    }).sort({ startTime: -1 });

    res.json({
      success: true,
      activity: activity || null,
    });
  } catch (error) {
    console.error('Error fetching active trek:', error);
    res.status(500).json({ error: 'Failed to fetch active trek', details: error.message });
  }
});

// Delete trek
router.delete('/:trekId', async (req, res) => {
  try {
    const { trekId } = req.params;
    
    const activity = await Activity.findByIdAndDelete(trekId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting trek:', error);
    res.status(500).json({ error: 'Failed to delete trek', details: error.message });
  }
});

// GET /treks - Return all treks as JSON
router.get('/', trekController.getAllTreks);

// GET /treks/:id - Return single trek by ID
router.get('/normal/:id', trekController.getTrekById);

module.exports = router;
