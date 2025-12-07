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

    const profile = await Profile.findOne(query).populate('user_id', 'fullName email photoUrl');
    
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
