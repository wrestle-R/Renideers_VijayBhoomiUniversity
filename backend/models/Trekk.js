const mongoose = require('mongoose');

const TrekkSchema = new mongoose.Schema({
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
  vrImage: { type: String }, 
  latitude: { type: Number },      // <-- Add this
  longitude: { type: Number }, 
}, { timestamps: true });

module.exports = mongoose.model('Trekk', TrekkSchema);