import { Image } from 'expo-image';
import { Platform, StyleSheet, TouchableOpacity, ScrollView, View, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;

interface UserStats {
  totalActivities: number;
  totalDistance: number;
  totalDuration: number;
  totalCalories: number;
  totalElevation: number;
  avgSpeed: number;
  recentActivities: any[];
  weeklyStats: { day: string; distance: number; duration: number }[];
  monthlyProgress: { totalKm: number; goal: number };
}

interface UserProfile {
  fullName: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  fitnessLevel?: string;
  preferredDifficulty?: string;
  badges?: any[];
  stats?: any;
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const primary = useThemeColor({}, 'primary');
  const primaryForeground = useThemeColor({}, 'primaryForeground');
  const background = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchDashboardData = async () => {
    if (!user?.mongo_uid) return;

    try {
      setLoading(true);
      
      // Fetch user profile
      const profileRes = await axios.get(`${API_URL}/api/users/profile/${user.mongo_uid}`);
      setUserProfile(profileRes.data);

      // Fetch user activities
      const activitiesRes = await axios.get(`${API_URL}/api/activities/my-activities`, {
        headers: { 'x-user-id': user.mongo_uid }
      });

      const activities = activitiesRes.data || [];
      
      // Calculate stats
      const stats = calculateStats(activities);
      setUserStats(stats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (activities: any[]): UserStats => {
    const totalActivities = activities.length;
    let totalDistance = 0;
    let totalDuration = 0;
    let totalCalories = 0;
    let totalElevation = 0;
    let totalSpeed = 0;

    // Weekly stats (last 7 days)
    const weeklyStats = new Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        distance: 0,
        duration: 0
      };
    });

    activities.forEach(activity => {
      const summary = activity.summary || {};
      totalDistance += summary.totalDistance || 0;
      totalDuration += activity.duration || 0;
      totalCalories += summary.caloriesBurned || 0;
      totalElevation += summary.totalElevationGain || 0;
      totalSpeed += summary.averageSpeed || 0;

      // Calculate weekly stats
      const activityDate = new Date(activity.startTime);
      const daysDiff = Math.floor((Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        const dayIndex = 6 - daysDiff;
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyStats[dayIndex].distance += (summary.totalDistance || 0) / 1000;
          weeklyStats[dayIndex].duration += (activity.duration || 0) / 60;
        }
      }
    });

    const avgSpeed = totalActivities > 0 ? totalSpeed / totalActivities : 0;
    const recentActivities = activities.slice(0, 5);

    return {
      totalActivities,
      totalDistance: totalDistance / 1000, // Convert to km
      totalDuration: totalDuration / 3600, // Convert to hours
      totalCalories,
      totalElevation,
      avgSpeed,
      recentActivities,
      weeklyStats,
      monthlyProgress: {
        totalKm: totalDistance / 1000,
        goal: 100 // 100km monthly goal
      }
    };
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: background }]}>
        <ActivityIndicator size="large" color={primary} />
        <ThemedText style={styles.loadingText}>Loading Dashboard...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
      }>
      {/* Hero Section */}
      <ThemedView style={[styles.heroSection, { backgroundColor: primary }]}>
        <View style={styles.heroContent}>
          <View style={styles.userInfo}>
            {userProfile?.photoUrl ? (
              <Image source={{ uri: userProfile.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: primaryForeground }]}>
                <ThemedText style={[styles.avatarText, { color: primary }]}>
                  {userProfile?.fullName?.charAt(0) || 'U'}
                </ThemedText>
              </View>
            )}
            <View style={styles.userDetails}>
              <ThemedText style={[styles.userName, { color: primaryForeground }]}>
                Welcome, {userProfile?.fullName || 'Trekker'}!
              </ThemedText>
              <ThemedText style={[styles.userSubtext, { color: primaryForeground, opacity: 0.9 }]}>
                {userProfile?.fitnessLevel || 'Explorer'} • {userStats?.totalActivities || 0} Activities
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={24} color={primaryForeground} />
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Quick Stats Grid */}
      <ThemedView style={styles.statsGrid}>
        <ThemedView style={[styles.statCard, { backgroundColor: card, borderColor: border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${primary}20` }]}>
            <Ionicons name="map-outline" size={24} color={primary} />
          </View>
          <ThemedText style={[styles.statValue, { color: text }]}>{userStats?.totalDistance.toFixed(1) || '0'}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: muted }]}>TOTAL KM</ThemedText>
        </ThemedView>

        <ThemedView style={[styles.statCard, { backgroundColor: card, borderColor: border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${primary}20` }]}>
            <Ionicons name="time-outline" size={24} color={primary} />
          </View>
          <ThemedText style={[styles.statValue, { color: text }]}>{userStats?.totalDuration.toFixed(1) || '0'}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: muted }]}>HOURS</ThemedText>
        </ThemedView>

        <ThemedView style={[styles.statCard, { backgroundColor: card, borderColor: border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${primary}20` }]}>
            <Ionicons name="flame-outline" size={24} color={primary} />
          </View>
          <ThemedText style={[styles.statValue, { color: text }]}>{Math.round(userStats?.totalCalories || 0)}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: muted }]}>CALORIES</ThemedText>
        </ThemedView>

        <ThemedView style={[styles.statCard, { backgroundColor: card, borderColor: border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${primary}20` }]}>
            <Ionicons name="trending-up-outline" size={24} color={primary} />
          </View>
          <ThemedText style={[styles.statValue, { color: text }]}>{Math.round(userStats?.totalElevation || 0)}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: muted }]}>ELEVATION</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Monthly Progress */}
      {userStats && (
        <ThemedView style={[styles.chartSection, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>Monthly Goal Progress</ThemedText>
          <View style={styles.progressContainer}>
            <View style={styles.progressCircleContainer}>
              <View style={styles.canvasContainer}>
                <View style={[styles.progressBackground, { borderColor: border }]} />
                <View
                  style={[
                    styles.progressFill,
                    {
                      borderColor: primary,
                      transform: [
                        {
                          rotate: `${Math.min((userStats.monthlyProgress.totalKm / userStats.monthlyProgress.goal) * 360, 360) - 90}deg`,
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <View style={styles.progressCenterText}>
                <ThemedText style={[styles.progressPercentage, { color: text }]}> 
                  {Math.round((userStats.monthlyProgress.totalKm / userStats.monthlyProgress.goal) * 100)}%
                </ThemedText>
                <ThemedText style={[styles.progressLabel, { color: muted }]}>Complete</ThemedText>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <ThemedText style={[styles.progressText, { color: text }]}> 
                {userStats.monthlyProgress.totalKm.toFixed(1)} / {userStats.monthlyProgress.goal} km
              </ThemedText>
              <ThemedText style={[styles.progressSubtext, { color: muted }]}>Monthly Goal</ThemedText>
            </View>
          </View>
        </ThemedView>
      )}

      {/* Weekly Activity Chart */}
      {userStats && userStats.weeklyStats.length > 0 && (
        <ThemedView style={[styles.chartSection, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>This Week's Activity</ThemedText>
          <View style={styles.barChartContainer}>
            {userStats.weeklyStats.map((stat, index) => {
              const maxDistance = Math.max(...userStats.weeklyStats.map(s => s.distance), 1);
              const heightPercent = (stat.distance / maxDistance) * 100;
              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(heightPercent, 5)}%`,
                          backgroundColor: primary,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.barLabel, { color: muted }]}>{stat.day}</ThemedText>
                </View>
              );
            })}
          </View>
          <ThemedText style={[styles.chartHint, { color: muted }]}>Distance in kilometers</ThemedText>
        </ThemedView>
      )}

      {/* Recent Activities */}
      {userStats && userStats.recentActivities.length > 0 && (
        <ThemedView style={[styles.section, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: text }]}>Recent Activities</ThemedText>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <ThemedText style={[styles.seeAll, { color: primary }]}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          {userStats.recentActivities.slice(0, 3).map((activity, index) => (
            <TouchableOpacity
              key={activity._id || index}
              style={[styles.activityCard, { borderColor: border }]}
              onPress={() => router.push(`/trek/${activity._id}`)}>
              <View style={[styles.activityIcon, { backgroundColor: `${primary}15` }]}>
                <Ionicons 
                  name={activity.tags?.includes('hiking') ? 'trail-sign' : 'walk'} 
                  size={24} 
                  color={primary} 
                />
              </View>
              <View style={styles.activityDetails}>
                <ThemedText style={[styles.activityTitle, { color: text }]}>{activity.title}</ThemedText>
                <ThemedText style={[styles.activityMeta, { color: muted }]}> 
                  {((activity.summary?.totalDistance || 0) / 1000).toFixed(2)} km • 
                  {Math.round((activity.duration || 0) / 60)} min
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={muted} />
            </TouchableOpacity>
          ))}
        </ThemedView>
      )}

      {/* Performance Metrics */}
      {userStats && (
        <ThemedView style={[styles.section, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>Performance Overview</ThemedText>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricValue, { color: primary }]}>
                {userStats.avgSpeed.toFixed(1)}
              </ThemedText>
              <ThemedText style={[styles.metricLabel, { color: muted }]}>Avg Speed (km/h)</ThemedText>
            </View>
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricValue, { color: primary }]}>
                {(userStats.totalDistance / (userStats.totalActivities || 1)).toFixed(1)}
              </ThemedText>
              <ThemedText style={[styles.metricLabel, { color: muted }]}>Avg Distance (km)</ThemedText>
            </View>
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricValue, { color: primary }]}>
                {((userStats.totalDuration * 60) / (userStats.totalActivities || 1)).toFixed(0)}
              </ThemedText>
              <ThemedText style={[styles.metricLabel, { color: muted }]}>Avg Duration (min)</ThemedText>
            </View>
          </View>
        </ThemedView>
      )}

      {/* Bio Section */}
      {userProfile?.bio && (
        <ThemedView style={[styles.section, { backgroundColor: card, borderColor: border }]}>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>About</ThemedText>
          <ThemedText style={[styles.bioText, { color: muted }]}>{userProfile.bio}</ThemedText>
        </ThemedView>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  heroSection: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userSubtext: {
    fontSize: 14,
  },
  logoutIcon: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 44) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  chartSection: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  progressCircleContainer: {
    position: 'relative',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasContainer: {
    width: 160,
    height: 160,
    position: 'relative',
  },
  progressBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    position: 'absolute',
    top: 10,
    left: 10,
  },
  progressFill: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    position: 'absolute',
    top: 10,
    left: 10,
  },
  progressCenterText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  progressInfo: {
    flex: 1,
    marginLeft: 24,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 13,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    width: '80%',
    height: 160,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  chartHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  metricItem: {
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
