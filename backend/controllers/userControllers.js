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
    const profile = await Profile.findOne({ user_id: userId });
    if (!profile) {
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
      Object.assign(profile, updateData);
      await profile.save();
    } else {
      // Create
      profile = new Profile({
        user_id: userId,
        ...updateData
      });
      await profile.save();
    }
    res.json(profile);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
