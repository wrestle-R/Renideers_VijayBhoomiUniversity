/**
 * SOSButton - Manual SOS trigger button
 * Visible during active trek (even when paused)
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View } from 'react-native';
import { useTrek } from '../context/TrekContext';

export const SOSButton: React.FC = () => {
  const { triggerManualSOS, isTracking } = useTrek();
  const [isPressed, setIsPressed] = useState(false);

  if (!isTracking) {
    // Don't show button when no trek is active
    return null;
  }

  const handlePress = () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will immediately send an emergency SMS to your emergency contacts with your current location.\n\nAre you sure you want to trigger SOS?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setIsPressed(true);
            try {
              await triggerManualSOS();
              Alert.alert('✅ SOS Sent', 'Emergency message sent to your contacts');
            } catch (error: any) {
              Alert.alert('❌ Error', error.message || 'Failed to send SOS');
            } finally {
              setIsPressed(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, isPressed && styles.buttonPressed]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={isPressed}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>🚨</Text>
        <Text style={styles.text}>SOS</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 4,
    borderColor: '#DC2626',
  },
  buttonPressed: {
    backgroundColor: '#B91C1C',
    transform: [{ scale: 0.95 }],
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
