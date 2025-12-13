import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

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

const PUBLIC_IMAGES = [
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=60",
];

export default function ClubsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my-clubs'>('all');
  const [newClub, setNewClub] = useState({ name: '', description: '', motivation: '', selectedImage: '' });
  const [creatingClub, setCreatingClub] = useState(false);

  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const foregroundColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');
  const destructiveColor = useThemeColor({}, 'destructive');

  const apiUrl = Constants.expoConfig?.extra?.API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${apiUrl}/api/clubs`);
      setClubs(response.data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateClub = async () => {
    if (!user || !newClub.name.trim() || !newClub.description.trim() || !newClub.motivation.trim() || !newClub.selectedImage) {
      alert('Please fill all fields and select an image');
      return;
    }

    setCreatingClub(true);
    try {
      const response = await axios.post(`${apiUrl}/api/clubs`, 
        {
          name: newClub.name,
          description: newClub.description,
          motivation: newClub.motivation,
          selectedImage: newClub.selectedImage,
        },
        {
          headers: {
            'x-user-id': user.mongo_uid,
          },
        }
      );
      setClubs([...clubs, response.data]);
      setNewClub({ name: '', description: '', motivation: '', selectedImage: '' });
      setShowCreateForm(false);
      alert('Club created successfully!');
    } catch (error: any) {
      console.error('Error creating club:', error);
      alert(error.response?.data?.message || 'Failed to create club');
    } finally {
      setCreatingClub(false);
    }
  };

  const myClubs = clubs.filter(club => club.members?.some(m => m._id === user?.mongo_uid));
  const displayClubs = activeTab === 'all' ? clubs : myClubs;

  const renderClubCard = ({ item }: { item: Club }) => {
    const isMember = item.members?.some(m => m._id === user?.mongo_uid);

    return (
      <TouchableOpacity
        style={[styles.clubCard, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}
        onPress={() => router.push(`/club-details/${item._id}`)}
      >
        <Image
          source={{ uri: item.photoUrl }}
          style={styles.clubImage}
        />
        <View style={styles.clubContent}>
          <ThemedText style={styles.clubName}>{item.name}</ThemedText>
          <ThemedText style={styles.clubMotivation} numberOfLines={1}>{item.motivation}</ThemedText>
          <View style={styles.clubMeta}>
            <View style={styles.membersContainer}>
              <Ionicons name="people" size={14} color={primaryColor as string} />
              <Text style={{ color: foregroundColor as string, fontSize: 12, marginLeft: 4 }}>
                {item.members?.length || 0} members
              </Text>
            </View>
            {isMember && (
              <View style={[styles.memberBadge, { backgroundColor: primaryColor as string }]}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Member</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={primaryColor as string} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ThemedText style={styles.headerTitle}>Clubs</ThemedText>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: primaryColor as string }]}
          onPress={() => setShowCreateForm(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { borderColor: borderColor as string }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && [styles.tabActive, { borderBottomColor: primaryColor as string }],
          ]}
          onPress={() => setActiveTab('all')}
        >
          <ThemedText style={[styles.tabLabel, activeTab === 'all' && { color: primaryColor as string }]}>
            All Clubs
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my-clubs' && [styles.tabActive, { borderBottomColor: primaryColor as string }],
          ]}
          onPress={() => setActiveTab('my-clubs')}
        >
          <ThemedText style={[styles.tabLabel, activeTab === 'my-clubs' && { color: primaryColor as string }]}>
            My Clubs
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Clubs List */}
      <FlatList
        data={displayClubs}
        renderItem={renderClubCard}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchClubs} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={mutedColor as string} />
            <ThemedText style={styles.emptyText}>
              {activeTab === 'my-clubs' ? 'You haven\'t joined any clubs yet' : 'No clubs available'}
            </ThemedText>
          </View>
        }
      />

      {/* Create Club Modal */}
      <Modal visible={showCreateForm} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: cardColor as string }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create New Club</ThemedText>
              <TouchableOpacity onPress={() => setShowCreateForm(false)}>
                <Ionicons name="close" size={24} color={foregroundColor as string} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string }]}
              placeholder="Club Name"
              placeholderTextColor={mutedColor as string}
              value={newClub.name}
              onChangeText={(text) => setNewClub({ ...newClub, name: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string }]}
              placeholder="Description"
              placeholderTextColor={mutedColor as string}
              value={newClub.description}
              onChangeText={(text) => setNewClub({ ...newClub, description: text })}
              multiline
            />

            <TextInput
              style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string }]}
              placeholder="Motivation"
              placeholderTextColor={mutedColor as string}
              value={newClub.motivation}
              onChangeText={(text) => setNewClub({ ...newClub, motivation: text })}
            />

            <ThemedText style={styles.imageLabel}>Select an image:</ThemedText>
            <FlatList
              data={PUBLIC_IMAGES}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.imageOption,
                    newClub.selectedImage === item && { borderColor: primaryColor as string, borderWidth: 3 },
                  ]}
                  onPress={() => setNewClub({ ...newClub, selectedImage: item })}
                >
                  <Image source={{ uri: item }} style={styles.imagePreview} />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              horizontal
              scrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageScroll}
            />

            <TouchableOpacity
              style={[styles.createClubButton, { backgroundColor: primaryColor as string, opacity: creatingClub ? 0.6 : 1 }]}
              onPress={handleCreateClub}
              disabled={creatingClub}
            >
              {creatingClub ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.createClubButtonText}>Create Club</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  clubCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 2,
  },
  clubImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  clubContent: {
    padding: 12,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  clubMotivation: {
    fontSize: 13,
    marginBottom: 8,
    opacity: 0.7,
  },
  clubMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  imageScroll: {
    paddingBottom: 16,
  },
  imageOption: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imagePreview: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  createClubButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createClubButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
