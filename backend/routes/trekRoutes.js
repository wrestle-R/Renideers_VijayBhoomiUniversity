const express = require('express');
const router = express.Router();
const Trek = require('../models/Trek');
const User = require('../models/User');

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
    
    // Create new trek
    const trek = new Trek({
      userId: user._id,
      firebaseUid,
      title: title || `Trek ${new Date().toLocaleDateString()}`,
      startTime: new Date(),
      status: 'active',
    });
    
    // Add initial location if provided
    if (initialLocation) {
      trek.addLocationPoint({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        altitude: initialLocation.altitude || 0,
        accuracy: initialLocation.accuracy,
        timestamp: new Date(),
        speed: initialLocation.speed || 0,
        heading: initialLocation.heading,
      });
    }
    
    await trek.save();
    
    res.status(201).json({
      success: true,
      trek: {
        _id: trek._id,
        title: trek.title,
        status: trek.status,
        startTime: trek.startTime,
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
    
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ error: 'Trek not found' });
    }
    
    if (trek.status !== 'active') {
      return res.status(400).json({ error: 'Trek is not active' });
    }
    
    trek.addLocationPoint({
      latitude,
      longitude,
      altitude: altitude || 0,
      accuracy,
      speed: speed || 0,
      heading,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
    
    await trek.save();
    
    res.json({ success: true, pointsCount: trek.path.length });
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
    
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ error: 'Trek not found' });
    }
    
    if (trek.status !== 'active') {
      return res.status(400).json({ error: 'Trek is not active' });
    }
    
    trek.addMetricsSnapshot({
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      steps: steps || 0,
      elevation: elevation || 0,
      heartRate,
      caloriesBurned: caloriesBurned || 0,
      speed: speed || 0,
      distance: distance || 0,
    });
    
    await trek.save();
    
    res.json({ success: true, metricsCount: trek.metricsHistory.length });
  } catch (error) {
    console.error('Error adding metrics:', error);
    res.status(500).json({ error: 'Failed to add metrics', details: error.message });
  }
});

// Pause trek
router.post('/:trekId/pause', async (req, res) => {
  try {
    const { trekId } = req.params;
    
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ error: 'Trek not found' });
    }
    
    trek.status = 'paused';
    await trek.save();
    
    res.json({ success: true, status: trek.status });
  } catch (error) {
    console.error('Error pausing trek:', error);
    res.status(500).json({ error: 'Failed to pause trek', details: error.message });
  }
});

// Resume trek
router.post('/:trekId/resume', async (req, res) => {
  try {
    const { trekId } = req.params;
    
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ error: 'Trek not found' });
    }
    
    trek.status = 'active';
    await trek.save();
    
    res.json({ success: true, status: trek.status });
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
    
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ error: 'Trek not found' });
    }
    
    trek.complete();
    
    // Add optional metadata
    if (notes) trek.notes = notes;
    if (difficulty) trek.difficulty = difficulty;
    if (weather) trek.weather = weather;
    if (tags) trek.tags = tags;
    
    await trek.save();
    
    res.json({
      success: true,
      trek: {
        _id: trek._id,
        title: trek.title,
        status: trek.status,
        startTime: trek.startTime,
        endTime: trek.endTime,
        duration: trek.duration,
        summary: trek.summary,
        path: trek.path,
      },
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
    
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ error: 'Trek not found' });
    }
    
    res.json({ success: true, trek });
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
    
    const treks = await Trek.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-metricsHistory -path');
    
    const total = await Trek.countDocuments(query);
    
    res.json({
      success: true,
      treks,
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
    
    const trek = await Trek.findOne({
      firebaseUid,
      status: { $in: ['active', 'paused'] },
    }).sort({ startTime: -1 });
    
    res.json({
      success: true,
      trek: trek || null,
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
    
    const trek = await Trek.findByIdAndDelete(trekId);
    if (!trek) {
      return res.status(404).json({ error: 'Trek not found' });
    }
    
    res.json({ success: true, message: 'Trek deleted successfully' });
  } catch (error) {
    console.error('Error deleting trek:', error);
    res.status(500).json({ error: 'Failed to delete trek', details: error.message });
  }
});

module.exports = router;
