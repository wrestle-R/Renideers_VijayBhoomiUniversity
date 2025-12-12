const Activity = require('../models/activity');
const Follower = require('../models/Follower');
const User = require('../models/User');

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
    // We can also include the user's own activities if desired, but usually feed is friends.
    // Let's stick to friends for now as requested "all my friends".
    const activities = await Activity.find({ 
      userId: { $in: followingIds },
      status: 'completed' 
    })
    .sort({ startTime: -1 })
    .limit(50)
    .populate('userId', 'fullName photoUrl username');

    res.json(activities);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
