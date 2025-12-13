import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ClubTrekDashboard from '@/components/ClubTrekDashboard';
import { ThemedView } from '@/components/themed-view';

export default function ClubTrekDashboardScreen() {
  const { id } = useLocalSearchParams();

  return (
    <ThemedView style={styles.container}>
      <ClubTrekDashboard clubId={String(id)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
