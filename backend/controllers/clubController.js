const Club = require('../models/Club');
const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// Create a new club
exports.createClub = async (req, res) => {
  try {
    const { name, description, motivation, selectedImage } = req.body;
    let creatorId = req.headers['x-user-id']; // Get user ID from headers
    let photoUrl = selectedImage;

    if (req.file) {
      photoUrl = req.file.path;
    }

    if (!photoUrl) {
        return res.status(400).json({ message: 'Club image is required' });
    }

    console.log('Create club request - All headers:', Object.keys(req.headers));
    console.log('x-user-id header:', creatorId);
    console.log('Request body:', req.body);

    if (!creatorId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Check if club name already exists
    const existingClub = await Club.findOne({ name });
    if (existingClub) {
      return res.status(400).json({ message: 'Club name already exists' });
    }

    const newClub = new Club({
      name,
      description,
      motivation,
      photoUrl,
      creator: new mongoose.Types.ObjectId(creatorId),
      members: [new mongoose.Types.ObjectId(creatorId)], // Creator is automatically a member
    });

    await newClub.save();
    const populatedClub = await Club.findById(newClub._id)
      .populate('creator', 'fullName photoUrl')
      .populate('members', 'fullName photoUrl');
    res.status(201).json(populatedClub);
  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Get all clubs
exports.getAllClubs = async (req, res) => {
  try {
    const clubs = await Club.find().populate('creator', 'fullName photoUrl').populate('members', 'fullName photoUrl');
    res.status(200).json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single club by ID
exports.getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id).populate('creator', 'fullName photoUrl').populate('members', 'fullName photoUrl');
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.status(200).json(club);
  } catch (error) {
    console.error('Error fetching club:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Join a club
exports.joinClub = async (req, res) => {
  try {
    const clubId = req.params.id;
    let userId = req.headers['x-user-id'];

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    userId = new mongoose.Types.ObjectId(userId);

    const club = await Club.findById(clubId)
      .populate('creator', 'fullName photoUrl')
      .populate('members', 'fullName photoUrl');

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is already a member
    const isMember = club.members.some(member => member._id.equals(userId));
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    club.members.push(userId);
    await club.save();

    const updatedClub = await Club.findById(clubId)
      .populate('creator', 'fullName photoUrl')
      .populate('members', 'fullName photoUrl');

    res.status(200).json({ message: 'Joined club successfully', club: updatedClub });
  } catch (error) {
    console.error('Error joining club:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave a club
exports.leaveClub = async (req, res) => {
  try {
    const clubId = req.params.id;
    let userId = req.headers['x-user-id'];

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    userId = new mongoose.Types.ObjectId(userId);

    const club = await Club.findById(clubId)
      .populate('creator', 'fullName photoUrl')
      .populate('members', 'fullName photoUrl');

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is a member
    const isMember = club.members.some(member => member._id.equals(userId));
    if (!isMember) {
      return res.status(400).json({ message: 'User is not a member' });
    }

    club.members = club.members.filter(member => !member._id.equals(userId));
    await club.save();

    const updatedClub = await Club.findById(clubId)
      .populate('creator', 'fullName photoUrl')
      .populate('members', 'fullName photoUrl');

    res.status(200).json({ message: 'Left club successfully', club: updatedClub });
  } catch (error) {
    console.error('Error leaving club:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get club messages
exports.getClubMessages = async (req, res) => {
  try {
    const clubId = req.params.id;
    const messages = await Message.find({ club: clubId })
      .populate('sender', 'fullName photoUrl')
      .sort({ createdAt: 1 }); // Oldest first
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
