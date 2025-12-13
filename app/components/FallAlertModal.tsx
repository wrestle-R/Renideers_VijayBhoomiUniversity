/**
 * FallAlertModal - Shows fall detection alert with countdown timer
 * Allows user to cancel SOS within 10 seconds
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useTrek } from '../context/TrekContext';

export const FallAlertModal: React.FC = () => {
  const { sosState, cancelSOSTimer } = useTrek();
  const { isFallDetected, isSOSTimerActive, sosTimerSeconds } = sosState;

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isSOSTimerActive) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSOSTimerActive]);

  if (!isFallDetected || !isSOSTimerActive) {
    return null;
  }

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.icon}>🚨</Text>
          </Animated.View>

          <Text style={styles.title}>Fall Detected!</Text>
          <Text style={styles.message}>
            Possible fall detected. Emergency SOS will be sent in:
          </Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{sosTimerSeconds}</Text>
            <Text style={styles.timerLabel}>seconds</Text>
          </View>

          <Text style={styles.instruction}>
            If you're OK, cancel the alert now.
          </Text>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelSOSTimer}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>I'm OK - Cancel SOS</Text>
          </TouchableOpacity>

          <Text style={styles.sosInfo}>
            SOS will send your location to emergency contacts via SMS
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  timerContainer: {
    backgroundColor: '#EF4444',
    borderRadius: 100,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 6,
    borderColor: '#DC2626',
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timerLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -4,
  },
  instruction: {
    fontSize: 14,
    color: '#F3F4F6',
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sosInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
