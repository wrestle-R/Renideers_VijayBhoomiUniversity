import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function SettingsScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText style={{ marginTop: 8 }}>Manage your account, preferences, and app settings.</ThemedText>
    </ThemedView>
  );
}
