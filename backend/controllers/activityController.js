const Activity = require('../models/activity');
const Follower = require('../models/Follower');
const User = require('../models/User');
const { Groq } = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper function to validate activity data
const validateActivityData = (activity) => {
  const errors = [];
  
  if (!activity.summary) {
    errors.push('Summary data is missing');
    return { isValid: false, errors };
  }

  const { summary, startTime, endTime, duration } = activity;

  // Validate distance
  if (typeof summary.totalDistance !== 'number' || summary.totalDistance < 0) {
    summary.totalDistance = 0;
  }

  // Validate speeds
  if (typeof summary.averageSpeed !== 'number' || summary.averageSpeed < 0) {
    summary.averageSpeed = 0;
  }
  if (typeof summary.maxSpeed !== 'number' || summary.maxSpeed < 0) {
    summary.maxSpeed = 0;
  }

  // Validate elevation
  if (typeof summary.totalElevationGain !== 'number' || summary.totalElevationGain < 0) {
    summary.totalElevationGain = 0;
  }
  if (typeof summary.totalElevationLoss !== 'number' || summary.totalElevationLoss < 0) {
    summary.totalElevationLoss = 0;
  }

  // Validate steps
  if (typeof summary.totalSteps !== 'number' || summary.totalSteps < 0) {
    summary.totalSteps = 0;
  }

  // Validate calories
  if (typeof summary.caloriesBurned !== 'number' || summary.caloriesBurned < 0) {
    summary.caloriesBurned = 0;
  }

  // Validate heart rate
  if (summary.avgHeartRate !== null && (typeof summary.avgHeartRate !== 'number' || summary.avgHeartRate < 0 || summary.avgHeartRate > 250)) {
    summary.avgHeartRate = null;
  }
  if (summary.maxHeartRate !== null && (typeof summary.maxHeartRate !== 'number' || summary.maxHeartRate < 0 || summary.maxHeartRate > 250)) {
    summary.maxHeartRate = null;
  }

  return { isValid: true, errors };
};

