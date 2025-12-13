import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Image, Alert, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

type User = {
  _id: string;
  fullName: string;
  email: string;
  photoUrl?: string;
  username?: string;
  followStatus?: 'none' | 'pending' | 'accepted';
};

export default function ExploreScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'following' | 'followers' | 'requests' | 'sent'>('discover');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const foregroundColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted');
  const mutedForeground = useThemeColor({}, 'mutedForeground');
  const borderColor = useThemeColor({}, 'border');
  const destructiveColor = useThemeColor({}, 'destructive');

  const apiUrl = Constants.expoConfig?.extra?.API_URL || 'http://localhost:8000';

  const fetchData = async (searchQuery = '') => {
    if (!user) return;
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'followers') endpoint = '/api/followers/followers';
      if (activeTab === 'following') endpoint = '/api/followers/following';
      if (activeTab === 'requests') endpoint = '/api/followers/pending';
      if (activeTab === 'sent') endpoint = '/api/followers/sent';

      if (endpoint) {
        const res = await axios.get(`${apiUrl}${endpoint}`, {
          headers: { 'x-user-id': user.mongo_uid }
        });
        setResults(res.data);
      } else if (activeTab === 'discover') {
        const res = await axios.get(`${apiUrl}/api/followers/search?query=${searchQuery}`, {
          headers: { 'x-user-id': user.mongo_uid }
        });
        setResults(res.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setResults([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData('');
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab !== 'discover') {
      fetchData();
    }
  }, [user, activeTab]);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchData(text);
    }, 300);
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;
    try {
      const res = await axios.post(`${apiUrl}/api/followers/follow`,
        { targetUserId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      setResults(results.map(u => {
        if (u._id === targetUserId) {
          return { ...u, followStatus: res.data.status === 'pending' ? 'pending' : 'accepted' };
        }
        return u;
      }));
    } catch (error: any) {
      console.error('Follow error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to follow user');
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!user) return;
    try {
      await axios.post(`${apiUrl}/api/followers/unfollow`,
        { targetUserId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      if (activeTab === 'following') {
        fetchData();
      } else {
        setResults(results.map(u => {
          if (u._id === targetUserId) {
            return { ...u, followStatus: 'none' };
          }
          return u;
        }));
      }
    } catch (error: any) {
      console.error('Unfollow error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to unfollow user');
    }
  };

  const handleAccept = async (followerId: string) => {
    if (!user) return;
    try {
      await axios.post(`${apiUrl}/api/followers/accept`,
        { followerId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      fetchData();
    } catch (error: any) {
      console.error('Accept error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRemove = async (followerId: string) => {
    if (!user) return;
    try {
      await axios.post(`${apiUrl}/api/followers/remove`,
        { followerId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      fetchData();
    } catch (error: any) {
      console.error('Remove error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove follower');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(query);
  };

  const tabs = [
    { id: 'discover' as const, label: 'Discover', icon: 'compass' as const },
    { id: 'following' as const, label: 'Following', icon: 'person-add' as const },
    { id: 'followers' as const, label: 'Followers', icon: 'people' as const },
    { id: 'requests' as const, label: 'Requests', icon: 'time' as const },
    { id: 'sent' as const, label: 'Sent', icon: 'paper-plane' as const },
  ];

  const renderUserCard = ({ item }: { item: User }) => (
    <View style={[styles.userCard, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
      <View style={styles.userInfo}>
        <Image
          source={item.photoUrl ? { uri: item.photoUrl } : require('@/assets/images/react-logo.png')}
          style={styles.avatar}
        />
        <View style={styles.userDetails}>
          <ThemedText style={styles.userName}>{item.fullName}</ThemedText>
          <Text style={[styles.userEmail, { color: mutedForeground as string }]} numberOfLines={1}>
            {item.username ? `@${item.username}` : item.email}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {activeTab === 'discover' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: item.followStatus === 'accepted' ? mutedColor : primaryColor as string,
                opacity: item.followStatus === 'pending' ? 0.6 : 1,
              }
            ]}
            onPress={() => item.followStatus === 'accepted' ? handleUnfollow(item._id) : handleFollow(item._id)}
            disabled={item.followStatus === 'pending'}
          >
            <Text style={[styles.actionButtonText, { color: item.followStatus === 'accepted' ? foregroundColor as string : '#fff' }]}>
              {item.followStatus === 'accepted' ? 'Following' :
               item.followStatus === 'pending' ? 'Requested' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {activeTab === 'following' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: mutedColor as string }]}
            onPress={() => handleUnfollow(item._id)}
          >
            <Text style={[styles.actionButtonText, { color: foregroundColor as string }]}>Unfollow</Text>
          </TouchableOpacity>
        )}

        {activeTab === 'followers' && (
          <View style={styles.multiActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.smallButton, { backgroundColor: primaryColor as string }]}
              onPress={() => handleFollow(item._id)}
            >
              <Text style={[styles.actionButtonText, styles.smallButtonText]}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.smallButton, { backgroundColor: mutedColor as string }]}
              onPress={() => handleRemove(item._id)}
            >
              <Text style={[styles.actionButtonText, styles.smallButtonText, { color: foregroundColor as string }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'requests' && (
          <View style={styles.multiActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.smallButton, { backgroundColor: primaryColor as string }]}
              onPress={() => handleAccept(item._id)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.smallButton, { backgroundColor: destructiveColor as string }]}
              onPress={() => handleRemove(item._id)}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'sent' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: mutedColor as string }]}
            onPress={() => handleUnfollow(item._id)}
          >
            <Text style={[styles.actionButtonText, { color: foregroundColor as string }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: cardColor as string, borderBottomColor: borderColor as string }]}>
        <ThemedText type="title">Community</ThemedText>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: cardColor as string }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && { backgroundColor: primaryColor as string }
              ]}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'discover') {
                  setQuery('');
                }
              }}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={activeTab === tab.id ? '#fff' : mutedForeground as string}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  { color: activeTab === tab.id ? '#fff' : mutedForeground as string }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar */}
      {activeTab === 'discover' && (
        <View style={[styles.searchContainer, { backgroundColor: cardColor as string }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: mutedColor as string, borderColor: borderColor as string }]}>
            <Ionicons name="search" size={20} color={mutedForeground as string} />
            <TextInput
              style={[styles.searchInput, { color: foregroundColor as string }]}
              placeholder="Search for people..."
              placeholderTextColor={mutedForeground as string}
              value={query}
              onChangeText={handleSearch}
            />
          </View>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor as string} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderUserCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor as string}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={mutedForeground as string} />
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                {activeTab === 'discover' ? 'No people found' : 'No users found'}
              </ThemedText>
              <Text style={[styles.emptyText, { color: mutedForeground as string }]}>
                {activeTab === 'discover' ? 'Try a different search' : 'Check back later'}
              </Text>
            </View>
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
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tabsContainer: {
    paddingVertical: 8,
  },
  tabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    marginLeft: 8,
  },
  multiActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  smallButtonText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
