import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import axios from 'axios';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

type TrekSummary = {
  _id: string;
  title: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration: number;
  summary: {
    totalDistance: number;
    totalSteps: number;
    totalElevationGain: number;
    caloriesBurned: number;
  };
};

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [treks, setTreks] = useState<TrekSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const foregroundColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted');
  const mutedForeground = useThemeColor({}, 'mutedForeground');
  const borderColor = useThemeColor({}, 'border');

  const apiUrl = Constants.expoConfig?.extra?.API_URL || 'http://localhost:8000';

  const fetchTreks = async () => {
    if (!user) return;

    try {
      const response = await axios.get(`${apiUrl}/api/treks/user/${user.firebase_id}?status=completed`);
      // Support both `treks` and `activities` response shapes
      setTreks(response.data.treks || response.data.activities || []);
    } catch (error) {
      console.error('Error fetching treks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTreks();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTreks();
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTrekCard = ({ item }: { item: TrekSummary }) => (
    <TouchableOpacity
      style={[styles.trekCard, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}
      onPress={() => {
        router.push(`/trek/${item._id}`);
      }}
    >
      <View style={styles.trekHeader}>
        <View style={styles.trekTitleContainer}>
          <ThemedText type="defaultSemiBold" style={styles.trekTitle}>
            {item.title}
          </ThemedText>
          <Text style={[styles.trekDate, { color: mutedForeground as string }]}>
            {formatDate(item.startTime)}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={mutedForeground as string} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <IconSymbol name="house.fill" size={16} color={primaryColor as string} />
          <Text style={[styles.statValue, { color: foregroundColor as string }]}>
            {formatDistance(item.summary?.totalDistance || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: mutedForeground as string }]}>Distance</Text>
        </View>

        <View style={styles.statItem}>
          <IconSymbol name="house.fill" size={16} color={primaryColor as string} />
          <Text style={[styles.statValue, { color: foregroundColor as string }]}>
            {formatDuration(item.duration || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: mutedForeground as string }]}>Duration</Text>
        </View>

        <View style={styles.statItem}>
          <IconSymbol name="house.fill" size={16} color={primaryColor as string} />
          <Text style={[styles.statValue, { color: foregroundColor as string }]}>
            {item.summary?.totalSteps || 0}
          </Text>
          <Text style={[styles.statLabel, { color: mutedForeground as string }]}>Steps</Text>
        </View>

        <View style={styles.statItem}>
          <IconSymbol name="house.fill" size={16} color={primaryColor as string} />
          <Text style={[styles.statValue, { color: foregroundColor as string }]}>
            {item.summary?.totalElevationGain?.toFixed(0) || 0}m
          </Text>
          <Text style={[styles.statLabel, { color: mutedForeground as string }]}>Elevation</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={primaryColor as string} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Trek History</ThemedText>
        <ThemedText style={{ color: mutedForeground as string }}>
          {treks.length} {treks.length === 1 ? 'trek' : 'treks'} completed
        </ThemedText>
      </View>

      {treks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="map.fill" size={64} color={mutedForeground as string} />
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            No treks yet
          </ThemedText>
          <Text style={[styles.emptyText, { color: mutedForeground as string }]}>
            Start tracking your first trek from the Map tab
          </Text>
        </View>
      ) : (
        <FlatList
          data={treks}
          renderItem={renderTrekCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor as string}
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    gap: 4,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  trekCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  trekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trekTitleContainer: {
    flex: 1,
    gap: 4,
  },
  trekTitle: {
    fontSize: 18,
  },
  trekDate: {
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 70,
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
