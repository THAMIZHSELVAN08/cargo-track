import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { ui } from '../theme/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Alert'>;

export function AlertScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={[ui.color.bg0, ui.color.bg1, '#0A1024']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />

      <View style={styles.alertShadow}>
        <BlurView intensity={22} tint="dark" style={styles.alertBox}>
          <View style={styles.alertTopRow}>
            <View style={styles.alertDot} />
            <Text style={styles.alertTitle}>Anomaly Detected</Text>
          </View>
          <Text style={styles.alertBody}>Vehicle status indicates a stop condition.</Text>
        </BlurView>
      </View>

      <View style={styles.cardShadow}>
        <BlurView intensity={22} tint="dark" style={styles.statusCard}>
          <Text style={styles.key}>Vehicle Status</Text>
          <Text style={styles.status}>STOPPED</Text>
          <Text style={styles.hint}>Contact dispatcher.</Text>
        </BlurView>
      </View>

      <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]} onPress={() => navigation.navigate('Dashboard')}>
        <LinearGradient colors={['#FF8A2A', ui.color.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonFill}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: ui.space.l,
    backgroundColor: ui.color.bg0,
    justifyContent: 'center',
    gap: ui.space.m,
  },
  alertShadow: {
    borderRadius: ui.radius.xl,
    ...ui.shadow,
  },
  alertBox: {
    backgroundColor: 'rgba(255,69,58,0.10)',
    borderColor: 'rgba(255,69,58,0.35)',
    borderWidth: 1,
    borderRadius: ui.radius.xl,
    padding: ui.space.l,
    gap: ui.space.s,
    overflow: 'hidden',
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: ui.radius.pill,
    backgroundColor: ui.color.danger,
  },
  alertTitle: {
    color: ui.color.text,
    ...ui.type.headline,
  },
  alertBody: {
    color: ui.color.textSecondary,
    ...ui.type.body,
  },
  cardShadow: {
    borderRadius: ui.radius.xl,
    ...ui.shadow,
  },
  statusCard: {
    backgroundColor: ui.color.surface,
    borderColor: ui.color.border,
    borderWidth: 1,
    borderRadius: ui.radius.xl,
    padding: ui.space.l,
    gap: ui.space.s,
    overflow: 'hidden',
  },
  key: {
    color: ui.color.textSecondary,
    ...ui.type.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  status: {
    color: ui.color.danger,
    fontWeight: '900',
    fontSize: 30,
    letterSpacing: 0.8,
  },
  hint: {
    color: ui.color.textSecondary,
    ...ui.type.body,
  },
  button: {
    borderRadius: ui.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
    marginTop: ui.space.s,
  },
  buttonFill: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'rgba(0,0,0,0.88)',
    fontWeight: '900',
  },
});

