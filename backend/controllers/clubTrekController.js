const Activity = require('../models/activity');
const Club = require('../models/Club');
const User = require('../models/User');
const UserProfile = require('../models/UserProfiles');
const { haversineDistance, formatDistance } = require('../lib/haversine');

// Configuration constants (lowered for testing)
const CONFIG = {
  LOCATION_MAX_AGE_SEC: 300, // Use location data from last 5 minutes (increased for testing)
  AHEAD_THRESHOLD_M: 10, // Member is ahead if > 30m from leader/centroid (testing)
  LAGGING_THRESHOLD_M: 10, // Member is lagging if > 50m behind (testing)
  TIRED_SPEED_THRESHOLD_PERCENT: 15, // Member tired if speed < (avg - 15%)
  TIRED_DURATION_MIN: 1, // Member must be slow for 1+ minute to be "tired" (testing)
  ALERT_COOLDOWN_MS: 1 * 60 * 1000, // 1 minute between same alert (testing)
  PACE_VARIANCE_THRESHOLD: 0.2, // High variance if stddev > 0.2 m/s (testing)
};

// In-memory alert tracking (prevent spam)
const recentAlerts = new Map(); // key: `${clubId}_${alertType}_${memberId}`, value: timestamp

/**
 * Clean up old alerts from memory
 */
const cleanupOldAlerts = () => {
  const now = Date.now();
  for (const [key, timestamp] of recentAlerts.entries()) {
    if (now - timestamp > CONFIG.ALERT_COOLDOWN_MS) {
      recentAlerts.delete(key);
    }
  }
};

/**
 * Check if alert should be sent (rate limiting)
 */
const shouldSendAlert = (clubId, alertType, memberId = '') => {
  const key = `${clubId}_${alertType}_${memberId}`;
  const lastSent = recentAlerts.get(key);
  const now = Date.now();
  
  if (lastSent && (now - lastSent) < CONFIG.ALERT_COOLDOWN_MS) {
    return false; // Too soon
  }
  
  recentAlerts.set(key, now);
  return true;
};

/**
 * Start a club trek (leader only)
 * 
 * POST /api/clubs/:clubId/start-trek
 * Body: { activityId: string }
 */
exports.startClubTrek = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { activityId } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId || !activityId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing userId or activityId' 
      });
    }

    // Verify club exists and user is the creator (leader)
    const club = await Club.findById(clubId).populate('members', 'email');
    if (!club) {
      return res.status(404).json({ 
        success: false, 
        error: 'Club not found' 
      });
    }

    if (club.creator.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only club leader can start club trek' 
      });
    }

    // Verify activity exists and belongs to leader
    const activity = await Activity.findById(activityId);
    if (!activity || activity.userId.toString() !== userId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Activity not found or does not belong to user' 
      });
    }

    if (activity.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        error: 'Activity must be active to start club trek' 
      });
    }

    // Attach clubId to activity
    activity.clubId = clubId;
    await activity.save();

    console.log(`✅ Club trek started: ${clubId} by leader ${userId}`);

    // Get leader profile for notification
    const leaderProfile = await UserProfile.findOne({ user_id: userId });
    const leaderName = leaderProfile?.username || 'Club Leader';

    // TODO: Send in-app notifications to all club members
    // For now, just log it
    console.log(`📢 Notification: "${leaderName} started a club trek. Start tracking to join."`);
    console.log(`📢 Recipients: ${club.members.length} members`);

    return res.json({ 
      success: true, 
      message: 'Club trek started successfully',
      clubTrek: {
        clubId,
        leaderId: userId,
        activityId,
        startedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('❌ Error starting club trek:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to start club trek',
      details: error.message 
    });
  }
};

/**
 * Get active club trek info
 * 
 * GET /api/clubs/:clubId/active-trek
 * Returns info about any active club trek for this club
 */
exports.getActiveClubTrek = async (req, res) => {
  try {
    const { clubId } = req.params;

    // Find any active activities with this clubId
    const activeActivities = await Activity.find({
      clubId: clubId,
      status: 'active'
    }).populate('userId', 'fullName photoUrl');

    if (activeActivities.length === 0) {
      return res.json({
        isActive: false,
        message: 'No active club trek'
      });
    }

    // Find the leader (should be the first one who started)
    const leaderActivity = activeActivities[0];
    
    return res.json({
      isActive: true,
      leaderName: leaderActivity.userId?.fullName || 'Unknown',
      leaderPhoto: leaderActivity.userId?.photoUrl || '',
      memberCount: activeActivities.length,
      startedAt: leaderActivity.startTime,
      activities: activeActivities.map(a => ({
        userId: a.userId?._id,
        userName: a.userId?.fullName,
        startTime: a.startTime
      }))
    });

  } catch (error) {
    console.error('❌ Error getting active club trek:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get active club trek',
      details: error.message
    });
  }
};

