import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/AuthContext';
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
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const foregroundColor = useThemeColor({}, 'foreground');
  const destructiveColor = useThemeColor({}, 'destructive');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  const apiUrl = Constants.expoConfig?.extra?.API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchClub();
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
        <Image source={{ uri: club.photoUrl }} style={styles.clubImage} />

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
            <Image source={{ uri: club.creator.photoUrl }} style={styles.creatorAvatar} />
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
                  <Image source={{ uri: member.photoUrl }} style={styles.memberAvatar} />
                  <ThemedText style={styles.memberName} numberOfLines={1}>
                    {member.fullName}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

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
});
