import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { http } from '../../services/http';
import { useAuth } from '../../context/AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────
interface VehicleStatus {
  containerId: string;
  engineStatus: 'RUNNING' | 'STOPPED';
  lockStatus: 'LOCKED' | 'UNLOCKED';
  lastLocation?: { lat: number; lng: number };
}

interface GpsLocation {
  containerId: string;
  driverName?: string;
  lat: number;
  lng: number;
  speed: number;
  anomalyStatus: string;
  insideGeofence: boolean;
}

interface Stats {
  running: number;
  stopped: number;
  pendingUnlocks: number;
  outsideGeofence: number;
}

// ─── Colors ─────────────────────────────────────────────────────────────────
const C = {
  bg:       '#111827',
  card:     '#1F2937',
  border:   '#374151',
  text:     '#F9FAFB',
  muted:    '#9CA3AF',
  accent:   '#F97316',
  blue:     '#3B82F6',
  green:    '#22C55E',
  red:      '#EF4444',
  yellow:   '#FBBF24',
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, color }: { label: string; value: number; Icon: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <Text style={[styles.statIcon]}>{Icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Vehicle Row ─────────────────────────────────────────────────────────────
function VehicleRow({ v }: { v: VehicleStatus }) {
  const isRunning = v.engineStatus === 'RUNNING';
  return (
    <View style={styles.vehicleRow}>
      <View style={[styles.dot, { backgroundColor: isRunning ? C.green : C.red }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.vehicleId}>{v.containerId}</Text>
        {v.lastLocation && (
          <Text style={styles.vehicleCoord}>
            {v.lastLocation.lat.toFixed(4)}, {v.lastLocation.lng.toFixed(4)}
          </Text>
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: isRunning ? C.green + '22' : C.red + '22', borderColor: isRunning ? C.green : C.red }]}>
        <Text style={[styles.statusText, { color: isRunning ? C.green : C.red }]}>{v.engineStatus}</Text>
      </View>
    </View>
  );
}

// ─── GPS Row ─────────────────────────────────────────────────────────────────
function GpsRow({ loc }: { loc: GpsLocation }) {
  const inZone = loc.insideGeofence;
  return (
    <View style={styles.vehicleRow}>
      <Text style={styles.pinIcon}>📍</Text>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.vehicleId}>{loc.driverName || loc.containerId}</Text>
        </View>
        <Text style={styles.vehicleCoord}>
          {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
        </Text>
        <Text style={[styles.vehicleCoord, { color: C.yellow }]}>{loc.speed} km/h</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: inZone ? C.green + '22' : C.red + '22', borderColor: inZone ? C.green : C.red }]}>
        <Text style={[styles.statusText, { color: inZone ? C.green : C.red }]}>{inZone ? 'IN ZONE' : 'BREACH'}</Text>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function AdminDashboardScreen() {
  const { driverName } = useAuth();
  const [vehicles, setVehicles]     = useState<VehicleStatus[]>([]);
  const [gpsLocs, setGpsLocs]       = useState<GpsLocation[]>([]);
  const [stats, setStats]           = useState<Stats>({ running: 0, stopped: 0, pendingUnlocks: 0, outsideGeofence: 0 });
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [vRes, gRes, uRes] = await Promise.allSettled([
        http.get('/immobilize/status/all'),
        http.get('/gps/all'),
        http.get('/unlock/requests'),
      ]);

      const vData: VehicleStatus[] = vRes.status === 'fulfilled' ? (vRes.value.data.vehicles ?? []) : [];
      const gData: GpsLocation[]   = gRes.status === 'fulfilled' ? (gRes.value.data.locations ?? [])  : [];
      const uData: any[]           = uRes.status === 'fulfilled' ? (uRes.value.data.requests ?? [])   : [];

      setVehicles(vData);
      setGpsLocs(gData);
      setStats({
        running:        vData.filter(v => v.engineStatus === 'RUNNING').length,
        stopped:        vData.filter(v => v.engineStatus === 'STOPPED').length,
        pendingUnlocks: uData.filter((u: any) => u.status === 'PENDING').length,
        outsideGeofence: gData.filter(g => !g.insideGeofence).length,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 8000); return () => clearInterval(t); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Iron Fist</Text>
          <Text style={styles.appSub}>Welcome, {driverName || 'Admin'}</Text>
        </View>
        <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Running"      value={stats.running}        Icon="🚛" color={C.green}  />
        <StatCard label="Stopped"      value={stats.stopped}        Icon="⚠️"  color={C.red}    />
        <StatCard label="Pending Unlocks" value={stats.pendingUnlocks} Icon="🔓" color={C.yellow} />
        <StatCard label="Outside Geofence" value={stats.outsideGeofence} Icon="📍" color={C.blue} />
      </View>

      {/* Vehicle Fleet */}
      <Text style={styles.sectionTitle}>Vehicle Fleet</Text>
      <View style={styles.card}>
        {vehicles.length === 0 ? (
          <Text style={styles.emptyText}>No vehicles found</Text>
        ) : (
          vehicles.map((v, i) => <VehicleRow key={v.containerId} v={v} />)
        )}
      </View>

      {/* Live GPS */}
      <Text style={styles.sectionTitle}>Live GPS</Text>
      <View style={styles.card}>
        {gpsLocs.length === 0 ? (
          <Text style={styles.emptyText}>No GPS data</Text>
        ) : (
          gpsLocs.map((loc, i) => <GpsRow key={`${loc.containerId}-${i}`} loc={loc} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  center:     { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  appTitle:   { fontSize: 28, fontWeight: '700', color: C.text },
  appSub:     { fontSize: 14, color: C.muted, marginTop: 2 },
  adminBadge: { backgroundColor: C.accent + '22', borderWidth: 1, borderColor: C.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  adminBadgeText: { color: C.accent, fontSize: 12, fontWeight: '700' },
  statsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginBottom: 20 },
  statCard:   { flex: 1, minWidth: '44%', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, padding: 18, alignItems: 'center', gap: 4 },
  statIcon:   { fontSize: 28 },
  statValue:  { fontSize: 32, fontWeight: '800', marginTop: 4 },
  statLabel:  { fontSize: 12, color: C.muted, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 10, marginTop: 4 },
  card:       { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: C.border },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  dot:        { width: 9, height: 9, borderRadius: 5 },
  pinIcon:    { fontSize: 18 },
  vehicleId:  { fontSize: 15, fontWeight: '600', color: C.text },
  vehicleCoord: { fontSize: 12, color: C.muted, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyText:  { color: C.muted, textAlign: 'center', padding: 24, fontSize: 14 },
});
