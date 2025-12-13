const Activity = require('../models/activity');
const User = require('../models/User');
const UserProfile = require('../models/UserProfiles');
const { haversineDistance, formatDistance } = require('../lib/haversine');
const twilio = require('twilio');

// Track recent SOS events to prevent duplicate notifications
const recentSOSEvents = new Map(); // key: sosUserId_timestamp, value: notifiedUserIds[]
const SOS_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

/**
 * Get Twilio client instance (lazy initialization)
 */
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    console.error('❌ Missing Twilio credentials for nearby SOS');
    return null;
  }

  try {
    const client = twilio(accountSid, authToken);
    return { client, phoneNumber };
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client for nearby SOS:', error.message);
    return null;
  }
};

/**
 * Clean up old SOS events from memory (prevent memory leak)
 */
const cleanupOldSOSEvents = () => {
  const now = Date.now();
  for (const [key, value] of recentSOSEvents.entries()) {
    const timestamp = parseInt(key.split('_')[1]);
    if (now - timestamp > SOS_COOLDOWN_MS) {
      recentSOSEvents.delete(key);
    }
  }
};

/**
 * Send nearby trekker SOS alerts
 * 
 * POST /api/sos/nearby
 * Body: {
 *   sosUserId: string,
 *   latitude: number,
 *   longitude: number,
 *   timestamp: string,
 *   reason: 'fall' | 'manual'
 * }
 */
