/**
 * SOS Helper - Fall Detection & Emergency SMS
 * Handles fall detection algorithm and SMS sending
 */

import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as SMS from 'expo-sms';
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

// Fall detection thresholds - LOWERED FOR TESTING
const FALL_ACCELERATION_THRESHOLD = 2.5; // Very low for testing (m/s²) - normal is ~25
const GYRO_ROTATION_THRESHOLD = 3; // Rapid rotation (rad/s) - indicates tumbling
const POST_FALL_MOTION_THRESHOLD = 1.5; // Near-zero movement after fall
const POST_FALL_CHECK_DURATION = 800; // 0.8 seconds to check for immobility
const FALL_COOLDOWN_MS = 10000; // 10 seconds cooldown for testing (normal: 30s)
const MIN_DETECTION_SAMPLES = 3; // Need at least 3 samples before detecting

// Sensor update intervals
const ACCELEROMETER_UPDATE_INTERVAL = 100; // 10 Hz
const GYROSCOPE_UPDATE_INTERVAL = 100; // 10 Hz

export type FallDetectionState = {
  isActive: boolean;
  lastFallDetectedAt: number | null;
  impactDetected: boolean;
  impactTimestamp: number | null;
};

export type SOSMessage = {
  userName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  triggerType: 'fall' | 'manual';
};

/**
 * Calculate magnitude of acceleration vector
 */
export const calculateMagnitude = (x: number, y: number, z: number): number => {
  return Math.sqrt(x * x + y * y + z * z);
};

/**
 * Format SOS message for SMS
 */
export const formatSOSMessage = (data: SOSMessage): string => {
  const { userName, latitude, longitude, timestamp, triggerType } = data;
  const trigger = triggerType === 'fall' ? 'Possible fall detected' : 'Manual SOS triggered';
  
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  
  return `🚨 SOS ALERT! 🚨
${trigger}

Name: ${userName}
Location: ${mapsLink}
Time: ${timestamp}

Please check on this person immediately.`;
};

/**
 * Send SMS to emergency contacts via backend API (automatic, no user interaction)
 */
