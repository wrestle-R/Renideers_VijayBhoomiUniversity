const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/UserProfiles');

exports.auth = async (req, res) => {
  const { firebaseUid, email, fullName, photoUrl } = req.body;

  console.log('Auth Request Body:', req.body);

  if (!firebaseUid || !email || !fullName) {
    console.error('Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let user = await User.findOne({ firebaseUid });

    if (user) {
      console.log('User found:', user);
      return res.status(200).json(user);
    }

    console.log('Creating new user...');
    user = new User({
      firebaseUid,
      email,
      fullName,
      photoUrl,
    });

    await user.save();

    // Auto-generate profile
    try {
        const emailPrefix = email.split('@')[0];
        let username = `${emailPrefix}${Math.floor(Math.random() * 11)}`;
        
        // Ensure uniqueness
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
            const existing = await Profile.findOne({ username });
            if (!existing) {
                isUnique = true;
            } else {
                // Try a larger range if collision
                username = `${emailPrefix}${Math.floor(Math.random() * 1000)}`;
                attempts++;
            }
        }
        
        if (!isUnique) {
             // Fallback to timestamp
             username = `${emailPrefix}${Date.now()}`;
        }

        const profile = new Profile({
            user_id: user._id,
            username: username,
            visibility: 'private'
        });
        await profile.save();
        console.log('Profile auto-generated:', profile);
    } catch (profileErr) {
        console.error('Error auto-generating profile:', profileErr);
    }

    console.log('User created:', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if userId is a valid ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(userId);
    
    let query;
    if (isObjectId) {
      query = { user_id: userId };
    } else {
      query = { username: userId };
    }

    const profile = await Profile.findOne(query)
    .populate('user_id', 'fullName email photoUrl')
    .populate('badges');
    
    if (!profile) {
      // If we searched by username and failed, maybe it was an ID that looked like a username? Unlikely if we check isValid.
      // But if we searched by ID and failed, maybe try username? (Unlikely if isValid is strict)
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;
    
    let profile = await Profile.findOne({ user_id: userId });

    if (profile) {
      // Update
      // If username is being updated, ensure uniqueness (handled by DB unique index, but good to catch)
      Object.assign(profile, updateData);
      try {
        await profile.save();
      } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.username) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        throw err;
      }
    } else {
      // Create
      // Generate default username if not provided
      if (!updateData.username) {
        const user = await User.findById(userId);
        if (user) {
            const emailPrefix = user.email.split('@')[0];
            const randomNum = Math.floor(Math.random() * 11); // 0 to 10
            let newUsername = `${emailPrefix}${randomNum}`;
            
            // Simple check for collision could be good, but for now let's trust the random or fail
            // To be safer, we could loop, but let's stick to the requirement
            updateData.username = newUsername;
        }
      }

      profile = new Profile({
        user_id: userId,
        ...updateData
      });
      
      try {
        await profile.save();
      } catch (err) {
         if (err.code === 11000 && err.keyPattern && err.keyPattern.username) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        throw err;
      }
    }
    res.json(profile);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get username from profile
    const profile = await Profile.findOne({ user_id: userId });
    const username = profile?.username || null;

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      username: username
    });
  } catch (error) {
    console.error('Get User By ID Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
