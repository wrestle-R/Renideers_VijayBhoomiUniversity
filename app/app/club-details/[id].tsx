import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/AuthContext';
import { useTrek } from '@/context/TrekContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useRouter, useLocalSearchParams } from 'expo-router';

type Club = {
  _id: string;
  name: string;
  description: string;
  motivation: string;
  photoUrl: string;
  creator: { _id: string; fullName: string; photoUrl: string };
  members: { _id: string; fullName: string; photoUrl: string }[];
  createdAt: string;
};

export default function ClubDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { startClubTrek, joinClubTrek, currentTrek, isTracking } = useTrek();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isStartingTrek, setIsStartingTrek] = useState(false);
  const [isJoiningTrek, setIsJoiningTrek] = useState(false);
  const [activeTrek, setActiveTrek] = useState<any>(null);
  const [checkingTrek, setCheckingTrek] = useState(false);

  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const foregroundColor = useThemeColor({}, 'foreground');
  const destructiveColor = useThemeColor({}, 'destructive');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  const apiUrl = Constants.expoConfig?.extra?.API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchClub();
    fetchActiveTrek();
    
    // Poll for active trek every 10 seconds
    const interval = setInterval(fetchActiveTrek, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchClub = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`${apiUrl}/api/clubs/${id}`);
      setClub(response.data);
    } catch (error) {
      console.error('Error fetching club:', error);
      Alert.alert('Error', 'Failed to load club details');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTrek = async () => {
    if (!id) return;
    try {
      setCheckingTrek(true);
      const response = await axios.get(`${apiUrl}/api/clubs/${id}/active-trek`);
      setActiveTrek(response.data);
      if (response.data.isActive) {
        console.log('🔴 ACTIVE CLUB TREK:', response.data);
      }
    } catch (error) {
      console.error('Error fetching active trek:', error);
    } finally {
      setCheckingTrek(false);
    }
  };

  const handleJoinClub = async () => {
    if (!user) return;
    setIsJoining(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/clubs/${id}/join`,
        {},
        {
          headers: {
            'x-user-id': user.mongo_uid,
          },
        }
      );
      setClub(response.data.club);
      Alert.alert('Success', 'You have joined the club');
    } catch (error: any) {
      console.error('Error joining club:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to join club');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!user) return;
    Alert.alert('Leave Club?', 'Are you sure you want to leave this club?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setIsJoining(true);
          try {
            const response = await axios.post(
              `${apiUrl}/api/clubs/${id}/leave`,
              {},
              {
                headers: {
                  'x-user-id': user.mongo_uid,
                },
              }
            );
            setClub(response.data.club);
            Alert.alert('Success', 'You have left the club');
          } catch (error: any) {
            console.error('Error leaving club:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to leave club');
          } finally {
            setIsJoining(false);
          }
        },
      },
    ]);
  };

  const handleStartClubTrek = async () => {
    if (!user || !club) return;
    
    Alert.alert(
      'Start Club Trek',
      'This will start a new club trek session. All members will be able to join and their locations will be tracked.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setIsStartingTrek(true);
            try {
              // Start the club trek using TrekContext
              await startClubTrek(club._id, club.name);
              Alert.alert('Success!', 'Club trek started! Members can now join.');
              // Refresh active trek info
              await fetchActiveTrek();
            } catch (error: any) {
              console.error('Error starting club trek:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to start club trek');
            } finally {
              setIsStartingTrek(false);
            }
          },
        },
      ]
    );
  };

  const handleJoinClubTrek = async () => {
    if (!user || !club) return;

    if (!isTracking || !currentTrek) {
      Alert.alert(
        'Start Trek First',
        'You need to start tracking your trek before joining the club trek. Start a trek now?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Trek',
            onPress: () => {
              // Navigate to trek screen to start
              router.push('/(tabs)');
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Join Club Trek',
      `Join ${activeTrek.leaderName}'s club trek? Your location will be shared with the group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setIsJoiningTrek(true);
            try {
              await joinClubTrek(club._id);
              Alert.alert('Success!', `You've joined the club trek! Your location is now being shared.`);
              await fetchActiveTrek();
            } catch (error: any) {
              console.error('Error joining club trek:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to join club trek');
            } finally {
              setIsJoiningTrek(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={primaryColor as string} />
      </ThemedView>
    );
  }

  if (!club) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Club not found</ThemedText>
      </ThemedView>
    );
  }

  const isMember = club.members?.some(m => m._id === user?.mongo_uid);
  const isCreator = club.creator._id === user?.mongo_uid;

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={foregroundColor as string} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Club Details</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Club Image */}
        <Image 
          source={club.photoUrl ? { uri: club.photoUrl } : require('@/assets/images/react-logo.png')} 
          style={styles.clubImage} 
        />

        {/* Club Info Card */}
        <View style={[styles.infoCard, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
          <View style={styles.titleSection}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.clubName}>{club.name}</ThemedText>
              <ThemedText style={styles.clubMotivation}>{club.motivation}</ThemedText>
            </View>
          </View>

          {/* Members Count */}
          <View style={styles.metaRow}>
            <Ionicons name="people" size={18} color={primaryColor as string} />
            <ThemedText style={styles.metaText}>{club.members?.length || 0} members</ThemedText>
          </View>

          {/* Creator Info */}
          <View style={[styles.creatorSection, { backgroundColor: mutedColor as string }]}>
            <Image 
              source={club.creator.photoUrl ? { uri: club.creator.photoUrl } : require('@/assets/images/react-logo.png')} 
              style={styles.creatorAvatar} 
            />
            <View>
              <ThemedText style={styles.creatorLabel}>Created by</ThemedText>
              <ThemedText style={styles.creatorName}>{club.creator.fullName}</ThemedText>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <ThemedText style={styles.sectionTitle}>About</ThemedText>
            <ThemedText style={styles.description}>{club.description}</ThemedText>
          </View>

          {/* Members List */}
          <View style={styles.membersSection}>
            <ThemedText style={styles.sectionTitle}>Members</ThemedText>
            <View style={styles.membersList}>
              {club.members?.map((member) => (
                <View key={member._id} style={styles.memberItem}>
                  <Image 
                    source={member.photoUrl ? { uri: member.photoUrl } : require('@/assets/images/react-logo.png')} 
                    style={styles.memberAvatar} 
                  />
                  <ThemedText style={styles.memberName} numberOfLines={1}>
                    {member.fullName}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Active Club Trek Banner - Show to all members */}
          {activeTrek?.isActive && (
            <View style={[styles.activeTrekBanner, { backgroundColor: primaryColor as string, borderColor: borderColor as string }]}>
              <View style={styles.activeTrekHeader}>
                <View style={[styles.pulsingDot, { backgroundColor: cardColor as string }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="walk" size={18} color="#fff" />
                  <ThemedText style={styles.activeTrekTitle}>Club Trek Active!</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.activeTrekText}>
                {activeTrek.leaderName} started a club trek
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Ionicons name="people" size={16} color="#fff" />
                <ThemedText style={styles.activeTrekMembers}>
                  {activeTrek.memberCount} member{activeTrek.memberCount !== 1 ? 's' : ''} tracking
                </ThemedText>
              </View>
              
              {/* Join button for non-leader members */}
              {!isCreator && isMember && (
                <TouchableOpacity
                  style={[styles.joinTrekButton, { backgroundColor: cardColor as string, opacity: isJoiningTrek ? 0.6 : 1 }]}
                  onPress={handleJoinClubTrek}
                  disabled={isJoiningTrek}
                >
                  {isJoiningTrek ? (
                    <ActivityIndicator color={primaryColor as string} />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={20} color={primaryColor as string} style={{ marginRight: 8 }} />
                      <ThemedText style={[styles.joinTrekButtonText, { color: primaryColor as string }]}>
                        Join Club Trek
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Leader Controls - Start Club Trek Button */}
          {isCreator && (
            <View style={styles.leaderSection}>
              <View style={styles.leaderBadge}>
                <Ionicons name="shield-checkmark" size={16} color={primaryColor as string} />
                <ThemedText style={styles.leaderLabel}>Leader Controls</ThemedText>
              </View>
              <TouchableOpacity
                style={[
                  styles.startTrekButton,
                  {
                    backgroundColor: primaryColor as string,
                    opacity: isStartingTrek || (currentTrek && currentTrek.status === 'active') ? 0.6 : 1,
                  },
                ]}
                onPress={handleStartClubTrek}
                disabled={isStartingTrek || !!(currentTrek && currentTrek.status === 'active')}
              >
                {isStartingTrek ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="rocket"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <ThemedText style={styles.startTrekButtonText}>
                      {currentTrek && currentTrek.status === 'active' ? 'Trek Already Active' : 'Start Club Trek'}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
              <ThemedText style={styles.leaderHint}>
                Start a trek session and members can join to share locations
              </ThemedText>

              {/* Open Live Dashboard */}
              {(activeTrek?.isActive || (currentTrek && currentTrek.status === 'active')) && (
                <TouchableOpacity
                  style={[styles.startTrekButton, { backgroundColor: '#111827', marginTop: 8 }]}
                  onPress={() => router.push(`/club-trek-dashboard/${club._id}`)}
                >
                  <Ionicons name="analytics" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <ThemedText style={styles.startTrekButtonText}>Open Live Dashboard</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isMember ? destructiveColor : (primaryColor as string),
                opacity: isJoining ? 0.6 : 1,
              },
            ]}
            onPress={isMember ? handleLeaveClub : handleJoinClub}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={isMember ? 'exit' : 'add'}
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <ThemedText style={styles.actionButtonText}>
                  {isMember ? 'Leave Club' : 'Join Club'}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clubImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  infoCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clubName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  clubMotivation: {
    fontSize: 14,
    opacity: 0.7,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  creatorLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  membersSection: {
    marginTop: 12,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberItem: {
    alignItems: 'center',
    width: '48%',
  },
  memberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  leaderLabel: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.9,
  },
  startTrekButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  startTrekButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderHint: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  activeTrekBanner: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeTrekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  activeTrekTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  activeTrekText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
    opacity: 0.95,
  },
  activeTrekMembers: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  joinTrekButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinTrekButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