exports.notifyNearbyTrekkers = async (req, res) => {
  try {
    console.log('📍 Nearby SOS request received:', {
      sosUserId: req.body.sosUserId,
      location: req.body.latitude && req.body.longitude ? 'provided' : 'missing',
      reason: req.body.reason,
    });

    const { sosUserId, latitude, longitude, timestamp, reason } = req.body;

    // Validate input
    if (!sosUserId || !latitude || !longitude) {
      console.error('❌ Validation failed: Missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: 'sosUserId, latitude, and longitude are required' 
      });
    }

    // Rate limiting check
    const eventKey = `${sosUserId}_${Date.parse(timestamp || new Date())}`;
    if (recentSOSEvents.has(eventKey)) {
      console.log('⚠️ Duplicate SOS event detected, skipping nearby notifications');
      return res.json({ 
        success: true, 
        message: 'Already notified nearby trekkers for this event',
        notifiedCount: recentSOSEvents.get(eventKey).length
      });
    }

    // Clean up old events periodically
    cleanupOldSOSEvents();

    // Constants
    const RADIUS_METERS = 1000; // 1 km
    const LOCATION_MAX_AGE_SEC = 30; // Only use fresh locations
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - LOCATION_MAX_AGE_SEC * 1000);

    // Step 1: Find all active activities with recent location data
    console.log('🔍 Searching for active activities with recent location...');
    const activeActivities = await Activity.find({
      status: 'active',
      userId: { $ne: sosUserId }, // Exclude SOS sender
      'path.0': { $exists: true }, // Has at least one location point
    })
      .select('userId path')
      .lean();

    console.log(`📊 Found ${activeActivities.length} active activities (excluding SOS sender)`);

    // Step 2: Filter by distance and recent location
    const nearbyUsers = [];
    for (const activity of activeActivities) {
      if (!activity.path || activity.path.length === 0) continue;

      // Get last location point
      const lastPoint = activity.path[activity.path.length - 1];
      const pointTime = new Date(lastPoint.timestamp);

      // Skip old locations
      if (pointTime < cutoffTime) {
        console.log(`⏳ Skipping stale location for user ${activity.userId}`);
        continue;
      }

      // Calculate distance
      const distance = haversineDistance(
        latitude,
        longitude,
        lastPoint.latitude,
        lastPoint.longitude
      );

      if (distance <= RADIUS_METERS) {
        nearbyUsers.push({
          userId: activity.userId,
          distance: distance,
          lastLocation: {
            latitude: lastPoint.latitude,
            longitude: lastPoint.longitude,
            timestamp: lastPoint.timestamp,
          },
        });
        console.log(`✅ Nearby user found: ${activity.userId} at ${formatDistance(distance)}`);
      }
    }

    console.log(`📍 Found ${nearbyUsers.length} nearby trekkers within ${formatDistance(RADIUS_METERS)}`);

    if (nearbyUsers.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No nearby trekkers found',
        notifiedCount: 0 
      });
    }

    // Step 3: Get user profiles and phone numbers for notification
    const userIds = nearbyUsers.map(u => u.userId);
    const userProfiles = await UserProfile.find({ user_id: { $in: userIds } })
      .select('user_id phoneNumber')
      .lean();

    const users = await User.find({ _id: { $in: userIds } })
      .select('_id email')
      .lean();

    // Map userId to phone number
    const phoneMap = new Map();
    userProfiles.forEach(profile => {
      if (profile.phoneNumber) {
        phoneMap.set(profile.user_id.toString(), profile.phoneNumber);
      }
    });

    // Step 4: Send notifications
    const twilioConfig = getTwilioClient();
    const notifiedUserIds = [];
    let successCount = 0;
    let failCount = 0;

    for (const nearbyUser of nearbyUsers) {
      const userIdStr = nearbyUser.userId.toString();
      const phoneNumber = phoneMap.get(userIdStr);

      if (!phoneNumber) {
        console.log(`⚠️ No phone number for user ${userIdStr}, skipping`);
        failCount++;
        continue;
      }

      // Build notification message
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const distanceStr = formatDistance(nearbyUser.distance);
      const reasonText = reason === 'fall' ? 'Fall detected' : 'Manual SOS';
      
      const message = `SOS ALERT - Nearby Trekker
${reasonText} near your location.
Someone may need help.
Distance: ~${distanceStr}
Location: ${mapsLink}
Time: ${new Date(timestamp || now).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

      // Send SMS via Twilio
      if (twilioConfig) {
        try {
          const { client: twilioClient, phoneNumber: fromNumber } = twilioConfig;
          await twilioClient.messages.create({
            body: message,
            from: fromNumber,
            to: phoneNumber,
          });
          console.log(`✅ SMS sent to ${phoneNumber} (${distanceStr} away)`);
          notifiedUserIds.push(userIdStr);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error.message);
          failCount++;
        }
      } else {
        console.log(`⚠️ Twilio not configured, would notify ${phoneNumber} (${distanceStr})`);
        failCount++;
      }
    }

    // Store notified users to prevent duplicates
    recentSOSEvents.set(eventKey, notifiedUserIds);

    // Log the event
    console.log(`📊 Nearby SOS notification summary:`, {
      sosUserId,
      nearbyCount: nearbyUsers.length,
      successCount,
      failCount,
      notifiedUserIds,
    });

    return res.json({ 
      success: true, 
      message: `Notified ${successCount} nearby trekkers`,
      notifiedCount: successCount,
      failedCount: failCount,
      nearbyUsersFound: nearbyUsers.length,
    });

  } catch (error) {
    console.error('❌ Error in notifyNearbyTrekkers:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to notify nearby trekkers',
      details: error.message 
    });
  }
};

/**
 * Get nearby active trekkers (for testing/debugging)
 * 
 * GET /api/sos/nearby/check
 * Query: ?latitude=X&longitude=Y&radius=1000
 */
exports.checkNearbyTrekkers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000, userId } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        error: 'latitude and longitude are required' 
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseInt(radius);

    // Find active activities
    const activeActivities = await Activity.find({
      status: 'active',
      userId: { $ne: userId },
      'path.0': { $exists: true },
    })
      .select('userId path status')
      .populate('userId', 'email')
      .lean();

    const nearbyUsers = [];
    const LOCATION_MAX_AGE_SEC = 30;
    const cutoffTime = new Date(Date.now() - LOCATION_MAX_AGE_SEC * 1000);

    for (const activity of activeActivities) {
      if (!activity.path || activity.path.length === 0) continue;

      const lastPoint = activity.path[activity.path.length - 1];
      const pointTime = new Date(lastPoint.timestamp);

      if (pointTime < cutoffTime) continue;

      const distance = haversineDistance(lat, lon, lastPoint.latitude, lastPoint.longitude);

      if (distance <= rad) {
        nearbyUsers.push({
          userId: activity.userId._id,
          email: activity.userId.email,
          distance: formatDistance(distance),
          distanceMeters: Math.round(distance),
          lastLocationTime: lastPoint.timestamp,
          locationAge: Math.round((Date.now() - pointTime.getTime()) / 1000) + 's',
        });
      }
    }

    return res.json({ 
      success: true, 
      nearbyCount: nearbyUsers.length,
      radius: formatDistance(rad),
      nearbyUsers,
    });

  } catch (error) {
    console.error('❌ Error in checkNearbyTrekkers:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check nearby trekkers',
      details: error.message 
    });
  }
};
