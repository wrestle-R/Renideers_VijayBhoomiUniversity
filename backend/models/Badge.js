const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g. "first_trek"
  name: { type: String, required: true },               // e.g. "First Trek"
  description: { type: String, required: true },         // e.g. "Awarded for completing your first trek"
  icon: { type: String, required: true },                // e.g. "🥾"
  criteria: { type: String, required: true },            // e.g. "Complete 1 trek"
});

module.exports = mongoose.model('Badge', BadgeSchema);