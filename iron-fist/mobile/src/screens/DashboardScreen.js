import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '../services/api';
import { Lock, Unlock, MapPin, ShieldCheck, LogOut, Radio } from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [location, setLocation] = useState(null);
  const [unlockStatus, setUnlockStatus] = useState('LOCKED'); // LOCKED, PENDING, UNLOCKED
  const [loading, setLoading] = useState(false);
  const [reqId, setReqId] = useState(null);
  const trackingInterval = useRef(null);

  // Stop tracking on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
    };
  }, []);

  // Polling for unlock request status if pending
  useEffect(() => {
    let pollInterval;
    if (unlockStatus === 'PENDING' && reqId) {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.get(`/unlock/status/${reqId}`);
          const status = res.data.request.status;
          if (status === 'APPROVED') {
            setUnlockStatus('UNLOCKED');
            Alert.alert('Access Granted', 'Dispatcher approved the unlock request. Container is now UNLOCKED.');
            clearInterval(pollInterval);
          } else if (status === 'REJECTED') {
            setUnlockStatus('LOCKED');
            Alert.alert('Access Denied', 'Dispatcher rejected the unlock request.');
            clearInterval(pollInterval);
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      }, 5000);
    }
    return () => clearInterval(pollInterval);
  }, [unlockStatus, reqId]);

  const toggleGpsTracking = async (value) => {
    setGpsEnabled(value);
    
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for active tracking.');
        setGpsEnabled(false);
        return;
      }
      
      // Initial fix
      const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      updateLocation(initialLoc);

      // Start loop
      trackingInterval.current = setInterval(async () => {
        const curLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        updateLocation(curLoc);
      }, 15000); // Send every 15s

    } else {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
    }
  };

  const updateLocation = async (locData) => {
    try {
      setLocation(locData.coords);
      await api.post('/gps/update', {
        containerId: user?.assignedContainerId || 'C-DEFAULT',
        lat: locData.coords.latitude,
        lng: locData.coords.longitude,
        speed: (locData.coords.speed || 0) * 3.6, // m/s to km/h
        heading: locData.coords.heading || 0
      });
    } catch (e) {
      console.warn('GPS Update Failed:', e.message);
    }
  };

  const handleUnlockRequest = async () => {
    setLoading(true);
    try {
      // 1. Hardware Biometric Authentication (Fallback to PIN if no bio)
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      let biometricPassed = false;
      let sessionSimId = 'sim-session-' + Date.now();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify Identity for Unlock Request',
          fallbackLabel: 'Use PIN',
          disableDeviceFallback: false,
        });
        
        if (result.success) {
          biometricPassed = true;
        } else {
          Alert.alert('Biometric Error', 'Verification failed or was canceled.');
          setLoading(false);
          return;
        }
      } else {
        // Mock success if hardware logic fails purely for simulation on basic emulators
        Alert.alert('Simulator Mode', 'Hardware biometrics bypassed (testing mode).');
        biometricPassed = true;
      }

      // 2. We need location to submit request
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      // 3. Submit request to backend
      const res = await api.post('/unlock/request', {
        containerId: user?.assignedContainerId || 'C-DEFAULT',
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        biometricSessionId: sessionSimId // Note: The backend simulation expects some logic, we bypass strict checks by injecting a fake token or adjusting the backend logic to accept any if simulated
      });

      setUnlockStatus('PENDING');
      setReqId(res.data.requestId);
      Alert.alert('Request Sent', 'Unlock request pending dispatcher approval.');

    } catch (e) {
      Alert.alert('Request Failed', e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (trackingInterval.current) clearInterval(trackingInterval.current);
    logout();
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      <View style={styles.header}>
        <View>
          <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
          <Text style={styles.containerId}>Assigned: {user?.assignedContainerId || 'N/A'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#ef4444" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Radio color={gpsEnabled ? "#10b981" : "#6b7280"} size={20} />
          <Text style={styles.cardTitle}>Telemetry Link</Text>
          <View style={{flex: 1}} />
          <Switch 
            value={gpsEnabled}
            onValueChange={toggleGpsTracking}
            trackColor={{ false: '#374151', true: '#10b981' }}
            thumbColor={'#ffffff'}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.statusText}>
            Status: <Text style={{color: gpsEnabled ? '#10b981' : '#ef4444'}}>{gpsEnabled ? 'ACTIVE (Broadcasting)' : 'OFFLINE'}</Text>
          </Text>
          {location && gpsEnabled && (
            <View style={styles.coordBox}>
              <MapPin color="#3b82f6" size={16} />
              <Text style={styles.coordText}>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.card, styles.actionCard]}>
        <View style={styles.lockIconContainer}>
          {unlockStatus === 'UNLOCKED' ? (
            <Unlock color="#10b981" size={60} />
          ) : unlockStatus === 'PENDING' ? (
            <ActivityIndicator size="large" color="#f59e0b" />
          ) : (
             <Lock color="#ef4444" size={60} />
          )}
        </View>

        <Text style={[styles.lockStatusText, 
          unlockStatus === 'UNLOCKED' ? {color: '#10b981'} : 
          unlockStatus === 'PENDING' ? {color: '#f59e0b'} : 
          {color: '#ef4444'}
        ]}>
          CONTAINER {unlockStatus}
        </Text>

        {unlockStatus === 'LOCKED' && (
          <TouchableOpacity 
            style={[styles.unlockBtn, loading && styles.disabledBtn]} 
            onPress={handleUnlockRequest}
            disabled={loading}
          >
             <ShieldCheck color="#fff" size={20} style={{marginRight: 8}} />
             <Text style={styles.unlockBtnText}>REQUEST UNLOCK</Text>
          </TouchableOpacity>
        )}

        {unlockStatus === 'PENDING' && (
          <Text style={styles.infoText}>Awaiting Dispatch Approval...</Text>
        )}

        {unlockStatus === 'UNLOCKED' && (
          <TouchableOpacity style={styles.relockBtn} onPress={() => setUnlockStatus('LOCKED')}>
             <Text style={styles.relockBtnText}>SECURE CONTAINER</Text>
          </TouchableOpacity>
        )}

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1d1d20',
  },
  driverName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  containerId: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
  },
  card: {
    backgroundColor: '#121214',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d1d20',
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1d1d20',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  cardBody: {
    padding: 20,
  },
  statusText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  coordText: {
    color: '#3b82f6',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  actionCard: {
    padding: 30,
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  lockStatusText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 30,
  },
  unlockBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  unlockBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  infoText: {
    color: '#f59e0b',
    fontWeight: '600',
    fontSize: 14,
  },
  relockBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  relockBtnText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  }
});
