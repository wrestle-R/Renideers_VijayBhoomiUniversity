import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';

type LocationPoint = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
};

type TrekMetrics = {
  distance: number; // meters
  duration: number; // seconds
  steps: number;
  avgSpeed: number; // m/s
  elevation: number; // meters
  elevationGain: number; // cumulative elevation gain
  elevationLoss: number; // cumulative elevation loss
  calories: number;
};

type Trek = {
  _id: string;
  title: string;
  status: 'active' | 'paused' | 'completed';
  startTime: string;
  endTime?: string;
  duration: number;
  summary?: any;
  path?: LocationPoint[];
};

type TrekContextValue = {
  isTracking: boolean;
  isPaused: boolean;
  currentTrek: Trek | null;
  metrics: TrekMetrics;
  path: LocationPoint[];
  startTrek: (title?: string) => Promise<void>;
  pauseTrek: () => Promise<void>;
  resumeTrek: () => Promise<void>;
  stopTrek: (notes?: string) => Promise<Trek | null>;
  currentLocation: LocationPoint | null;
  loading: boolean;
  error: string | null;
};

const TrekContext = createContext<TrekContextValue | undefined>(undefined);

export const useTrek = () => {
  const ctx = useContext(TrekContext);
  if (!ctx) throw new Error('useTrek must be used within TrekProvider');
  return ctx;
};

