const mongoose = require('mongoose');

const PreferredTrailSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    trailId: { type: String, trim: true }, // optional external id
    location: { type: String, trim: true },
}, { _id: false });

const ProfileSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // one profile per user
    },

    username: {
        type: String,
        trim: true,
        unique: true,
        sparse: true // Allows null/undefined values to not conflict, though we aim to populate it
    },

    // core profile fields
    goals: [{ type: String, trim: true }], // e.g. ["Complete 100km this year", "Try a new trail"]
    motivations: [{ type: String, trim: true }], // array of motivations
    bio: { type: String, trim: true, default: '' },

    // optional user details
    location: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },

    experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'beginner',
    },
    preferredActivities: [{ type: String, trim: true }], // e.g. ['day-hike','multi-day','trail-running']
    preferredTrails: [PreferredTrailSchema],
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],

    // emergency contact information for safety / rescue
    emergencyContact: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        altPhone: { type: String, trim: true },
        relationship: { type: String, trim: true },
    },

    // rewards & verification metadata
    rewards: {
        tokensEarned: { type: Number, default: 0 },
        lastRewardAt: { type: Date },
    },

    // privacy / visibility settings
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'private',
    },

    // generic social links
    socialLinks: {
        website: { type: String, trim: true },
        instagram: { type: String, trim: true },
        twitter: { type: String, trim: true },
    },
}, {
    timestamps: true,
});

module.exports = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);