/**
 * Join an active club trek (members only)
 * 
 * POST /api/clubs/:clubId/join-trek
 * Body: { activityId: string }
 */
exports.joinClubTrek = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { activityId } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId || !activityId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing userId or activityId' 
      });
    }

    // Verify club exists and user is a member
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ 
        success: false, 
        error: 'Club not found' 
      });
    }

    const isMember = club.members.some(m => m.toString() === userId);
    if (!isMember && club.creator.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not a member of this club' 
      });
    }

    // Check if leader has an active club trek
    const leaderActivity = await Activity.findOne({
      userId: club.creator,
      clubId,
      status: 'active',
    });

    if (!leaderActivity) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active club trek to join. Leader must start trek first.' 
      });
    }

    // Verify member's activity
    const activity = await Activity.findById(activityId);
    if (!activity || activity.userId.toString() !== userId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Activity not found or does not belong to user' 
      });
    }

    if (activity.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        error: 'Activity must be active to join club trek' 
      });
    }

    // Attach clubId to member's activity
    activity.clubId = clubId;
    await activity.save();

    console.log(`✅ Member ${userId} joined club trek ${clubId}`);

    return res.json({ 
      success: true, 
      message: 'Joined club trek successfully',
      clubTrek: {
        clubId,
        activityId,
        joinedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('❌ Error joining club trek:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to join club trek',
      details: error.message 
    });
  }
};

/**
 * Get live club trek status
 * 
 * GET /api/clubs/:clubId/live-status
 */
exports.getLiveStatus = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.headers['x-user-id'];

    // Verify club exists
    const club = await Club.findById(clubId).populate('creator', 'email');
    if (!club) {
      return res.status(404).json({ 
        success: false, 
        error: 'Club not found' 
      });
    }

    // Find all active activities for this club
    const cutoffTime = new Date(Date.now() - CONFIG.LOCATION_MAX_AGE_SEC * 1000);
    const activeActivities = await Activity.find({
      clubId,
      status: 'active',
      'path.0': { $exists: true },
    })
      .populate('userId', 'email')
      .lean();

    if (activeActivities.length === 0) {
      return res.json({ 
        success: true, 
        isActive: false,
        message: 'No active club trek',
      });
    }

    // Filter activities with recent location data
    const activeMembersData = [];
    let leaderData = null;

    for (const activity of activeActivities) {
      if (!activity.path || activity.path.length === 0) continue;

      const lastPoint = activity.path[activity.path.length - 1];
      const pointTime = new Date(lastPoint.timestamp);

      // Skip stale locations
      if (pointTime < cutoffTime) continue;

      const memberData = {
        userId: activity.userId._id,
        email: activity.userId.email,
        activityId: activity._id,
        lastLocation: {
          latitude: lastPoint.latitude,
          longitude: lastPoint.longitude,
          timestamp: lastPoint.timestamp,
        },
        distance: activity.summary?.totalDistance || 0,
        avgSpeed: activity.summary?.averageSpeed || 0,
        isLeader: activity.userId._id.toString() === club.creator.toString(),
      };

      activeMembersData.push(memberData);

      if (memberData.isLeader) {
        leaderData = memberData;
      }
    }

    return res.json({ 
      success: true, 
      isActive: true,
      clubId,
      leaderId: club.creator._id,
      activeMembersCount: activeMembersData.length,
      members: activeMembersData,
      leaderActive: !!leaderData,
    });

  } catch (error) {
    console.error('❌ Error getting live status:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get live status',
      details: error.message 
    });
  }
};

/**
 * Analyze club trek and generate intelligence
 * 
 * POST /api/clubs/:clubId/analyze
 * Returns: member classifications, alerts, suggestions
 */
