import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import axios from 'axios';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

type LocationPoint = {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number | null;
  timestamp: string;
  speed: number | null;
  heading: number | null;
};

type Trek = {
  _id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  duration: number;
  path: LocationPoint[];
  summary: {
    totalDistance: number;
    elevationGain: number;
    elevationLoss: number;
    maxElevation: number;
    minElevation: number;
    avgSpeed: number;
    maxSpeed: number;
    totalSteps: number;
    avgHeartRate: number;
    maxHeartRate: number;
    totalCalories: number;
    avgPace: number;
  };
  notes?: string;
  difficulty?: string;
  weather?: any;
};

export default function TrekDetailScreen() {
  const { id } = useLocalSearchParams();
  const [trek, setTrek] = useState<Trek | null>(null);
  const [loading, setLoading] = useState(true);

  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const foregroundColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted');
  const mutedForegroundColor = useThemeColor({}, 'mutedForeground');
  const borderColor = useThemeColor({}, 'border');

  const apiUrl = Constants.expoConfig?.extra?.API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchTrekDetail();
  }, [id]);

  const fetchTrekDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/treks/${id}`);
      // Support both `trek` and `activity` response shapes
      setTrek(response.data.trek || response.data.activity || null);
    } catch (error) {
      console.error('Error fetching trek:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatSpeed = (metersPerSecond: number) => {
    const kmh = metersPerSecond * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  };

  const formatPace = (metersPerSecond: number) => {
    if (metersPerSecond === 0) return '--';
    const minPerKm = 1000 / (metersPerSecond * 60);
    const mins = Math.floor(minPerKm);
    const secs = Math.floor((minPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor as string} />
        <ThemedText style={styles.loadingText}>Loading trek details...</ThemedText>
      </ThemedView>
    );
  }

  if (!trek) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Trek not found</ThemedText>
      </ThemedView>
    );
  }

  const mapRegion = trek.path.length > 0 ? {
    latitude: trek.path[Math.floor(trek.path.length / 2)].latitude,
    longitude: trek.path[Math.floor(trek.path.length / 2)].longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  } : undefined;

  return (
    <>
      <Stack.Screen options={{ title: trek.title }} />
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Route Map */}
          {trek.path.length > 0 && mapRegion && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                scrollEnabled={true}
                zoomEnabled={true}
              >
                <Polyline
                  coordinates={trek.path.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
                  strokeColor={primaryColor as string}
                  strokeWidth={4}
                />
                <Marker
                  coordinate={{ latitude: trek.path[0].latitude, longitude: trek.path[0].longitude }}
                  title="Start"
                  pinColor="green"
                />
                <Marker
                  coordinate={{ 
                    latitude: trek.path[trek.path.length - 1].latitude, 
                    longitude: trek.path[trek.path.length - 1].longitude 
                  }}
                  title="Finish"
                  pinColor="red"
                />
              </MapView>
            </View>
          )}

          {/* Trek Info */}
          <View style={[styles.infoCard, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
            <ThemedText style={styles.title}>{trek.title}</ThemedText>
            <View style={styles.dateRow}>
              <IconSymbol name="calendar" size={16} color={mutedForegroundColor as string} />
              <Text style={[styles.dateText, { color: mutedForegroundColor as string }]}>
                {formatDate(trek.startTime)}
              </Text>
            </View>
            {trek.notes && (
              <Text style={[styles.notes, { color: foregroundColor as string }]}>{trek.notes}</Text>
            )}
          </View>

          {/* Main Stats */}
          <View style={[styles.statsCard, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
            <ThemedText style={styles.sectionTitle}>Overview</ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <IconSymbol name="figure.walk" size={32} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {formatDistance(trek.summary?.totalDistance || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Distance</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name="clock" size={32} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {formatDuration(trek.duration || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Duration</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name="speedometer" size={32} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {formatSpeed(trek.summary?.avgSpeed || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Avg Speed</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name="flame" size={32} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {formatPace(trek.summary?.avgPace || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Avg Pace</Text>
              </View>
            </View>
          </View>

          {/* Elevation Stats */}
          <View style={[styles.statsCard, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
            <ThemedText style={styles.sectionTitle}>Elevation</ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <IconSymbol name="arrow.up" size={24} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {(trek.summary?.elevationGain || 0).toFixed(0)}m
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Gain</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name="arrow.down" size={24} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {(trek.summary?.elevationLoss || 0).toFixed(0)}m
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Loss</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name="mountain.2" size={24} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {(trek.summary?.maxElevation || 0).toFixed(0)}m
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Max</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name="minus" size={24} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {(trek.summary?.minElevation || 0).toFixed(0)}m
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Min</Text>
              </View>
            </View>
          </View>

          {/* Activity Stats */}
          <View style={[styles.statsCard, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
            <ThemedText style={styles.sectionTitle}>Activity</ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <IconSymbol name="figure.walk" size={24} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {trek.summary?.totalSteps || 0}
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Steps</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name="flame.fill" size={24} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {(trek.summary?.totalCalories || 0).toFixed(0)}
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Calories</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name="bolt.fill" size={24} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {formatSpeed(trek.summary?.maxSpeed || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Max Speed</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name="location.fill" size={24} color={primaryColor as string} />
                <Text style={[styles.statValue, { color: foregroundColor as string }]}>
                  {trek.path?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: mutedForegroundColor as string }]}>Points</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  mapContainer: {
    width: '100%',
    height: 300,
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
  },
  notes: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: (width - 80) / 4,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
  },
});
