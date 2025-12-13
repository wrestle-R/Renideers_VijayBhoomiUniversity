import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [treks, setTreks] = useState<any[]>([]);
  
  // Profile form data
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    location: '',
    phoneNumber: '',
    experienceLevel: 'beginner',
    goals: '',
    motivations: '',
    website: '',
    instagram: '',
    twitter: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyAltPhone: '',
    emergencyRelationship: '',
    visibility: 'private'
  });

  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const foregroundColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted');
  const mutedForeground = useThemeColor({}, 'mutedForeground');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');

  const apiUrl = Constants.expoConfig?.extra?.API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (user) {
      fetchProfile();
      if (activeTab === 'activity') {
        fetchTreks();
      }
    }

    // Open activity tab if ?tab=activity is provided
    if (params?.tab === 'activity') {
      setActiveTab('activity');
    }
  }, [user, activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/users/profile/${user?.mongo_uid}`);
      const data = response.data;
      setFormData({
        username: data.username || '',
        bio: data.bio || '',
        location: data.location || '',
        phoneNumber: data.phoneNumber || '',
        experienceLevel: data.experienceLevel || 'beginner',
        goals: data.goals ? data.goals.join(', ') : '',
        motivations: data.motivations ? data.motivations.join(', ') : '',
        website: data.socialLinks?.website || '',
        instagram: data.socialLinks?.instagram || '',
        twitter: data.socialLinks?.twitter || '',
        emergencyName: data.emergencyContact?.name || '',
        emergencyPhone: data.emergencyContact?.phone || '',
        emergencyAltPhone: data.emergencyContact?.altPhone || '',
        emergencyRelationship: data.emergencyContact?.relationship || '',
        visibility: data.visibility || 'private'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTreks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/treks/user/${user.firebase_id}?status=completed`);
      setTreks(response.data.treks || response.data.activities || []);
    } catch (error) {
      console.error('Error fetching treks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        userId: user.mongo_uid,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        phoneNumber: formData.phoneNumber,
        experienceLevel: formData.experienceLevel,
        goals: formData.goals.split(',').map(s => s.trim()).filter(Boolean),
        motivations: formData.motivations.split(',').map(s => s.trim()).filter(Boolean),
        socialLinks: {
          website: formData.website,
          instagram: formData.instagram,
          twitter: formData.twitter
        },
        emergencyContact: {
          name: formData.emergencyName || undefined,
          phone: formData.emergencyPhone || undefined,
          altPhone: formData.emergencyAltPhone || undefined,
          relationship: formData.emergencyRelationship || undefined,
        },
        visibility: formData.visibility
      };

      await axios.post(`${apiUrl}/api/users/profile`, payload);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
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

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardColor as string, borderBottomColor: borderColor as string }]}>
        <ThemedText type="title">Settings</ThemedText>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: cardColor as string, borderBottomColor: borderColor as string }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && { borderBottomColor: primaryColor as string, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons name="person" size={20} color={activeTab === 'profile' ? primaryColor as string : mutedForeground as string} />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? primaryColor as string : mutedForeground as string }]}>
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && { borderBottomColor: primaryColor as string, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('activity')}
        >
          <Ionicons name="bar-chart" size={20} color={activeTab === 'activity' ? primaryColor as string : mutedForeground as string} />
          <Text style={[styles.tabText, { color: activeTab === 'activity' ? primaryColor as string : mutedForeground as string }]}>
            Activity History
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !formData.username && treks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor as string} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <View style={styles.formContainer}>
              <View style={[styles.section, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
                <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Username</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.username}
                    onChangeText={(text) => setFormData({ ...formData, username: text })}
                    placeholder="username"
                    placeholderTextColor={mutedForeground as string}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.bio}
                    onChangeText={(text) => setFormData({ ...formData, bio: text })}
                    placeholder="Tell us about yourself"
                    placeholderTextColor={mutedForeground as string}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Location</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.location}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                    placeholder="City, Country"
                    placeholderTextColor={mutedForeground as string}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Phone Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.phoneNumber}
                    onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                    placeholder="+1234567890"
                    placeholderTextColor={mutedForeground as string}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Experience Level</Text>
                  <View style={styles.pickerContainer}>
                    {['beginner', 'intermediate', 'advanced', 'expert'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.pickerOption,
                          { backgroundColor: formData.experienceLevel === level ? primaryColor as string : mutedColor as string,
                            borderColor: borderColor as string }
                        ]}
                        onPress={() => setFormData({ ...formData, experienceLevel: level })}
                      >
                        <Text style={[styles.pickerOptionText, { color: formData.experienceLevel === level ? '#fff' : foregroundColor as string }]}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={[styles.section, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
                <ThemedText style={styles.sectionTitle}>Goals & Motivations</ThemedText>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Goals (comma separated)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.goals}
                    onChangeText={(text) => setFormData({ ...formData, goals: text })}
                    placeholder="e.g. Hike Everest, Run 5k"
                    placeholderTextColor={mutedForeground as string}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Motivations (comma separated)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.motivations}
                    onChangeText={(text) => setFormData({ ...formData, motivations: text })}
                    placeholder="e.g. Fitness, Nature"
                    placeholderTextColor={mutedForeground as string}
                  />
                </View>
              </View>

              <View style={[styles.section, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
                <ThemedText style={styles.sectionTitle}>Social Links</ThemedText>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Website</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.website}
                    onChangeText={(text) => setFormData({ ...formData, website: text })}
                    placeholder="Website URL"
                    placeholderTextColor={mutedForeground as string}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Instagram</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.instagram}
                    onChangeText={(text) => setFormData({ ...formData, instagram: text })}
                    placeholder="Instagram Handle"
                    placeholderTextColor={mutedForeground as string}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Twitter</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.twitter}
                    onChangeText={(text) => setFormData({ ...formData, twitter: text })}
                    placeholder="Twitter Handle"
                    placeholderTextColor={mutedForeground as string}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={[styles.section, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
                <ThemedText style={styles.sectionTitle}>Emergency Contact</ThemedText>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Full Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.emergencyName}
                    onChangeText={(text) => setFormData({ ...formData, emergencyName: text })}
                    placeholder="Full name"
                    placeholderTextColor={mutedForeground as string}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Relationship</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.emergencyRelationship}
                    onChangeText={(text) => setFormData({ ...formData, emergencyRelationship: text })}
                    placeholder="e.g. spouse, parent"
                    placeholderTextColor={mutedForeground as string}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Primary Phone</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.emergencyPhone}
                    onChangeText={(text) => setFormData({ ...formData, emergencyPhone: text })}
                    placeholder="Primary phone"
                    placeholderTextColor={mutedForeground as string}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Alternate Phone</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: mutedColor as string, color: foregroundColor as string, borderColor: borderColor as string }]}
                    value={formData.emergencyAltPhone}
                    onChangeText={(text) => setFormData({ ...formData, emergencyAltPhone: text })}
                    placeholder="Alternate phone"
                    placeholderTextColor={mutedForeground as string}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={[styles.section, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
                <ThemedText style={styles.sectionTitle}>Privacy</ThemedText>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: foregroundColor as string }]}>Profile Visibility</Text>
                  <View style={styles.pickerContainer}>
                    {['public', 'private'].map((vis) => (
                      <TouchableOpacity
                        key={vis}
                        style={[
                          styles.pickerOption,
                          { backgroundColor: formData.visibility === vis ? primaryColor as string : mutedColor as string,
                            borderColor: borderColor as string }
                        ]}
                        onPress={() => setFormData({ ...formData, visibility: vis })}
                      >
                        <Text style={[styles.pickerOptionText, { color: formData.visibility === vis ? '#fff' : foregroundColor as string }]}>
                          {vis.charAt(0).toUpperCase() + vis.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: primaryColor as string, opacity: saving ? 0.6 : 1 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Activity History Tab */}
          {activeTab === 'activity' && (
            <View style={styles.activityContainer}>
              <View style={[styles.activityHeader, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}>
                <ThemedText style={styles.activityTitle}>Trek History</ThemedText>
                <Text style={[styles.activityCount, { color: mutedForeground as string }]}>
                  {treks.length} {treks.length === 1 ? 'trek' : 'treks'} completed
                </Text>
              </View>

              {treks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="map" size={64} color={mutedForeground as string} />
                  <ThemedText type="subtitle" style={styles.emptyTitle}>No treks yet</ThemedText>
                  <Text style={[styles.emptyText, { color: mutedForeground as string }]}>
                    Start tracking your first trek from the Map tab
                  </Text>
                </View>
              ) : (
                treks.map((trek) => (
                  <TouchableOpacity
                    key={trek._id}
                    style={[styles.trekCard, { backgroundColor: cardColor as string, borderColor: borderColor as string }]}
                    onPress={() => router.push(`/trek/${trek._id}`)}
                  >
                    <View style={styles.trekHeader}>
                      <View style={styles.trekTitleContainer}>
                        <ThemedText type="defaultSemiBold" style={styles.trekTitle}>
                          {trek.title}
                        </ThemedText>
                        <Text style={[styles.trekDate, { color: mutedForeground as string }]}>
                          {formatDate(trek.startTime)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={mutedForeground as string} />
                    </View>

                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Ionicons name="navigate" size={16} color={primaryColor as string} />
                        <Text style={[styles.statValue, { color: foregroundColor as string }]}> 
                          {formatDistance(trek.summary?.totalDistance || 0)}
                        </Text>
                        <Text style={[styles.statLabel, { color: mutedForeground as string }]}>Distance</Text>
                      </View>

                      <View style={styles.statItem}>
                        <Ionicons name="time" size={16} color={primaryColor as string} />
                        <Text style={[styles.statValue, { color: foregroundColor as string }]}> 
                          {formatDuration(trek.duration || 0)}
                        </Text>
                        <Text style={[styles.statLabel, { color: mutedForeground as string }]}>Duration</Text>
                      </View>

                      <View style={styles.statItem}>
                        <Ionicons name="footsteps" size={16} color={primaryColor as string} />
                        <Text style={[styles.statValue, { color: foregroundColor as string }]}> 
                          {trek.summary?.totalSteps || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: mutedForeground as string }]}>Steps</Text>
                      </View>

                      <View style={styles.statItem}>
                        <Ionicons name="trending-up" size={16} color={primaryColor as string} />
                        <Text style={[styles.statValue, { color: foregroundColor as string }]}> 
                          {trek.summary?.totalElevationGain?.toFixed(0) || 0}m
                        </Text>
                        <Text style={[styles.statLabel, { color: mutedForeground as string }]}>Elevation</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formContainer: {
    gap: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  activityContainer: {
    gap: 16,
  },
  activityHeader: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  activityCount: {
    fontSize: 14,
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
});