export const TrekProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTrek, setCurrentTrek] = useState<Trek | null>(null);
  const [path, setPath] = useState<LocationPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [metrics, setMetrics] = useState<TrekMetrics>({
    distance: 0,
    duration: 0,
    steps: 0,
    avgSpeed: 0,
    elevation: 0,
    elevationGain: 0,
    elevationLoss: 0,
    calories: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for subscriptions and tracking state
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pedometerSubscription = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocationRef = useRef<LocationPoint | null>(null);
  const lastSyncedLocationRef = useRef<LocationPoint | null>(null);
  const initialStepsRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  
  // Altitude smoothing
  const altitudeHistoryRef = useRef<number[]>([]);
  const lastSmoothedAltitudeRef = useRef<number>(0);

  const apiUrl = Constants.expoConfig?.extra?.API_URL || 'http://localhost:8000';

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        setError('Location permission is required for trek tracking');
        console.error('❌ Location permission denied');
        return false;
      }

      const pedometerAvailable = await Pedometer.isAvailableAsync();
      if (!pedometerAvailable) {
        console.warn('⚠️ Pedometer not available on this device');
      }

      return true;
    } catch (err: any) {
      console.error('❌ Permission error:', err);
      setError(err.message);
      return false;
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Smooth altitude values using moving average
  const smoothAltitude = (newAltitude: number): number => {
    if (altitudeHistoryRef.current.length === 0) {
      altitudeHistoryRef.current.push(newAltitude);
      lastSmoothedAltitudeRef.current = newAltitude;
      return newAltitude;
    }

    // Keep last 5 altitude readings
    altitudeHistoryRef.current.push(newAltitude);
    if (altitudeHistoryRef.current.length > 5) {
      altitudeHistoryRef.current.shift();
    }

    // Calculate moving average
    const sum = altitudeHistoryRef.current.reduce((acc, val) => acc + val, 0);
    const smoothed = sum / altitudeHistoryRef.current.length;
    lastSmoothedAltitudeRef.current = smoothed;
    return smoothed;
  };

  // Calculate elevation gain/loss
  const calculateElevationChange = (prevAltitude: number, newAltitude: number) => {
    const diff = newAltitude - prevAltitude;
    if (Math.abs(diff) < 1) return { gain: 0, loss: 0 }; // Ignore noise < 1m
    
    if (diff > 0) {
      return { gain: diff, loss: 0 };
    } else {
      return { gain: 0, loss: Math.abs(diff) };
    }
  };

  const startTrek = async (title?: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check permissions
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setLoading(false);
        return;
      }

      // Get initial location with high accuracy
      const initialLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      // Create trek on backend
      const response = await axios.post(`${apiUrl}/api/treks/start`, {
        firebaseUid: user.firebase_id,
        title: title || `Trek ${new Date().toLocaleDateString()}`,
        initialLocation: {
          latitude: initialLoc.coords.latitude,
          longitude: initialLoc.coords.longitude,
          altitude: initialLoc.coords.altitude || 0,
          accuracy: initialLoc.coords.accuracy || 0,
          speed: initialLoc.coords.speed || 0,
          heading: initialLoc.coords.heading || 0,
        },
      });

      const trek = response.data.activity;
      if (!trek || !trek._id) {
        throw new Error('Failed to create trek: Invalid response from server');
      }

      setCurrentTrek(trek);
      setIsTracking(true);
      setIsPaused(false);
      isPausedRef.current = false;
      startTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;

      // Initialize first location point
      const initialPoint: LocationPoint = {
        latitude: initialLoc.coords.latitude,
        longitude: initialLoc.coords.longitude,
        altitude: initialLoc.coords.altitude || 0,
        accuracy: initialLoc.coords.accuracy || 0,
        speed: initialLoc.coords.speed || 0,
        heading: initialLoc.coords.heading || 0,
        timestamp: Date.now(),
      };

      setPath([initialPoint]);
      setCurrentLocation(initialPoint);
      lastLocationRef.current = initialPoint;
      lastSyncedLocationRef.current = initialPoint;

      // Initialize altitude tracking
      if (initialPoint.altitude) {
        altitudeHistoryRef.current = [initialPoint.altitude];
        lastSmoothedAltitudeRef.current = initialPoint.altitude;
        setMetrics(prev => ({ ...prev, elevation: initialPoint.altitude || 0 }));
      }

      // ===== START LOCATION TRACKING =====
      console.log('📍 Starting location tracking...');
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 5, // Update when moved at least 5 meters
          mayShowUserSettingsDialog: true,
        },
        async (location) => {
          const timestamp = Date.now();
          const newPoint: LocationPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || 0,
            accuracy: location.coords.accuracy || 0,
            speed: location.coords.speed || 0,
            heading: location.coords.heading || 0,
            timestamp,
          };

          // Always update current location for map visualization
          setCurrentLocation(newPoint);

          // Skip processing if paused
          if (isPausedRef.current) {
            console.log('⏸️ Location update skipped (paused)');
            return;
          }

          // Validate accuracy - skip if accuracy > 50m
          if (newPoint.accuracy && newPoint.accuracy > 50) {
            console.warn('⚠️ Poor GPS accuracy:', newPoint.accuracy, 'm - skipping');
            return;
          }

          // Calculate distance from last location
          if (lastLocationRef.current) {
            const dist = calculateDistance(
              lastLocationRef.current.latitude,
              lastLocationRef.current.longitude,
              newPoint.latitude,
              newPoint.longitude
            );

            // Only process if movement > 3 meters (avoid GPS drift)
            if (dist >= 3) {
              // Add to path
              setPath((prev) => [...prev, newPoint]);

              // Calculate elevation changes
              let elevGain = 0;
              let elevLoss = 0;
              if (newPoint.altitude && lastLocationRef.current.altitude) {
                const smoothedAltitude = smoothAltitude(newPoint.altitude);
                const prevSmoothed = lastSmoothedAltitudeRef.current;
                const elevChange = calculateElevationChange(prevSmoothed, smoothedAltitude);
                elevGain = elevChange.gain;
                elevLoss = elevChange.loss;
              }

              // Update metrics
              setMetrics((prev) => ({
                ...prev,
                distance: prev.distance + dist,
                elevation: newPoint.altitude || prev.elevation,
                elevationGain: prev.elevationGain + elevGain,
                elevationLoss: prev.elevationLoss + elevLoss,
              }));

              // Send location to backend
              try {
                await axios.post(`${apiUrl}/api/treks/${trek._id}/location`, {
                  latitude: newPoint.latitude,
                  longitude: newPoint.longitude,
                  altitude: newPoint.altitude || 0,
                  accuracy: newPoint.accuracy || 0,
                  timestamp: new Date(timestamp).toISOString(),
                  speed: newPoint.speed || 0,
                  heading: newPoint.heading || 0,
                });
                lastSyncedLocationRef.current = newPoint;
              } catch (err) {
                console.error('❌ Failed to sync location:', err);
              }

              lastLocationRef.current = newPoint;
            } else {
              console.log('📍 Movement too small:', dist.toFixed(2), 'm - skipping');
            }
          } else {
            // First point after initial
            setPath((prev) => [...prev, newPoint]);
            lastLocationRef.current = newPoint;
          }
        }
      );

      // ===== START STEP COUNTING =====
      console.log('👟 Starting step counter...');
      const pedometerAvailable = await Pedometer.isAvailableAsync();
      if (pedometerAvailable) {
        // Get baseline step count from today
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        try {
          const pastSteps = await Pedometer.getStepCountAsync(start, end);
          initialStepsRef.current = pastSteps.steps;
          console.log('📊 Initial step count:', pastSteps.steps);

          // Watch for real-time step updates
          pedometerSubscription.current = Pedometer.watchStepCount((result) => {
            if (isPausedRef.current) return;

            const trekSteps = Math.max(0, result.steps - initialStepsRef.current);
            const calories = Math.round(trekSteps * 0.05); // ~0.05 kcal per step

            setMetrics((prev) => ({
              ...prev,
              steps: trekSteps,
              calories,
            }));
          });
        } catch (err) {
          console.error('❌ Pedometer error:', err);
        }
      } else {
        console.warn('⚠️ Pedometer not available on this device');
      }

      // ===== START DURATION TIMER =====
      console.log('⏱️ Starting duration timer...');
      durationIntervalRef.current = setInterval(() => {
        if (isPausedRef.current) return;

        const elapsed = Math.floor((Date.now() - startTimeRef.current - totalPausedTimeRef.current) / 1000);
        setMetrics((prev) => {
          const avgSpeed = elapsed > 0 ? prev.distance / elapsed : 0;
          return {
            ...prev,
            duration: elapsed,
            avgSpeed,
          };
        });
      }, 1000);

      // ===== START METRICS SYNC (every 10 seconds) =====
      console.log('📤 Starting metrics sync...');
      metricsIntervalRef.current = setInterval(async () => {
        if (isPausedRef.current) return;

        const currentMetrics = metrics;
        try {
          await axios.post(`${apiUrl}/api/treks/${trek._id}/metrics`, {
            timestamp: new Date().toISOString(),
            steps: currentMetrics.steps,
            elevation: currentMetrics.elevation,
            heartRate: 0,
            caloriesBurned: currentMetrics.calories,
            speed: currentMetrics.avgSpeed,
            distance: currentMetrics.distance,
          });
          console.log('📤 Metrics synced');
        } catch (err) {
          console.error('❌ Failed to sync metrics:', err);
        }
      }, 10000);

      console.log('✅ Trek started successfully:', trek._id);
    } catch (err: any) {
      console.error('❌ Error starting trek:', err);
      setError(err.message || 'Failed to start trek');
      
      // Cleanup on error
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      if (pedometerSubscription.current) {
        pedometerSubscription.current.remove();
        pedometerSubscription.current = null;
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const pauseTrek = async () => {
    if (!currentTrek) return;

    try {
      setIsPaused(true);
      isPausedRef.current = true;
      pauseTimeRef.current = Date.now();

      await axios.post(`${apiUrl}/api/treks/${currentTrek._id}/pause`);
      console.log('⏸️ Trek paused');
    } catch (err: any) {
      console.error('❌ Error pausing trek:', err);
      setError(err.message);
    }
  };

  const resumeTrek = async () => {
    if (!currentTrek) return;

    try {
      setIsPaused(false);
      isPausedRef.current = false;
      
      // Calculate paused duration
      if (pauseTimeRef.current > 0) {
        totalPausedTimeRef.current += Date.now() - pauseTimeRef.current;
        pauseTimeRef.current = 0;
      }

      await axios.post(`${apiUrl}/api/treks/${currentTrek._id}/resume`);
      console.log('▶️ Trek resumed');
    } catch (err: any) {
      console.error('❌ Error resuming trek:', err);
      setError(err.message);
    }
  };

  const stopTrek = async (notes?: string): Promise<Trek | null> => {
    if (!currentTrek) return null;

    try {
      setLoading(true);
      console.log('🛑 Stopping trek...');

      // Stop all subscriptions and intervals
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        console.log('✅ Location tracking stopped');
      }
      
      if (pedometerSubscription.current) {
        pedometerSubscription.current.remove();
        pedometerSubscription.current = null;
        console.log('✅ Step counter stopped');
      }
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
        console.log('✅ Duration timer stopped');
      }
      
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
        console.log('✅ Metrics sync stopped');
      }

      // Complete trek on backend
      const response = await axios.post(`${apiUrl}/api/treks/${currentTrek._id}/complete`, {
        notes,
      });

      const completedTrek = response.data.activity;

      // Reset all state
      setIsTracking(false);
      setIsPaused(false);
      isPausedRef.current = false;
      setCurrentTrek(null);
      setPath([]);
      setCurrentLocation(null);
      setMetrics({
        distance: 0,
        duration: 0,
        steps: 0,
        avgSpeed: 0,
        elevation: 0,
        elevationGain: 0,
        elevationLoss: 0,
        calories: 0,
      });

      // Reset refs
      lastLocationRef.current = null;
      lastSyncedLocationRef.current = null;
      initialStepsRef.current = 0;
      altitudeHistoryRef.current = [];
      lastSmoothedAltitudeRef.current = 0;
      startTimeRef.current = 0;
      pauseTimeRef.current = 0;
      totalPausedTimeRef.current = 0;

      console.log('✅ Trek completed:', completedTrek?._id);
      return completedTrek;
    } catch (err: any) {
      console.error('❌ Error stopping trek:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (pedometerSubscription.current) {
        pedometerSubscription.current.remove();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  return (
    <TrekContext.Provider
      value={{
        isTracking,
        isPaused,
        currentTrek,
        metrics,
        path,
        startTrek,
        pauseTrek,
        resumeTrek,
        stopTrek,
        currentLocation,
        loading,
        error,
      }}
    >
      {children}
    </TrekContext.Provider>
  );
};
