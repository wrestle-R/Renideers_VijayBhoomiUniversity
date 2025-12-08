const Trekk = require('../models/Trek');

// Get all treks
exports.getAllTreks = async (req, res) => {
  try {
    const treks = await Trekk.find();
    res.json(treks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch treks' });
  }
};

// Get single trek by ID
exports.getTrekById = async (req, res) => {
  try {
    const trek = await Trekk.findById(req.params.id);
    if (!trek) return res.status(404).json({ error: 'Trek not found' });
    res.json(trek);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trek' });
  }
};