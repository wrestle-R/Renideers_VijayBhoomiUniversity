const User = require('../models/User');

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
