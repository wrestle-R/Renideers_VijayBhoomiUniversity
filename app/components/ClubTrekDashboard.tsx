import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface MemberData {
  userId: string;
  name: string;
  email: string;
  classification: 'LEADER' | 'ON_PACE' | 'AHEAD' | 'LAGGING' | 'TIRED';
  distanceFromLeader: number;
  distanceFromCentroid: number;
  avgSpeed: number;
  distance: number;
}

interface ClubAlert {
  type: string;
  memberName?: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

interface Suggestion {
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

interface ClubTrekAnalysis {
  isActive: boolean;
  groupMetrics: {
    totalMembers: number;
    avgSpeed: number;
    speedStdDev: number;
  };
  summary: {
    onPace: number;
    ahead: number;
    lagging: number;
    tired: number;
  };
  members: MemberData[];
  alerts: ClubAlert[];
  suggestions: Suggestion[];
  timestamp: string;
}

export default function ClubTrekDashboard({ clubId }: { clubId: string }) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<ClubTrekAnalysis | null>(null);
  const [activeInfo, setActiveInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      console.log('🔍 Dashboard: Fetching data for club:', clubId);
      console.log('📱 User ID:', user?.mongo_uid);

      // 1) Quick check if there's an active club trek
      let activeTrekData = null;
      try {
        console.log('📡 Calling GET /api/clubs/' + clubId + '/active-trek');
        const activeResp = await axios.get(`${API_URL}/api/clubs/${clubId}/active-trek`);
        activeTrekData = activeResp.data;
        setActiveInfo(activeTrekData);
        console.log('✅ Active trek response:', JSON.stringify(activeTrekData, null, 2));
      } catch (err: any) {
        console.warn('⚠️ Could not fetch active-trek info:', err.message);
      }

      // 2) Fetch full analysis (may return alerts/metrics)
      console.log('📡 Calling POST /api/clubs/' + clubId + '/analyze');
      const response = await axios.post(
        `${API_URL}/api/clubs/${clubId}/analyze`,
        {},
        { headers: { 'x-user-id': user?.mongo_uid } }
      );

      console.log('📊 Analyze response:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.success) {
        console.log('✅ Setting full analysis data');
        setAnalysis(response.data);
      } else {
        console.log('⚠️ Analyze did not return success=true');
        // If analyze didn't return full data but activeTrekData says active, set a minimal analysis
        if (activeTrekData && activeTrekData.isActive) {
          console.log('📌 Setting minimal analysis from active-trek data');
          setAnalysis({
            isActive: true,
            groupMetrics: { totalMembers: activeTrekData.memberCount || 0, avgSpeed: 0, speedStdDev: 0 },
            summary: { onPace: activeTrekData.memberCount || 0, ahead: 0, lagging: 0, tired: 0 },
            members: [],
            alerts: [],
            suggestions: [],
            timestamp: activeTrekData.startedAt || new Date().toISOString(),
          });
        } else {
          console.log('❌ No active trek found');
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching club trek analysis:', error);
      console.error('Error details:', error.response?.data || error.message);
      if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'Only club leader can view live analytics');
      } else if (error.response?.status === 400) {
        Alert.alert('Error', error.response?.data?.error || 'Bad request');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();

    // Auto-refresh every 15 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAnalysis();
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [clubId, autoRefresh]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalysis();
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatSpeed = (metersPerSecond: number): string => {
    const kmh = metersPerSecond * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'LEADER':
        return '#3B82F6'; // blue
      case 'ON_PACE':
        return '#10B981'; // green
      case 'AHEAD':
        return '#8B5CF6'; // purple
      case 'LAGGING':
        return '#F59E0B'; // orange
      case 'TIRED':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'LEADER':
        return 'star';
      case 'ON_PACE':
        return 'checkmark-circle';
      case 'AHEAD':
        return 'arrow-up-circle';
      case 'LAGGING':
        return 'arrow-down-circle';
      case 'TIRED':
        return 'battery-dead';
      default:
        return 'person';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  if (loading && !analysis) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading club trek data...</Text>
      </View>
    );
  }

  if (!analysis || !analysis.isActive || !analysis.groupMetrics || !analysis.summary) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="information-circle-outline" size={64} color="#6B7280" />
        <Text style={styles.infoText}>No active club trek</Text>
        <Text style={styles.subInfoText}>Start a trek to see live analytics</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Live Club Trek Dashboard</Text>
        <TouchableOpacity
          onPress={() => setAutoRefresh(!autoRefresh)}
          style={styles.autoRefreshButton}
        >
          <Ionicons
            name={autoRefresh ? 'sync' : 'sync-outline'}
            size={20}
            color={autoRefresh ? '#10B981' : '#6B7280'}
          />
          <Text style={[styles.autoRefreshText, autoRefresh && styles.autoRefreshActiveText]}>
            {autoRefresh ? 'Auto' : 'Manual'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Group Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Group Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{analysis.groupMetrics?.totalMembers || 0}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {analysis.summary?.onPace || 0}
            </Text>
            <Text style={styles.summaryLabel}>On Pace</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
              {analysis.summary?.lagging || 0}
            </Text>
            <Text style={styles.summaryLabel}>Lagging</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {analysis.summary?.tired || 0}
            </Text>
            <Text style={styles.summaryLabel}>Tired</Text>
          </View>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Avg Speed:</Text>
          <Text style={styles.metricValue}>
            {formatSpeed(analysis.groupMetrics?.avgSpeed || 0)}
          </Text>
        </View>
      </View>

      {/* Alerts */}
      {analysis.alerts && analysis.alerts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Alerts</Text>
          {analysis.alerts.map((alert, index) => (
            <View
              key={index}
              style={[
                styles.alertItem,
                { borderLeftColor: getSeverityColor(alert.severity) },
              ]}
            >
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Suggestions</Text>
          {analysis.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>{suggestion.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Members List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Members</Text>
        {analysis.members.map((member, index) => (
          <View key={index} style={styles.memberItem}>
            <View style={styles.memberHeader}>
              <View style={styles.memberInfo}>
                <Ionicons
                  name={getClassificationIcon(member.classification)}
                  size={20}
                  color={getClassificationColor(member.classification)}
                />
                <Text style={styles.memberName}>{member.name}</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: getClassificationColor(member.classification) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: getClassificationColor(member.classification) },
                  ]}
                >
                  {member.classification}
                </Text>
              </View>
            </View>
            {member.classification !== 'LEADER' && (
              <View style={styles.memberStats}>
                <Text style={styles.memberStat}>
                  From Leader: {formatDistance(member.distanceFromLeader)}
                </Text>
                <Text style={styles.memberStat}>
                  Speed: {formatSpeed(member.avgSpeed)}
                </Text>
                <Text style={styles.memberStat}>
                  Distance: {formatDistance(member.distance)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <Text style={styles.timestamp}>
        Last updated: {new Date(analysis.timestamp).toLocaleTimeString()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  subInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  autoRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap not supported on older RN versions
    paddingHorizontal: 4,
  },
  autoRefreshText: {
    fontSize: 12,
    color: '#6B7280',
  },
  autoRefreshActiveText: {
    color: '#10B981',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertItem: {
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#1F2937',
  },
  suggestionItem: {
    padding: 12,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1F2937',
  },
  memberItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap not supported on older RN versions
    paddingRight: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberStats: {
    marginLeft: 28,
    // gap not supported on older RN versions
    paddingVertical: 4,
  },
  memberStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  timestamp: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    padding: 16,
  },
});