// Calculate split breakdown (e.g., km by km)
const calculateSplitBreakdown = (activity, segmentSize = 1000) => {
  if (!activity.path || activity.path.length < 2) {
    return [];
  }

  const segments = [];
  let currentSegmentStart = 0;
  let currentSegmentDistance = 0;
  let segmentStartIdx = 0;
  let segmentStartTime = null;
  let segmentEndTime = null;
  let segmentElevationGain = 0;
  let segmentElevationLoss = 0;
  let segmentCalories = 0;
  let segmentSteps = 0;
  let segmentHeartRates = [];

  for (let i = 1; i < activity.path.length; i++) {
    const prev = activity.path[i - 1];
    const curr = activity.path[i];

    // Initialize segment start time
    if (segmentStartTime === null) {
      segmentStartTime = new Date(prev.timestamp).getTime();
    }
    segmentEndTime = new Date(curr.timestamp).getTime();

    // Calculate distance
    const R = 6371e3;
    const φ1 = prev.latitude * Math.PI / 180;
    const φ2 = curr.latitude * Math.PI / 180;
    const Δφ = (curr.latitude - prev.latitude) * Math.PI / 180;
    const Δλ = (curr.longitude - prev.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    currentSegmentDistance += distance;

    // Elevation change
    const elevDiff = curr.altitude - prev.altitude;
    if (elevDiff > 0) segmentElevationGain += elevDiff;
    else segmentElevationLoss += Math.abs(elevDiff);

    // Check if we've completed a segment
    if (currentSegmentDistance >= segmentSize || i === activity.path.length - 1) {
      const metricsInSegment = activity.metricsHistory?.filter(m => {
        const mTime = new Date(m.timestamp).getTime();
        const segStartTime = new Date(activity.path[segmentStartIdx].timestamp).getTime();
        const segEndTime = new Date(activity.path[i].timestamp).getTime();
        return mTime >= segStartTime && mTime <= segEndTime;
      }) || [];

      if (metricsInSegment.length > 0) {
        const stepsDiff = metricsInSegment[metricsInSegment.length - 1].steps - (activity.metricsHistory[segmentStartIdx]?.steps || 0);
        segmentSteps = stepsDiff > 0 ? stepsDiff : 0;
        segmentCalories = segmentSteps * 0.05;
        segmentHeartRates = metricsInSegment.filter(m => m.heartRate).map(m => m.heartRate);
      }

      // Calculate time taken for this segment
      const segmentTimeSecs = segmentEndTime && segmentStartTime ? (segmentEndTime - segmentStartTime) / 1000 : 0;
      const segmentTimeMinutes = Math.round(segmentTimeSecs / 60 * 10) / 10; // 1 decimal
      
      // Calculate speed for this segment (km/h)
      const segmentSpeed = segmentTimeSecs > 0 ? (distance / 1000) / (segmentTimeSecs / 3600) : 0;

      segments.push({
        segmentNumber: segments.length + 1,
        distance: Math.round(currentSegmentDistance),
        time: segmentTimeMinutes, // time in minutes
        timeSecs: segmentTimeSecs,
        speed: parseFloat(segmentSpeed.toFixed(2)),
        elevationGain: Math.round(segmentElevationGain),
        elevationLoss: Math.round(segmentElevationLoss),
        steps: segmentSteps,
        calories: Math.round(segmentCalories),
        avgHeartRate: segmentHeartRates.length > 0 ? Math.round(segmentHeartRates.reduce((a, b) => a + b) / segmentHeartRates.length) : null,
      });

      currentSegmentStart += segmentSize;
      currentSegmentDistance = 0;
      segmentStartTime = null;
      segmentEndTime = null;
      segmentElevationGain = 0;
      segmentElevationLoss = 0;
      segmentCalories = 0;
      segmentSteps = 0;
      segmentHeartRates = [];
      segmentStartIdx = i;
    }
  }

  return segments;
};

// Helper to calculate summary from path if missing
const calculateSummaryFromPath = (activity) => {
  if (!activity.path || activity.path.length < 2) return activity.summary;

  let totalDistance = 0;
  let totalElevationGain = 0;
  let totalElevationLoss = 0;
  
  for (let i = 1; i < activity.path.length; i++) {
    const prev = activity.path[i - 1];
    const curr = activity.path[i];

    // Distance
    const R = 6371e3;
    const φ1 = prev.latitude * Math.PI / 180;
    const φ2 = curr.latitude * Math.PI / 180;
    const Δφ = (curr.latitude - prev.latitude) * Math.PI / 180;
    const Δλ = (curr.longitude - prev.longitude) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;

    // Elevation
    const elevDiff = curr.altitude - prev.altitude;
    if (elevDiff > 0) totalElevationGain += elevDiff;
    else totalElevationLoss += Math.abs(elevDiff);
  }

  // Update summary if missing or zero
  if (!activity.summary.totalDistance || activity.summary.totalDistance === 0) {
    activity.summary.totalDistance = Math.round(totalDistance);
  }
  if (!activity.summary.totalElevationGain || activity.summary.totalElevationGain === 0) {
    activity.summary.totalElevationGain = Math.round(totalElevationGain);
  }
  if (!activity.summary.totalElevationLoss || activity.summary.totalElevationLoss === 0) {
    activity.summary.totalElevationLoss = Math.round(totalElevationLoss);
  }
  
  // Calculate average speed if missing (km/h)
  if ((!activity.summary.averageSpeed || activity.summary.averageSpeed === 0) && activity.duration > 0) {
    const hours = activity.duration / 3600;
    activity.summary.averageSpeed = parseFloat((activity.summary.totalDistance / 1000 / hours).toFixed(2));
  }

  return activity.summary;
};

// Generate AI insights using Groq
const generateActivityInsights = async (activity, splits) => {
  try {
    const summary = activity.summary || {};
    const totalKm = summary.totalDistance ? (summary.totalDistance / 1000).toFixed(2) : '0';
    const avgSpeed = (summary.averageSpeed || 0).toFixed(2);
    const maxSpeed = (summary.maxSpeed || 0).toFixed(2);
    const elevationGain = (summary.totalElevationGain || 0).toFixed(1);
    const caloriesBurned = Math.round(summary.caloriesBurned || 0);
    const totalDuration = activity.duration ? Math.round(activity.duration / 60) : 0;

    const splitsText = splits.length > 0 
      ? splits.map((s, i) => `Segment ${i + 1} (${s.distance}m): ${s.speed} km/h, Elev: +${s.elevationGain}m`).join('\n')
      : 'No segment data available';

    const prompt = `You are an expert running and trekking coach. Analyze the following activity data and provide critical feedback.
    
    Context:
    - Distance: ${totalKm} km
    - Duration: ${totalDuration} minutes
    - Avg Speed: ${avgSpeed} km/h
    - Max Speed: ${maxSpeed} km/h
    - Elevation Gain: ${elevationGain} m
    - Calories: ${caloriesBurned} kcal
    - Splits (Speed per km/segment):
    ${splitsText}

    Please provide your response in the following Markdown format:

    ### Observations
    * [Critical observation about pacing, speed, or elevation handling. E.g., "You started too fast in the first km..."]
    * [Another observation]
    * [Another observation]

    ### Recommendations
    * [Specific advice to improve performance based on the data]
    * [Another recommendation]

    ### Encouragement
    [A short, motivating sentence to keep going]

    Make the tone professional yet motivating. Be specific about the split data if relevant (e.g., inconsistent pacing).`;

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      max_tokens: 800,
    });

    return message.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating insights:', error);
    return null;
  }
};

exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Get list of users I follow
    const following = await Follower.find({ 
      follower: userId, 
      status: 'accepted' 
    }).select('following');

    const followingIds = following.map(f => f.following);

    // 2. Get activities for these users
    const activities = await Activity.find({ 
      userId: { $in: followingIds },
      status: 'completed' 
    })
    .sort({ startTime: -1 })
    .limit(50)
    .populate('userId', 'fullName photoUrl username');

    // Validate all activities
    activities.forEach(activity => validateActivityData(activity));

    res.json(activities);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMyActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const activities = await Activity.find({ userId: userId })
      .sort({ startTime: -1 })
      .populate('userId', 'fullName photoUrl username');
      
    activities.forEach(activity => validateActivityData(activity));
    res.json(activities);
  } catch (error) {
    console.error('Error fetching my activities:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id).populate('userId', 'fullName photoUrl username');
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Validate activity data
    const validation = validateActivityData(activity);
    if (!validation.isValid) {
      console.warn('Activity validation warnings:', validation.errors);
    }

    // Calculate summary from path if missing (mathematical fallback)
    calculateSummaryFromPath(activity);

    // Calculate splits breakdown
    const splits = calculateSplitBreakdown(activity, 1000); // 1km segments

    // Add splits to response
    activity.splits = splits;

    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getActivityInsights = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id).populate('userId', 'fullName photoUrl username');
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Calculate summary from path if missing
    calculateSummaryFromPath(activity);

    // Calculate splits breakdown
    const splits = calculateSplitBreakdown(activity, 1000);

    // Generate AI insights
    const insights = await generateActivityInsights(activity, splits);

    res.json({
      insights,
      splits,
      summary: activity.summary
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
};