export const sendSOSMessage = async (
  emergencyContacts: Array<{ name?: string; phone?: string }>,
  messageData: SOSMessage,
  apiUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📡 Sending SOS via backend API...');

    // Filter valid phone numbers
    const validContacts = emergencyContacts
      .filter(contact => contact.phone && contact.phone.trim().length > 0);

    if (validContacts.length === 0) {
      console.error('❌ No valid emergency contacts');
      return { success: false, error: 'No emergency contacts configured' };
    }

    // Call backend emergency endpoint
    const response = await fetch(`${apiUrl}/api/emergency/send-sos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emergencyContacts: validContacts,
        userName: messageData.userName,
        latitude: messageData.latitude,
        longitude: messageData.longitude,
        timestamp: messageData.timestamp,
        triggerType: messageData.triggerType,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ SOS sent successfully via backend:', result.message);
      return { success: true };
    } else {
      console.error('❌ Backend SOS failed:', result.error);
      return { success: false, error: result.error || 'Failed to send SOS' };
    }
  } catch (error: any) {
    console.error('❌ Error calling backend SOS API:', error);
    return { success: false, error: error.message || 'Network error' };
  }
};

/**
 * Get current location for SOS
 */
export const getCurrentLocationForSOS = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('❌ Error getting location for SOS:', error);
    return null;
  }
};

/**
 * Fall Detection Logic
 * Returns true if a fall is detected
 */
export class FallDetector {
  private state: FallDetectionState;
  private accelerometerSubscription: any = null;
  private gyroscopeSubscription: any = null;
  private postFallCheckTimeout: ReturnType<typeof setTimeout> | null = null;
  private accelerationHistory: number[] = [];
  private gyroHistory: number[] = [];
  private readonly HISTORY_SIZE = 5;
  private onFallDetected: (() => void) | null = null;
  private sampleCount: number = 0;

  constructor() {
    this.state = {
      isActive: false,
      lastFallDetectedAt: null,
      impactDetected: false,
      impactTimestamp: null,
    };
  }

  /**
   * Start fall detection
   */
  start(onFallCallback: () => void) {
    if (this.state.isActive) {
      console.warn('⚠️ Fall detection already active');
      return;
    }

    console.log('🔍 Starting fall detection with accelerometer + gyroscope...');
    this.state.isActive = true;
    this.onFallDetected = onFallCallback;
    this.sampleCount = 0;

    // Set sensor update intervals
    Accelerometer.setUpdateInterval(ACCELEROMETER_UPDATE_INTERVAL);
    Gyroscope.setUpdateInterval(GYROSCOPE_UPDATE_INTERVAL);

    // Subscribe to accelerometer
    this.accelerometerSubscription = Accelerometer.addListener((data) => {
      if (!this.state.isActive) return;

      const { x, y, z } = data;
      const magnitude = calculateMagnitude(x, y, z);
      
      this.sampleCount++;

      // Smooth with rolling average
      this.accelerationHistory.push(magnitude);
      if (this.accelerationHistory.length > this.HISTORY_SIZE) {
        this.accelerationHistory.shift();
      }
      
      // Need minimum samples before detecting
      if (this.sampleCount < MIN_DETECTION_SAMPLES) {
        console.log(`📊 Collecting samples... (${this.sampleCount}/${MIN_DETECTION_SAMPLES})`);
        return;
      }

      const avgMagnitude = this.accelerationHistory.reduce((a, b) => a + b, 0) / this.accelerationHistory.length;

      // Continuous logging for debugging (every 10 samples)
      if (this.sampleCount % 10 === 0) {
        console.log(`📱 Accel: ${avgMagnitude.toFixed(3)} m/s² (threshold: ${FALL_ACCELERATION_THRESHOLD})`);
      }

      // Phase 1: Detect sudden spike (impact) OR high acceleration
      if (!this.state.impactDetected && avgMagnitude > FALL_ACCELERATION_THRESHOLD) {
        console.log('💥 IMPACT DETECTED! Magnitude:', avgMagnitude.toFixed(3), 'm/s²');
        this.state.impactDetected = true;
        this.state.impactTimestamp = Date.now();

        // Start checking for immobility after impact
        this.postFallCheckTimeout = setTimeout(() => {
          this.checkPostFallImmobility();
        }, POST_FALL_CHECK_DURATION);
      }

      // Phase 2: Check for near-zero motion after impact
      if (this.state.impactDetected) {
        const timeSinceImpact = Date.now() - (this.state.impactTimestamp || 0);
        
        if (avgMagnitude < POST_FALL_MOTION_THRESHOLD && timeSinceImpact >= POST_FALL_CHECK_DURATION) {
          // Fall confirmed: impact + immobility
          console.log('🛑 Immobility after impact - FALL CONFIRMED');
          this.triggerFallDetection();
        } else if (timeSinceImpact > POST_FALL_CHECK_DURATION * 2) {
          // Reset if too much time passes
          console.log('⚠️ Impact detected but no immobility - false positive');
          this.resetImpactDetection();
        }
      }
    });

    // Subscribe to gyroscope for rotation detection
    this.gyroscopeSubscription = Gyroscope.addListener((data) => {
      if (!this.state.isActive) return;
      if (this.sampleCount < MIN_DETECTION_SAMPLES) return;

      const { x, y, z } = data;
      const rotationMagnitude = calculateMagnitude(x, y, z);

      // Smooth gyro data
      this.gyroHistory.push(rotationMagnitude);
      if (this.gyroHistory.length > this.HISTORY_SIZE) {
        this.gyroHistory.shift();
      }

      const avgRotation = this.gyroHistory.reduce((a, b) => a + b, 0) / this.gyroHistory.length;

      // Log gyro data periodically
      if (this.sampleCount % 10 === 0) {
        console.log(`🔄 Gyro: ${avgRotation.toFixed(3)} rad/s (threshold: ${GYRO_ROTATION_THRESHOLD})`);
      }

      // Detect rapid rotation (tumbling/falling)
      if (!this.state.impactDetected && avgRotation > GYRO_ROTATION_THRESHOLD) {
        console.log('🌀 RAPID ROTATION DETECTED! Gyro:', avgRotation.toFixed(3), 'rad/s');
        this.state.impactDetected = true;
        this.state.impactTimestamp = Date.now();

        // Check for immobility after rotation
        this.postFallCheckTimeout = setTimeout(() => {
          this.checkPostFallImmobility();
        }, POST_FALL_CHECK_DURATION);
      }
    });

    console.log('✅ Fall detection started (sensors active)');
    console.log(`📊 Thresholds: Accel=${FALL_ACCELERATION_THRESHOLD}, Gyro=${GYRO_ROTATION_THRESHOLD}, Motion=${POST_FALL_MOTION_THRESHOLD}`);
  }

  /**
   * Check for immobility after impact
   */
  private checkPostFallImmobility() {
    if (!this.state.impactDetected) return;

    const avgMagnitude = this.accelerationHistory.reduce((a, b) => a + b, 0) / this.accelerationHistory.length;
    
    if (avgMagnitude < POST_FALL_MOTION_THRESHOLD) {
      console.log('🛑 Immobility confirmed after impact');
      this.triggerFallDetection();
    } else {
      console.log('⚠️ Movement detected after impact - not a fall');
      this.resetImpactDetection();
    }
  }

  /**
   * Trigger fall detection (with cooldown)
   */
  private triggerFallDetection() {
    const now = Date.now();
    
    // Check cooldown to prevent repeated detections
    if (this.state.lastFallDetectedAt && (now - this.state.lastFallDetectedAt) < FALL_COOLDOWN_MS) {
      console.log('⏳ Fall detection in cooldown period');
      this.resetImpactDetection();
      return;
    }

    console.log('🚨 FALL DETECTED! Triggering SOS timer...');
    this.state.lastFallDetectedAt = now;
    this.resetImpactDetection();

    // Call the callback
    if (this.onFallDetected) {
      this.onFallDetected();
    }
  }

  /**
   * Reset impact detection state
   */
  private resetImpactDetection() {
    this.state.impactDetected = false;
    this.state.impactTimestamp = null;
    if (this.postFallCheckTimeout) {
      clearTimeout(this.postFallCheckTimeout);
      this.postFallCheckTimeout = null;
    }
  }

  /**
   * Stop fall detection
   */
  stop() {
    if (!this.state.isActive) return;

    console.log('🛑 Stopping fall detection...');
    this.state.isActive = false;

    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }

    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }

    if (this.postFallCheckTimeout) {
      clearTimeout(this.postFallCheckTimeout);
      this.postFallCheckTimeout = null;
    }

    this.resetImpactDetection();
    this.accelerationHistory = [];
    this.gyroHistory = [];
    this.onFallDetected = null;
    this.sampleCount = 0;

    console.log('✅ Fall detection stopped');
  }

  /**
   * Check if fall detection is active
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Get current state
   */
  getState(): FallDetectionState {
    return { ...this.state };
  }
}
