import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTrek } from '@/context/TrekContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

export default function MapScreen() {
  const router = useRouter();
  const {
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
  } = useTrek();

  const [trekTitle, setTrekTitle] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const primaryColor = useThemeColor({}, 'primary');
  const primaryForeground = useThemeColor({}, 'primaryForeground');
  const cardColor = useThemeColor({}, 'card');
  const foregroundColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');
  const destructiveColor = useThemeColor({}, 'destructive');

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatSpeed = (metersPerSecond: number) => {
    const kmh = metersPerSecond * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  };

  const handleStart = async () => {
    await startTrek(trekTitle || undefined);
  };

  const handleStop = async () => {
    Alert.alert(
      'End Trek',
      'Are you sure you want to end this trek?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trek',
          style: 'destructive',
          onPress: async () => {
            const completedTrek = await stopTrek();
            if (completedTrek) {
              setShowSummary(true);
            }
          },
        },
      ]
    );
  };

  const mapRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  return (
    <ThemedView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton
          followsUserLocation={isTracking}
        >
          {path.length > 1 && (
            <Polyline
              coordinates={path.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
              strokeColor={primaryColor as string}
              strokeWidth={4}
            />
          )}
          {path.length > 0 && (
            <Marker
              coordinate={{ latitude: path[0].latitude, longitude: path[0].longitude }}
              title="Start"
              pinColor="green"
            />
          )}
          {isTracking && currentLocation && (
            <Marker
              coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
              title="Current Location"
            />
          )}
        </MapView>
      </View>

      {/* Metrics Panel */}
      {isTracking && (
        <View style={[styles.metricsPanel, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsScroll}>
            <View style={styles.metricCard}>
              <IconSymbol name="clock.fill" size={20} color={primaryColor as string} />
              <Text style={[styles.metricValue, { color: foregroundColor as string }]}>{formatDuration(metrics.duration)}</Text>
              <Text style={[styles.metricLabel, { color: foregroundColor as string }]}>Duration</Text>
            </View>
            
            <View style={styles.metricCard}>
              <IconSymbol name="location.fill" size={20} color={primaryColor as string} />
              <Text style={[styles.metricValue, { color: foregroundColor as string }]}>{formatDistance(metrics.distance)}</Text>
              <Text style={[styles.metricLabel, { color: foregroundColor as string }]}>Distance</Text>
            </View>

            <View style={styles.metricCard}>
              <IconSymbol name="speedometer" size={20} color={primaryColor as string} />
              <Text style={[styles.metricValue, { color: foregroundColor as string }]}>{formatSpeed(metrics.avgSpeed)}</Text>
              <Text style={[styles.metricLabel, { color: foregroundColor as string }]}>Speed</Text>
            </View>

            <View style={styles.metricCard}>
              <IconSymbol name="figure.walk" size={20} color={primaryColor as string} />
              <Text style={[styles.metricValue, { color: foregroundColor as string }]}>{metrics.steps}</Text>
              <Text style={[styles.metricLabel, { color: foregroundColor as string }]}>Steps</Text>
            </View>

            <View style={styles.metricCard}>
              <IconSymbol name="mountain.2.fill" size={20} color={primaryColor as string} />
              <Text style={[styles.metricValue, { color: foregroundColor as string }]}>{metrics.elevation.toFixed(0)}m</Text>
              <Text style={[styles.metricLabel, { color: foregroundColor as string }]}>Elevation</Text>
            </View>

            <View style={styles.metricCard}>
              <IconSymbol name="flame.fill" size={20} color={primaryColor as string} />
              <Text style={[styles.metricValue, { color: foregroundColor as string }]}>{metrics.calories.toFixed(0)}</Text>
              <Text style={[styles.metricLabel, { color: foregroundColor as string }]}>Calories</Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Control Buttons */}
      <View style={[styles.controlPanel, { backgroundColor: cardColor as string }]}>
        {!isTracking ? (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: primaryColor as string }]}
            onPress={handleStart}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={primaryForeground as string} />
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={28} color={primaryForeground as string} />
                <Text style={[styles.buttonText, { color: primaryForeground as string }]}>Start Trek</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: mutedColor as string }]}
              onPress={isPaused ? resumeTrek : pauseTrek}
              disabled={loading}
            >
              <IconSymbol name={isPaused ? 'play.fill' : 'pause.fill'} size={24} color={foregroundColor as string} />
              <Text style={[styles.controlButtonText, { color: foregroundColor as string }]}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton, { backgroundColor: destructiveColor as string }]}
              onPress={handleStop}
              disabled={loading}
            >
              <IconSymbol name="stop.fill" size={24} color="white" />
              <Text style={[styles.controlButtonText, { color: 'white' }]}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  metricsPanel: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricsScroll: {
    gap: 12,
  },
  metricCard: {
    alignItems: 'center',
    minWidth: 90,
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  activeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  stopButton: {
    flex: 1,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