exports.analyzeClubTrek = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.headers['x-user-id'];

    console.log('📊 Analyze request for club:', clubId, 'from user:', userId);

    // Verify club exists
    const club = await Club.findById(clubId).populate('creator members', 'email');
    if (!club) {
      console.log('❌ Club not found:', clubId);
      return res.status(404).json({ 
        success: false, 
        error: 'Club not found' 
      });
    }

    // Only leader can analyze
    if (club.creator._id.toString() !== userId) {
      console.log('❌ User is not leader. Creator:', club.creator._id.toString(), 'User:', userId);
      return res.status(403).json({ 
        success: false, 
        error: 'Only club leader can view analytics' 
      });
    }

    // Find all active activities for this club
    const cutoffTime = new Date(Date.now() - CONFIG.LOCATION_MAX_AGE_SEC * 1000);
    const activeActivities = await Activity.find({
      clubId,
      status: 'active',
      'path.0': { $exists: true },
    })
      .populate('userId', 'email')
      .lean();

    console.log('🔍 Found', activeActivities.length, 'active activities with clubId:', clubId);

    if (activeActivities.length === 0) {
      console.log('⚠️ No active activities found');
      return res.json({ 
        success: true, 
        isActive: false,
        message: 'No active club trek',
      });
    }

    // Build member data with recent locations
    const activeMembersData = [];
    let leaderData = null;

    for (const activity of activeActivities) {
      if (!activity.path || activity.path.length === 0) {
        console.log('⚠️ Activity', activity._id, 'has no path');
        continue;
      }

      const lastPoint = activity.path[activity.path.length - 1];
      const pointTime = new Date(lastPoint.timestamp);
      const ageSeconds = (Date.now() - pointTime.getTime()) / 1000;

      console.log('📍 Activity', activity._id, 'last point age:', ageSeconds.toFixed(0), 'seconds');

      if (pointTime < cutoffTime) {
        console.log('⏰ Skipping stale location (older than', CONFIG.LOCATION_MAX_AGE_SEC, 'seconds)');
        continue;
      }

      // Get user profile for name
      const profile = await UserProfile.findOne({ user_id: activity.userId._id });
      
      const memberData = {
        userId: activity.userId._id.toString(),
        name: profile?.username || activity.userId.email,
        email: activity.userId.email,
        activityId: activity._id,
        lastLocation: {
          latitude: lastPoint.latitude,
          longitude: lastPoint.longitude,
          timestamp: lastPoint.timestamp,
        },
        distance: activity.summary?.totalDistance || 0,
        avgSpeed: activity.summary?.averageSpeed || lastPoint.speed || 0,
        isLeader: activity.userId._id.toString() === club.creator._id.toString(),
        startTime: activity.startTime,
      };

      activeMembersData.push(memberData);

      if (memberData.isLeader) {
        leaderData = memberData;
      }
    }

    console.log('✅ Active members with fresh locations:', activeMembersData.length);

    if (!leaderData) {
      return res.json({ 
        success: true, 
        isActive: true,
        error: 'Leader is not actively trekking',
        activeMembersCount: activeMembersData.length,
      });
    }

    // Calculate group metrics
    const groupAvgSpeed = activeMembersData.reduce((sum, m) => sum + m.avgSpeed, 0) / activeMembersData.length;
    
    // Calculate group centroid
    const centroidLat = activeMembersData.reduce((sum, m) => sum + m.lastLocation.latitude, 0) / activeMembersData.length;
    const centroidLng = activeMembersData.reduce((sum, m) => sum + m.lastLocation.longitude, 0) / activeMembersData.length;

    // Classify each member
    const classifications = [];
    const alerts = [];
    let laggingCount = 0;
    let aheadCount = 0;
    let tiredCount = 0;

    for (const member of activeMembersData) {
      if (member.isLeader) {
        classifications.push({
          ...member,
          classification: 'LEADER',
          distanceFromLeader: 0,
          distanceFromCentroid: 0,
        });
        continue;
      }

      // Calculate distances
      const distanceFromLeader = haversineDistance(
        leaderData.lastLocation.latitude,
        leaderData.lastLocation.longitude,
        member.lastLocation.latitude,
        member.lastLocation.longitude
      );

      const distanceFromCentroid = haversineDistance(
        centroidLat,
        centroidLng,
        member.lastLocation.latitude,
        member.lastLocation.longitude
      );

      // Determine classification
      let classification = 'ON_PACE';
      
      // Check if ahead
      if (distanceFromLeader > CONFIG.AHEAD_THRESHOLD_M) {
        // Check if actually ahead or behind (using leader's path direction)
        // For simplicity, we'll use centroid logic
        if (distanceFromCentroid > CONFIG.AHEAD_THRESHOLD_M) {
          classification = 'AHEAD';
          aheadCount++;
        }
      }
      
      // Check if lagging
      if (distanceFromLeader > CONFIG.LAGGING_THRESHOLD_M && distanceFromCentroid > CONFIG.LAGGING_THRESHOLD_M) {
        classification = 'LAGGING';
        laggingCount++;
        
        // Generate alert
        if (shouldSendAlert(clubId, 'LAGGING', member.userId)) {
          alerts.push({
            type: 'LAGGING',
            memberId: member.userId,
            memberName: member.name,
            message: `⚠️ ${member.name} is falling behind (~${formatDistance(distanceFromLeader)})`,
            severity: 'warning',
          });
        }
      }
      
      // Check if tired (slow speed)
      const speedThreshold = groupAvgSpeed * (1 - CONFIG.TIRED_SPEED_THRESHOLD_PERCENT / 100);
      if (member.avgSpeed < speedThreshold && member.avgSpeed > 0) {
        const trekDurationMin = (Date.now() - new Date(member.startTime).getTime()) / (1000 * 60);
        if (trekDurationMin > CONFIG.TIRED_DURATION_MIN) {
          classification = 'TIRED';
          tiredCount++;
          
          if (shouldSendAlert(clubId, 'TIRED', member.userId)) {
            alerts.push({
              type: 'TIRED',
              memberId: member.userId,
              memberName: member.name,
              message: `⚠️ ${member.name} might be tired (slow pace)`,
              severity: 'info',
            });
          }
        }
      }

      classifications.push({
        ...member,
        classification,
        distanceFromLeader,
        distanceFromCentroid,
        speedDiffFromGroup: member.avgSpeed - groupAvgSpeed,
      });
    }

    // Generate group-level alerts
    if (laggingCount >= 2 && shouldSendAlert(clubId, 'MULTIPLE_LAGGING')) {
      alerts.push({
        type: 'MULTIPLE_LAGGING',
        message: `⚠️ Multiple members (${laggingCount}) are struggling`,
        severity: 'critical',
      });
    }

    // Calculate pace variance
    const speedVariances = activeMembersData.map(m => Math.pow(m.avgSpeed - groupAvgSpeed, 2));
    const speedStdDev = Math.sqrt(speedVariances.reduce((a, b) => a + b, 0) / speedVariances.length);
    
    if (speedStdDev > CONFIG.PACE_VARIANCE_THRESHOLD && shouldSendAlert(clubId, 'PACE_MISMATCH')) {
      alerts.push({
        type: 'PACE_MISMATCH',
        message: '⚠️ Group pace mismatch detected',
        severity: 'warning',
      });
    }

    // Generate suggestions
    const suggestions = [];
    
    if (laggingCount >= 1 && laggingCount <= 2) {
      suggestions.push({
        type: 'REGROUP',
        message: '💡 Suggestion: Regroup and wait for slower members',
        priority: 'high',
      });
    }
    
    if (laggingCount >= 3) {
      suggestions.push({
        type: 'SPLIT_GROUP',
        message: '💡 Suggestion: Consider splitting into faster and slower subgroups',
        priority: 'medium',
      });
    }
    
    if (speedStdDev > CONFIG.PACE_VARIANCE_THRESHOLD) {
      suggestions.push({
        type: 'ADJUST_PACE',
        message: '💡 Suggestion: Adjust group pace to reduce variance',
        priority: 'medium',
      });
    }

    // Check if leader is far ahead
    const leaderCentroidDist = haversineDistance(
      leaderData.lastLocation.latitude,
      leaderData.lastLocation.longitude,
      centroidLat,
      centroidLng
    );
    
    if (leaderCentroidDist > CONFIG.AHEAD_THRESHOLD_M * 1.5) {
      suggestions.push({
        type: 'LEADER_SLOW_DOWN',
        message: '💡 Suggestion: Leader, slow down or wait for the group',
        priority: 'high',
      });
    }

    // Clean up old alerts
    cleanupOldAlerts();

    return res.json({ 
      success: true, 
      isActive: true,
      clubId,
      timestamp: new Date(),
      groupMetrics: {
        totalMembers: activeMembersData.length,
        avgSpeed: groupAvgSpeed,
        speedStdDev,
        centroid: { latitude: centroidLat, longitude: centroidLng },
      },
      summary: {
        onPace: activeMembersData.length - laggingCount - aheadCount - tiredCount,
        ahead: aheadCount,
        lagging: laggingCount,
        tired: tiredCount,
      },
      members: classifications,
      alerts,
      suggestions,
    });

  } catch (error) {
    console.error('❌ Error analyzing club trek:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze club trek',
      details: error.message 
    });
  }
};

/**
 * Stop club trek (leader only)
 * 
 * POST /api/clubs/:clubId/stop-trek
 */
exports.stopClubTrek = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.headers['x-user-id'];

    // Verify club exists and user is the leader
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ 
        success: false, 
        error: 'Club not found' 
      });
    }

    if (club.creator.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only club leader can stop club trek' 
      });
    }

    // Find all active club activities
    const activeActivities = await Activity.find({
      clubId,
      status: 'active',
    });

    // Remove clubId from all activities (they continue as individual treks)
    for (const activity of activeActivities) {
      activity.clubId = undefined;
      await activity.save();
    }

    console.log(`✅ Club trek stopped: ${clubId}, ${activeActivities.length} activities disassociated`);

    return res.json({ 
      success: true, 
      message: 'Club trek stopped. Members can continue individual treks.',
      affectedActivities: activeActivities.length,
    });

  } catch (error) {
    console.error('❌ Error stopping club trek:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to stop club trek',
      details: error.message 
    });
  }
};
