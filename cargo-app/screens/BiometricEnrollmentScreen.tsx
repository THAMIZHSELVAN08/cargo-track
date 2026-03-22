import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { ui } from '../theme/ui';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BiometricEnrollment'>;

export default function BiometricEnrollmentScreen({ navigation }: Props) {
  const { completeEnrollment, driverName } = useAuth();
  const [isEnrolling, setIsEnrolling] = useState(false);

  async function handleEnroll() {
    setIsEnrolling(true);
    try {
      // Simulate hardware scanning delay
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      const simulatedBioId = `bio_${driverName?.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`;
      const res = await completeEnrollment(simulatedBioId);
      
      if (res.ok) {
        Alert.alert('Success', 'Biometric profile enrolled successfully.');
        // Navigate to Dashboard
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Enrollment Failed', res.message);
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred during enrollment.');
    } finally {
      setIsEnrolling(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[ui.color.bg0, ui.color.bg1, '#0A1024']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      
      <View style={styles.container}>
        <View style={styles.cardShadow}>
          <BlurView intensity={30} tint="dark" style={styles.card}>
            <Text style={styles.title}>Biometric Enrollment</Text>
            <Text style={styles.body}>
              Your account has been created by administration. To proceed, we need to link your physical biometric data to your profile.
            </Text>

            <View style={styles.sensorArea}>
              <View style={styles.sensorOutline}>
                 <View style={[styles.sensorInner, isEnrolling && styles.sensorScanning]} />
              </View>
              <Text style={styles.sensorLabel}>
                {isEnrolling ? 'Scanning...' : 'Press to Enroll'}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.enrollButton, (pressed || isEnrolling) && { opacity: 0.85 }]}
              onPress={handleEnroll}
              disabled={isEnrolling}
            >
              <LinearGradient colors={['#FF8A2A', ui.color.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonFill}>
                {isEnrolling ? <ActivityIndicator color="rgba(0,0,0,0.85)" /> : <Text style={styles.buttonText}>Enroll Fingerprint</Text>}
              </LinearGradient>
            </Pressable>

            <Text style={styles.note}>
              This process is mandatory for securing high-value cargo transits.
            </Text>
          </BlurView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ui.color.bg0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: ui.space.l,
  },
  cardShadow: {
    borderRadius: ui.radius.xl,
    ...ui.shadow,
  },
  card: {
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.xl,
    padding: ui.space.xl,
    gap: ui.space.m,
    overflow: 'hidden',
    alignItems: 'center',
  },
  title: {
    color: ui.color.text,
    ...ui.type.headline,
    textAlign: 'center',
  },
  body: {
    color: ui.color.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  sensorArea: {
    alignItems: 'center',
    marginVertical: 20,
  },
  sensorOutline: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: ui.color.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  sensorInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sensorScanning: {
    backgroundColor: ui.color.accent,
    opacity: 0.5,
  },
  sensorLabel: {
    color: ui.color.textSecondary,
    marginTop: 15,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  enrollButton: {
    width: '100%',
    borderRadius: ui.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
    marginTop: 10,
  },
  buttonFill: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'rgba(0,0,0,0.88)',
    fontWeight: '900',
    fontSize: 16,
  },
  note: {
    color: ui.color.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
    opacity: 0.7,
  },
});
