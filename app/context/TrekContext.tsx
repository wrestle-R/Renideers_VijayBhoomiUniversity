import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    calories: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pedometerSubscription = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocationRef = useRef<LocationPoint | null>(null);
  const initialStepsRef = useRef<number>(0);
  const currentStepsRef = useRef<number>(0);

  const apiUrl = Constants.expoConfig?.extra?.API_URL || 'http://localhost:8000';

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        setError('Location permission denied');
      }
      
      const pedometerAvailable = await Pedometer.isAvailableAsync();
      if (!pedometerAvailable) {
        console.warn('Pedometer not available on this device');
      }
    })();
  }, []);

  // Calculate distance between two points (Haversine formula)
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

    return R * c;
  };

  const startTrek = async (title?: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get initial location
      const initialLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Create trek on backend
      const response = await axios.post(`${apiUrl}/api/treks/start`, {
        firebaseUid: user.firebase_id,
        title: title || `Trek ${new Date().toLocaleDateString()}`,
        initialLocation: {
          latitude: initialLoc.coords.latitude,
          longitude: initialLoc.coords.longitude,
          altitude: initialLoc.coords.altitude,
          accuracy: initialLoc.coords.accuracy,
          speed: initialLoc.coords.speed,
          heading: initialLoc.coords.heading,
        },
      });

      const trek = response.data.trek || response.data.activity;
      setCurrentTrek(trek);
      setIsTracking(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;

      const initialPoint: LocationPoint = {
        latitude: initialLoc.coords.latitude,
        longitude: initialLoc.coords.longitude,
        altitude: initialLoc.coords.altitude,
        accuracy: initialLoc.coords.accuracy,
        speed: initialLoc.coords.speed,
        heading: initialLoc.coords.heading,
        timestamp: Date.now(),
      };
      setPath([initialPoint]);
      setCurrentLocation(initialPoint);
      lastLocationRef.current = initialPoint;

      // Start location tracking with high accuracy
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000, // Update every 3 seconds
          distanceInterval: 5, // Update every 5 meters
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          const newPoint: LocationPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: Date.now(),
          };

          setCurrentLocation(newPoint);
          
          // Always update path for route visualization
          setPath((prev) => [...prev, newPoint]);

          // Only calculate metrics and send to backend when not paused
          if (!isPaused) {
            // Send to backend
            axios.post(`${apiUrl}/api/treks/${trek._id}/location`, {
              latitude: newPoint.latitude,
              longitude: newPoint.longitude,
              altitude: newPoint.altitude,
              accuracy: newPoint.accuracy,
              timestamp: new Date(newPoint.timestamp),
              speed: newPoint.speed,
              heading: newPoint.heading,
            }).catch(console.error);

            // Calculate distance from last point
            if (lastLocationRef.current) {
              const dist = calculateDistance(
                lastLocationRef.current.latitude,
                lastLocationRef.current.longitude,
                newPoint.latitude,
                newPoint.longitude
              );
              
              setMetrics((prev) => ({
                ...prev,
                distance: prev.distance + dist,
                elevation: newPoint.altitude || prev.elevation,
              }));
            }
            
            // Update last location reference
            lastLocationRef.current = newPoint;
          }
        }
      );

      // Start pedometer
      const pedometerAvailable = await Pedometer.isAvailableAsync();
      if (pedometerAvailable) {
        // Get current step count at trek start
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        
        const pastSteps = await Pedometer.getStepCountAsync(start, end);
        initialStepsRef.current = pastSteps.steps;
        currentStepsRef.current = pastSteps.steps;

        // Watch for step updates
        pedometerSubscription.current = Pedometer.watchStepCount((result) => {
          if (!isPaused) {
            const totalSteps = result.steps;
            const trekSteps = Math.max(0, totalSteps - initialStepsRef.current);
            
            setMetrics((prev) => ({
              ...prev,
              steps: trekSteps,
              calories: Math.round(trekSteps * 0.05), // ~0.05 kcal per step
            }));
            
            currentStepsRef.current = totalSteps;
          }
        });
      } else {
        console.warn('⚠️ Pedometer not available on this device');
      }

      // Update duration timer and send metrics every 10 seconds
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current - totalPausedTimeRef.current) / 1000);
          setMetrics((prev) => {
            const avgSpeed = elapsed > 0 ? prev.distance / elapsed : 0;
            const newMetrics = {
              ...prev,
              duration: elapsed,
              avgSpeed,
            };
            
            // Send metrics snapshot to backend every 10 seconds
                  if (elapsed % 10 === 0 && currentTrek) {
                    axios.post(`${apiUrl}/api/treks/${trek._id}/metrics`, {
                metrics: {
                  timestamp: new Date(),
                  steps: newMetrics.steps,
                  elevation: newMetrics.elevation,
                  heartRate: 0, // TODO: Add heart rate sensor
                  calories: newMetrics.calories,
                  speed: avgSpeed,
                  distance: newMetrics.distance,
                },
              }).catch(console.error);
            }
            
            return newMetrics;
          });
        }
      }, 1000);

      console.log('✅ Trek started:', trek._id);
    } catch (err: any) {
      console.error('❌ Error starting trek:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pauseTrek = async () => {
    if (!currentTrek) return;

    try {
      setIsPaused(true);
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
      if (pauseTimeRef.current > 0) {
        totalPausedTimeRef.current += Date.now() - pauseTimeRef.current;
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

      // Stop subscriptions
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      if (pedometerSubscription.current) {
        pedometerSubscription.current.remove();
        pedometerSubscription.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Complete trek on backend
      const response = await axios.post(`${apiUrl}/api/treks/${currentTrek._id}/complete`, {
        notes,
      });

      const completedTrek = response.data.trek || response.data.activity;

      // Reset state
      setIsTracking(false);
      setIsPaused(false);
      setCurrentTrek(null);
      setPath([]);
      setMetrics({
        distance: 0,
        duration: 0,
        steps: 0,
        avgSpeed: 0,
        elevation: 0,
        calories: 0,
      });

      console.log('✅ Trek completed:', completedTrek._id);
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
