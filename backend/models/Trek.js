const mongoose = require('mongoose');

const TrekSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  altitude: { type: Number, required: true },
  duration: { type: String, required: true },
  difficulty: { type: String, required: true },
  season: { type: String, required: true },
  description: { type: String, required: true },
  itinerary: [{ type: String, required: true }],
  highlights: [{ type: String, required: true }],
  images: [{ type: String, required: true }],
  inDepthDescription: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Trek', TrekSchema);
