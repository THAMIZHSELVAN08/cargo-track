import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { getUnlockStatus, getVehicleStatus, requestUnlock, UnlockStatus, VehicleStatus } from '../services/cargoService';
import { sendGpsUpdate } from '../services/gpsService';
import { ui } from '../theme/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';
import * as SecureStore from 'expo-secure-store';

const REQUEST_ID_KEY = 'cargo_security_request_id';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function statusColor(status: UnlockStatus) {
  if (status === 'approved') return ui.color.success;
  if (status === 'pending') return ui.color.warning;
  if (status === 'rejected') return ui.color.danger;
  return ui.color.textSecondary;
}

function vehicleColor(status: VehicleStatus) {
  if (status === 'running') return ui.color.success;
  if (status === 'stopped') return ui.color.danger;
  return ui.color.textSecondary;
}

import { Linking } from 'react-native';

export function DashboardScreen({ navigation }: Props) {
  const { driverName, containerId, biometricFingerprintId, signOut } = useAuth();

  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus>('none');
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>('unknown');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRequestingUnlock, setIsRequestingUnlock] = useState(false);

  const [gpsPermission, setGpsPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastGpsSentAt, setLastGpsSentAt] = useState<string | null>(null);

  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<number>(0);
  const [isIdentityStale, setIsIdentityStale] = useState(false);

  const gpsIntervalRef = useRef<number | null>(null);
  const statusIntervalRef = useRef<number | null>(null);

  const welcomeName = useMemo(() => (driverName ? driverName : 'Driver'), [driverName]);

  async function refreshStatus() {
    if (!containerId) return;
    setIsRefreshing(true);
    try {
      const promises: Promise<any>[] = [getVehicleStatus(containerId)];
      if (currentRequestId) {
        promises.push(getUnlockStatus(currentRequestId));
      }

      const results = await Promise.all(promises);
      const vehRes = results[0];
      const unlockRes = currentRequestId ? results[1] : null;

      if (vehRes.ok) setVehicleStatus(vehRes.data.engineStatus?.toLowerCase() ?? 'unknown');
      
      // Fix: Handle nested response structure for unlock status
      if (unlockRes && unlockRes.ok) {
        const status = unlockRes.data.request?.status?.toLowerCase() || unlockRes.data.status?.toLowerCase() || 'none';
        setUnlockStatus(status as UnlockStatus);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  async function ensureGpsPermission() {
    setGpsError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsPermission('denied');
      setGpsError('GPS permission denied.');
      return false;
    }
    setGpsPermission('granted');
    return true;
  }

  async function tickGps() {
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setLatitude(lat);
      setLongitude(lon);

      if (!containerId) return;

      const res = await sendGpsUpdate({
        containerId,
        lat,
        lng: lon,
      });

      if (!res.ok) {
        setGpsError(res.error.message);
        return;
      }

      setGpsError(null);
      setLastGpsSentAt(new Date().toLocaleTimeString());
      return true; // GPS success
    } catch (e) {
      setGpsError('Failed to read/send GPS.');
      return false;
    }
  }

  function startGpsLoop() {
    if (gpsIntervalRef.current) return;
    tickGps();
    gpsIntervalRef.current = setInterval(() => {
      tickGps();
    }, 5000) as unknown as number;
  }

  function stopGpsLoop() {
    if (!gpsIntervalRef.current) return;
    clearInterval(gpsIntervalRef.current);
    gpsIntervalRef.current = null;
  }

  function startStatusLoop() {
    if (statusIntervalRef.current) return;
    refreshStatus();
    statusIntervalRef.current = setInterval(() => {
      refreshStatus();
    }, 15000) as unknown as number;
  }

  function stopStatusLoop() {
    if (!statusIntervalRef.current) return;
    clearInterval(statusIntervalRef.current);
    statusIntervalRef.current = null;
  }

  useEffect(() => {
    if (!biometricFingerprintId) {
      navigation.replace('BiometricEnrollment');
    }
  }, [biometricFingerprintId, navigation]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const savedReqId = await SecureStore.getItemAsync(REQUEST_ID_KEY);
        if (mounted && savedReqId) setCurrentRequestId(savedReqId);
      } catch (e) {
        // ignore
      }

      const ok = await ensureGpsPermission();
      if (!mounted) return;
      if (ok) startGpsLoop();
    })();

    startStatusLoop();
    return () => {
      mounted = false;
      stopGpsLoop();
      stopStatusLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (vehicleStatus === 'stopped') {
      navigation.navigate('Alert');
    }
  }, [vehicleStatus, navigation]);

  // High-Security 1-Hour Re-verification Check
  useEffect(() => {
    const checkIdentity = () => {
      if (lastVerifiedAt > 0) {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        if (now - lastVerifiedAt > oneHour) {
          setIsIdentityStale(true);
          setBiometricVerified(false);
          Alert.alert('Security Notice', 'Identity verification has expired. Please re-verify biometrics to continue.');
        } else {
          setIsIdentityStale(false);
        }
      }
    };

    checkIdentity();
    const timer = setInterval(checkIdentity, 30000); // Check every 30s
    return () => clearInterval(timer);
  }, [lastVerifiedAt]);

  async function onPressRequestUnlock() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // Fallback for demo if no hardware
      setShowBiometricModal(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify Identity for Cargo Unlock',
      fallbackLabel: 'Enter PIN',
    });

    if (result.success) {
      setLastVerifiedAt(Date.now());
      setBiometricVerified(true);
      setIsIdentityStale(false);
      onConfirmBiometric();
    } else {
      Alert.alert('Verification Failed', 'Identity could not be verified.');
    }
  }

  async function onConfirmBiometric() {
    // Proactive GPS lock attempt if missing
    let currentLat = latitude;
    let currentLon = longitude;
    
    if (currentLat == null || currentLon == null) {
      const success = await tickGps();
      if (!success) {
        Alert.alert('GPS Signal Required', 'Please ensure location services are enabled and you have a clear sky view.');
        return;
      }
      currentLat = latitude;
      currentLon = longitude;
    }

    if (!containerId || currentLat == null || currentLon == null) {
      Alert.alert('Error', 'Missing Container ID or GPS synchronization.');
      return;
    }
    setBiometricVerified(true);
    setShowBiometricModal(false);

    setIsRequestingUnlock(true);
    try {
      const res = await requestUnlock({
        containerId,
        lat: currentLat,
        lng: currentLon,
        biometricSessionId: 'bio_session_demo123',
      });      if (!res.ok) {
        Alert.alert('Request failed', res.error.message);
        return;
      }
      if (res.data.requestId) {
        setCurrentRequestId(res.data.requestId);
        await SecureStore.setItemAsync(REQUEST_ID_KEY, res.data.requestId);
      }
      
      const newStatus = (res.data.status?.toLowerCase() || res.data.request?.status?.toLowerCase() || 'pending') as UnlockStatus;
      setUnlockStatus(newStatus);
      Alert.alert('Request Sent', 'Your unlock request is now pending admin approval.');
    } finally {
      setIsRequestingUnlock(false);
    }
  }

  function openMapRoute() {
    if (latitude == null || longitude == null) return;
    // In a real app, destination would be dynamic from backend. 
    // For demo, we use a coordinate near Chennai Port as fixed destination.
    const destLat = 13.0827; 
    const destLng = 80.2707;
    // Enhanced URL for better navigation integration
    const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destLat},${destLng}&travelmode=driving&dir_action=navigate`;
    Linking.openURL(url);
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[ui.color.bg0, ui.color.bg1, '#0A1024']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Welcome {welcomeName}</Text>
          <Text style={styles.subHeader}>Cargo Security System</Text>
        </View>

        <Pressable onPress={signOut} style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}>
          <Text style={styles.signOutText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.cardShadow}>
        <BlurView intensity={22} tint="dark" style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>

          <View style={styles.row}>
            <Text style={styles.key}>Unlock Status</Text>
            <View style={[styles.pill, { borderColor: statusColor(unlockStatus) }]}>
              <View style={[styles.dot, { backgroundColor: statusColor(unlockStatus) }]} />
              <Text style={styles.value}>{unlockStatus.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.key}>Vehicle</Text>
            <View style={[styles.pill, { borderColor: vehicleColor(vehicleStatus) }]}>
              <View style={[styles.dot, { backgroundColor: vehicleColor(vehicleStatus) }]} />
              <Text style={styles.value}>{vehicleStatus.toUpperCase()}</Text>
            </View>
          </View>

          <Pressable
            onPress={refreshStatus}
            style={({ pressed }) => [styles.smallButton, pressed && { opacity: 0.9 }]}
            disabled={isRefreshing}
          >
            {isRefreshing ? <ActivityIndicator color={ui.color.text} size="small" /> : <Text style={styles.smallButtonText}>Refresh Status</Text>}
          </Pressable>
        </BlurView>
      </View>

      <Pressable
        style={({ pressed }) => [styles.actionButton, (pressed || isRequestingUnlock) && styles.actionButtonPressed]}
        onPress={onPressRequestUnlock}
        disabled={isRequestingUnlock}
      >
        <LinearGradient colors={['#FF8A2A', ui.color.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButtonFill}>
          {isRequestingUnlock ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Verify Fingerprint & Unlock</Text>}
        </LinearGradient>
      </Pressable>

      {!biometricVerified ? (
        <View style={[styles.cardShadow, { flex: 1, paddingBottom: 40 }]}>
          <BlurView intensity={35} tint="dark" style={[styles.card, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
            <View style={styles.lockIconContainer}>
               <Text style={{ fontSize: 40 }}>🔒</Text>
            </View>
            <Text style={[styles.cardTitle, { textAlign: 'center', fontSize: 18, marginBottom: 12 }]}>Secure Protocol Active</Text>
            <Text style={{ color: ui.color.textSecondary, textAlign: 'center', marginBottom: 35, lineHeight: 22 }}>
              Biometric authorization is required to initialize GPS uplink and unlock move-path telemetry.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.actionButton, { width: '100%' }, pressed && { opacity: 0.85 }]}
              onPress={onPressRequestUnlock}
            >
              <LinearGradient colors={['#FF8A2A', ui.color.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButtonFill}>
                <Text style={styles.actionButtonText}>Verify Identity</Text>
              </LinearGradient>
            </Pressable>
          </BlurView>
        </View>
      ) : (
        <>
          <View style={styles.cardShadow}>
            <BlurView intensity={22} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>Assigned Route</Text>
              <View style={styles.row}>
                <Text style={styles.key}>Destination</Text>
                <Text style={styles.value}>Bangalore Hub {"->"} Chennai Port</Text>
              </View>
              {/* Note: In a real app, this would come from the user's assignedLocation field */}
            </BlurView>
          </View>

          <View style={styles.cardShadow}>
            <BlurView intensity={22} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>Identity Status</Text>
              <View style={styles.row}>
                <Text style={styles.key}>Verified</Text>
                <View style={[styles.pill, { borderColor: ui.color.success }]}>
                   <Text style={[styles.value, { color: ui.color.success }]}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.muted}>Expires in {Math.max(0, Math.floor((1 * 60 * 60 * 1000 - (Date.now() - lastVerifiedAt)) / (60 * 1000)))} mins</Text>
            </BlurView>
          </View>

          <View style={styles.cardShadow}>
            <BlurView intensity={22} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>GPS Tracking</Text>
              <View style={styles.row}>
                <Text style={styles.key}>Latitude</Text>
                <Text style={styles.value}>{latitude != null ? latitude.toFixed(6) : '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.key}>Longitude</Text>
                <Text style={styles.value}>{longitude != null ? longitude.toFixed(6) : '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.key}>Last Sent</Text>
                <Text style={styles.value}>{lastGpsSentAt ?? '—'}</Text>
              </View>

              {gpsPermission === 'denied' ? <Text style={styles.error}>GPS permission denied. Enable Location to send updates.</Text> : null}
              {gpsError ? <Text style={styles.error}>{gpsError}</Text> : null}
            </BlurView>
          </View>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.85 }]}
            onPress={openMapRoute}
          >
            <Text style={styles.secondaryButtonText}>Go to Path (Google Maps)</Text>
          </Pressable>

          <View style={{ height: ui.space.m }} />
        </>
      )}

      <Modal transparent animationType="fade" visible={showBiometricModal} onRequestClose={() => setShowBiometricModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Biometric Verification</Text>
            <Text style={styles.modalBody}>
              Biometrics are simulated for this demo. Press the button below to proceed.
            </Text>

            <Pressable style={({ pressed }) => [styles.modalButton, pressed && { opacity: 0.85 }]} onPress={onConfirmBiometric}>
              <LinearGradient colors={['#FF8A2A', ui.color.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalButtonFill}>
                <Text style={styles.modalButtonText}>Simulate Biometrics</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.modalCancel, pressed && { opacity: 0.85 }]} onPress={() => setShowBiometricModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>

            {biometricVerified ? <Text style={styles.muted}>Verified</Text> : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: ui.space.l,
    backgroundColor: '#050814',
    gap: ui.space.m,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,138,42,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,138,42,0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    color: ui.color.text,
    ...ui.type.headline,
  },
  subHeader: {
    color: ui.color.textSecondary,
    marginTop: 6,
    ...ui.type.body,
  },
  signOut: {
    borderWidth: 1,
    borderColor: ui.color.border,
    paddingHorizontal: ui.space.m,
    paddingVertical: 10,
    borderRadius: ui.radius.l,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  signOutText: {
    color: ui.color.text,
    fontWeight: '800',
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
    padding: ui.space.l,
    gap: ui.space.s,
    overflow: 'hidden',
  },
  cardTitle: {
    color: ui.color.text,
    ...ui.type.subhead,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  key: {
    color: ui.color.textSecondary,
    ...ui.type.body,
  },
  value: {
    color: ui.color.text,
    fontWeight: '800',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: ui.radius.pill,
    paddingHorizontal: ui.space.m,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: ui.radius.pill,
  },
  smallButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: ui.space.m,
    paddingVertical: 10,
    borderRadius: ui.radius.l,
  },
  smallButtonText: {
    color: ui.color.text,
    fontWeight: '800',
  },
  actionButton: {
    borderRadius: ui.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
  },
  actionButtonFill: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'rgba(0,0,0,0.88)',
    fontWeight: '900',
    letterSpacing: 0.2,
    fontSize: 16,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: ui.radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: ui.color.text,
    fontWeight: '800',
  },
  error: {
    color: ui.color.danger,
    ...ui.type.caption,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: ui.color.surfaceStrong,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.xl,
    padding: ui.space.l,
    gap: ui.space.s,
    overflow: 'hidden',
    ...ui.shadow,
  },
  modalTitle: {
    color: ui.color.text,
    ...ui.type.headline,
  },
  modalBody: {
    color: ui.color.textSecondary,
    lineHeight: 18,
  },
  modalButton: {
    borderRadius: ui.radius.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
  },
  modalButtonFill: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'rgba(0,0,0,0.88)',
    fontWeight: '900',
  },
  modalCancel: {
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.l,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  modalCancelText: {
    color: ui.color.text,
    fontWeight: '800',
  },
  muted: {
    color: ui.color.textSecondary,
    ...ui.type.caption,
    textAlign: 'center',
  },
});

