// Backwards-compat shim: `Trek.js` now re-exports the Activity model.
// This file exists to avoid breaking require('../models/Trek') calls.

module.exports = require('./activity');
