import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { http } from '../../services/http';

const C = {
  bg:     '#111827',
  card:   '#1F2937',
  border: '#374151',
  text:   '#F9FAFB',
  muted:  '#9CA3AF',
  accent: '#F97316',
  green:  '#22C55E',
  red:    '#EF4444',
  blue:   '#3B82F6',
  input:  '#0F172A',
};

function Section({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function AdminProfileScreen() {
  const { driverName, containerId, signOut } = useAuth();

  // GPS Simulation state
  const [vehicleId, setVehicleId]   = useState('C-8842');
  const [lat, setLat]               = useState('13.0827');
  const [lng, setLng]               = useState('80.2707');
  const [speed, setSpeed]           = useState('60');
  const [gpsSending, setGpsSending] = useState(false);

  // Engine Control state
  const [engineId, setEngineId]     = useState('C-8842');
  const [engineAction, setEngineAction] = useState<'STOP' | 'START'>('STOP');
  const [engineSending, setEngineLoading] = useState(false);

  const sendGps = async () => {
    setGpsSending(true);
    try {
      await http.post('/gps/update', {
        containerId: vehicleId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        speed: parseFloat(speed),
        source: 'MOBILE_APP',
      });
      Alert.alert('✅ GPS Sent', `Updated ${vehicleId} to ${lat}, ${lng}`);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error ?? e.message);
    } finally {
      setGpsSending(false);
    }
  };

  const sendEngineControl = async () => {
    setEngineLoading(true);
    try {
      await http.post('/immobilize', {
        containerId: engineId,
        action: engineAction === 'STOP' ? 'STOP' : 'START',
        reason: 'Remote command from Admin App',
      });
      Alert.alert('✅ Done', `Engine ${engineAction === 'STOP' ? 'immobilized' : 'restored'} for ${engineId}`);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error ?? e.message);
    } finally {
      setEngineLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{(driverName ?? 'A')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{driverName ?? 'Admin'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>ADMIN</Text>
        </View>
      </View>

      {/* Account Details */}
      <Section title="ACCOUNT DETAILS" />
      <View style={styles.card}>
        <InfoRow icon="👤" label="Username" value={driverName ?? 'admin'} />
        <InfoRow icon="🛡" label="Role"     value="admin" />
        <InfoRow icon="🚛" label="Vehicle ID" value={containerId ?? 'None assigned'} />
      </View>

      {/* GPS Simulation */}
      <Section title="GPS SIMULATION" />
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Vehicle ID (e.g. C-8842)"
          placeholderTextColor={C.muted}
          value={vehicleId}
          onChangeText={setVehicleId}
        />
        <View style={styles.row2}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Latitude"
            placeholderTextColor={C.muted}
            value={lat}
            onChangeText={setLat}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Longitude"
            placeholderTextColor={C.muted}
            value={lng}
            onChangeText={setLng}
            keyboardType="numeric"
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Speed (km/h)"
          placeholderTextColor={C.muted}
          value={speed}
          onChangeText={setSpeed}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: C.blue }]}
          onPress={sendGps}
          disabled={gpsSending}
        >
          <Text style={styles.bigBtnText}>{gpsSending ? 'Sending…' : '✈ Send GPS Update'}</Text>
        </TouchableOpacity>
      </View>

      {/* Engine Control */}
      <Section title="ENGINE CONTROL" />
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Container ID"
          placeholderTextColor={C.muted}
          value={engineId}
          onChangeText={setEngineId}
        />
        <View style={styles.row2}>
          <TouchableOpacity
            style={[styles.toggleBtn, engineAction === 'STOP' && styles.toggleBtnActive]}
            onPress={() => setEngineAction('STOP')}
          >
            <Text style={[styles.toggleText, engineAction === 'STOP' && { color: C.red }]}>⚡ Immobilize</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, engineAction === 'START' && styles.toggleBtnActiveGreen]}
            onPress={() => setEngineAction('START')}
          >
            <Text style={[styles.toggleText, engineAction === 'START' && { color: C.green }]}>⚡ Restore</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: engineAction === 'STOP' ? C.red : C.green }]}
          onPress={sendEngineControl}
          disabled={engineSending}
        >
          <Text style={styles.bigBtnText}>
            {engineSending ? 'Processing…' : engineAction === 'STOP' ? '⚡ Immobilize Vehicle' : '✓ Restore Engine'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
        <Text style={styles.signOutText}>↪ Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.bg },
  avatarSection:   { alignItems: 'center', paddingTop: 56, paddingBottom: 24 },
  avatar:          { width: 72, height: 72, borderRadius: 36, backgroundColor: C.red + '33', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarLetter:    { fontSize: 30, fontWeight: '800', color: C.red },
  userName:        { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 8 },
  roleBadge:       { backgroundColor: C.red + '22', borderWidth: 1, borderColor: C.red, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  roleBadgeText:   { fontSize: 12, fontWeight: '700', color: C.red },
  sectionHeader:   { paddingHorizontal: 20, marginTop: 20, marginBottom: 8 },
  sectionTitle:    { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase' },
  card:            { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border, padding: 14, gap: 10 },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  infoIcon:        { fontSize: 18, width: 28, textAlign: 'center' },
  infoLabel:       { fontSize: 11, color: C.muted },
  infoValue:       { fontSize: 15, color: C.text, fontWeight: '500', marginTop: 1 },
  input:           { backgroundColor: C.input, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border },
  row2:            { flexDirection: 'row', gap: 10 },
  bigBtn:          { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  bigBtnText:      { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  toggleBtn:       { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.input },
  toggleBtnActive: { borderColor: C.red, backgroundColor: C.red + '15' },
  toggleBtnActiveGreen: { borderColor: C.green, backgroundColor: C.green + '15' },
  toggleText:      { fontSize: 14, fontWeight: '600', color: C.muted },
  signOutBtn:      { marginHorizontal: 16, marginTop: 20, backgroundColor: C.red + '18', borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: C.red + '55' },
  signOutText:     { fontSize: 15, fontWeight: '700', color: C.red },
});
