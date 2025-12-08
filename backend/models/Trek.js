const mongoose = require('mongoose');

<<<<<<< HEAD
const LocationPointSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  altitude: { type: Number, default: 0 },
  accuracy: { type: Number },
  timestamp: { type: Date, required: true },
  speed: { type: Number, default: 0 },
  heading: { type: Number },
}, { _id: false });

const MetricsSnapshotSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  steps: { type: Number, default: 0 },
  elevation: { type: Number, default: 0 },
  heartRate: { type: Number },
  caloriesBurned: { type: Number, default: 0 },
  speed: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
}, { _id: false });

const TrekSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  firebaseUid: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'My Trek',
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'abandoned'],
    default: 'active',
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // in seconds
    default: 0,
  },
  // Path tracking
  path: [LocationPointSchema],
  
  // Metrics collected during trek
  metricsHistory: [MetricsSnapshotSchema],
  
  // Summary statistics (computed at end)
  summary: {
    totalDistance: { type: Number, default: 0 }, // meters
    totalSteps: { type: Number, default: 0 },
    averageSpeed: { type: Number, default: 0 }, // m/s
    maxSpeed: { type: Number, default: 0 }, // m/s
    totalElevationGain: { type: Number, default: 0 }, // meters
    totalElevationLoss: { type: Number, default: 0 }, // meters
    minElevation: { type: Number },
    maxElevation: { type: Number },
    avgHeartRate: { type: Number },
    maxHeartRate: { type: Number },
    caloriesBurned: { type: Number, default: 0 },
    avgPace: { type: Number }, // min/km
  },
  
  // Metadata
  weather: {
    temperature: Number,
    conditions: String,
    humidity: Number,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard', 'extreme'],
  },
  notes: {
    type: String,
  },
  tags: [String],
  photos: [{
    url: String,
    timestamp: Date,
    location: {
      latitude: Number,
      longitude: Number,
    },
  }],
}, {
  timestamps: true,
});

// Indexes for queries
TrekSchema.index({ userId: 1, startTime: -1 });
TrekSchema.index({ firebaseUid: 1, status: 1 });
TrekSchema.index({ createdAt: -1 });

// Methods
TrekSchema.methods.addLocationPoint = function(point) {
  this.path.push(point);
};

TrekSchema.methods.addMetricsSnapshot = function(metrics) {
  this.metricsHistory.push(metrics);
};

TrekSchema.methods.calculateSummary = function() {
  if (this.path.length < 2) return;
  
  // Calculate total distance
  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  
  for (let i = 1; i < this.path.length; i++) {
    const prev = this.path[i - 1];
    const curr = this.path[i];
    
    // Haversine distance
    const R = 6371e3; // Earth radius in meters
    const φ1 = prev.latitude * Math.PI / 180;
    const φ2 = curr.latitude * Math.PI / 180;
    const Δφ = (curr.latitude - prev.latitude) * Math.PI / 180;
    const Δλ = (curr.longitude - prev.longitude) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
    
    // Elevation changes
    const elevDiff = curr.altitude - prev.altitude;
    if (elevDiff > 0) elevationGain += elevDiff;
    else elevationLoss += Math.abs(elevDiff);
    
    minElevation = Math.min(minElevation, curr.altitude);
    maxElevation = Math.max(maxElevation, curr.altitude);
  }
  
  // Calculate speeds
  const speeds = this.path.filter(p => p.speed).map(p => p.speed);
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  
  // Calculate steps (from last metrics)
  const lastMetrics = this.metricsHistory[this.metricsHistory.length - 1];
  const totalSteps = lastMetrics ? lastMetrics.steps : 0;
  
  // Calculate heart rate stats
  const heartRates = this.metricsHistory.filter(m => m.heartRate).map(m => m.heartRate);
  const avgHeartRate = heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : null;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : null;
  
  // Calculate calories (rough estimate: 0.05 kcal per step)
  const caloriesBurned = totalSteps * 0.05;
  
  // Calculate pace (min/km)
  const durationHours = this.duration / 3600;
  const distanceKm = totalDistance / 1000;
  const avgPace = distanceKm > 0 ? (durationHours * 60) / distanceKm : 0;
  
  this.summary = {
    totalDistance,
    totalSteps,
    averageSpeed: avgSpeed,
    maxSpeed,
    totalElevationGain: elevationGain,
    totalElevationLoss: elevationLoss,
    minElevation: minElevation === Infinity ? 0 : minElevation,
    maxElevation: maxElevation === -Infinity ? 0 : maxElevation,
    avgHeartRate,
    maxHeartRate,
    caloriesBurned,
    avgPace,
  };
};

TrekSchema.methods.complete = function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  this.calculateSummary();
};
=======
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
>>>>>>> 5f53eb70bf686682e9b7f26eb6c6d17354ef8e8f

module.exports = mongoose.model('Trek', TrekSchema);
