const Follower = require('../models/Follower');
const User = require('../models/User');
const UserProfile = require('../models/UserProfiles');

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.userId; // Assuming auth middleware adds user info

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if already following or requested
    const existingFollow = await Follower.findOne({
      follower: currentUserId,
      following: targetUserId
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following or request pending" });
    }

    // Check target user's profile privacy
    const targetProfile = await UserProfile.findOne({ user_id: targetUserId });
    
    // Default to private if no profile found, or check visibility
    const isPrivate = targetProfile ? targetProfile.visibility === 'private' : true;
    const status = isPrivate ? 'pending' : 'accepted';

    const newFollow = new Follower({
      follower: currentUserId,
      following: targetUserId,
      status
    });

    await newFollow.save();

    res.status(201).json({ 
      message: isPrivate ? "Follow request sent" : "You are now following this user",
      status 
    });

  } catch (error) {
    console.error("Follow Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Unfollow or Cancel Request
exports.unfollowUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.userId;

    await Follower.findOneAndDelete({
      follower: currentUserId,
      following: targetUserId
    });

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Accept Follow Request
exports.acceptRequest = async (req, res) => {
  try {
    const { followerId } = req.body;
    const currentUserId = req.user.userId;

    const request = await Follower.findOne({
      follower: followerId,
      following: currentUserId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = 'accepted';
    await request.save();

    res.json({ message: "Follow request accepted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Reject Follow Request / Remove Follower
exports.removeFollower = async (req, res) => {
  try {
    const { followerId } = req.body;
    const currentUserId = req.user.userId;

    await Follower.findOneAndDelete({
      follower: followerId,
      following: currentUserId
    });

    res.json({ message: "Follower removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get My Followers
exports.getFollowers = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const followers = await Follower.find({
      following: currentUserId,
      status: 'accepted'
    }).populate('follower', 'fullName email photoUrl');

    const followersWithUsername = await Promise.all(followers.map(async (f) => {
        const user = f.follower;
        // Handle case where user might be null if deleted
        if (!user) return null;
        
        const profile = await UserProfile.findOne({ user_id: user._id }).select('username');
        return {
            ...user.toObject(),
            username: profile ? profile.username : null
        };
    }));

    res.json(followersWithUsername.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Who I Am Following
exports.getFollowing = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const following = await Follower.find({
      follower: currentUserId,
      status: 'accepted'
    }).populate('following', 'fullName email photoUrl');

    const followingWithUsername = await Promise.all(following.map(async (f) => {
        const user = f.following;
        if (!user) return null;

        const profile = await UserProfile.findOne({ user_id: user._id }).select('username');
        return {
            ...user.toObject(),
            username: profile ? profile.username : null
        };
    }));

    res.json(followingWithUsername.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Pending Requests (for me to accept)
exports.getPendingRequests = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const requests = await Follower.find({
      following: currentUserId,
      status: 'pending'
    }).populate('follower', 'fullName email photoUrl');

    const requestsWithUsername = await Promise.all(requests.map(async (r) => {
        const user = r.follower;
        if (!user) return null;

        const profile = await UserProfile.findOne({ user_id: user._id }).select('username');
        return {
            ...user.toObject(),
            username: profile ? profile.username : null
        };
    }));

    res.json(requestsWithUsername.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Sent Requests (requests I sent that are pending)
exports.getSentRequests = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const sentRequests = await Follower.find({
      follower: currentUserId,
      status: 'pending'
    }).populate('following', 'fullName email photoUrl');

    const requestsWithUsername = await Promise.all(sentRequests.map(async (r) => {
        const user = r.following;
        if (!user) return null;

        const profile = await UserProfile.findOne({ user_id: user._id }).select('username');
        return {
            ...user.toObject(),
            username: profile ? profile.username : null
        };
    }));

    res.json(requestsWithUsername.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Search Users to Follow
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.userId;

    if (!query) return res.json([]);

    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: currentUserId } // Exclude self
    }).select('fullName email photoUrl');

    // Add follow status and username to each user
    const usersWithStatus = await Promise.all(users.map(async (user) => {
      const follow = await Follower.findOne({
        follower: currentUserId,
        following: user._id
      });
      
      const profile = await UserProfile.findOne({ user_id: user._id }).select('username');

      return {
        ...user.toObject(),
        username: profile ? profile.username : null,
        followStatus: follow ? follow.status : 'none'
      };
    }));

    res.json(usersWithStatus);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Stats
exports.getStats = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const followersCount = await Follower.countDocuments({
      following: currentUserId,
      status: 'accepted'
    });

    const followingCount = await Follower.countDocuments({
      follower: currentUserId,
      status: 'accepted'
    });

    res.json({ followersCount, followingCount });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
