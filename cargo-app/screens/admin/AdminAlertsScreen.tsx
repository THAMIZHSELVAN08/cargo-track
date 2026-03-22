import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { http } from '../../services/http';

interface EventLog {
  _id: string;
  eventType: string;
  outcome: string;
  details?: Record<string, any>;
  createdAt: string;
  containerId?: string;
  user?: { name?: string };
}

const C = {
  bg:     '#111827',
  card:   '#1F2937',
  border: '#374151',
  text:   '#F9FAFB',
  muted:  '#9CA3AF',
  accent: '#F97316',
  green:  '#22C55E',
  red:    '#EF4444',
  yellow: '#FBBF24',
  blue:   '#3B82F6',
};

const EVENT_COLORS: Record<string, string> = {
  LOGIN: C.green,
  LOGOUT: C.muted,
  GPS_UPDATE: C.blue,
  ANOMALY_DETECTED: C.red,
  GEOFENCE_BREACH: C.yellow,
  TAMPER_DETECTED: C.red,
  GPS_JAMMING_SUSPECTED: C.yellow,
  IMMOBILIZE: C.red,
  RESTORE: C.green,
  UNLOCK_REQUEST: C.accent,
  UNLOCK_APPROVED: C.green,
  UNLOCK_DENIED: C.red,
};

const EVENT_ICONS: Record<string, string> = {
  LOGIN: '→',
  LOGOUT: '←',
  GPS_UPDATE: '📍',
  ANOMALY_DETECTED: '⚠',
  GEOFENCE_BREACH: '🚧',
  TAMPER_DETECTED: '🚨',
  GPS_JAMMING_SUSPECTED: '📡',
  IMMOBILIZE: '⚡',
  RESTORE: '✓',
  UNLOCK_REQUEST: '🔓',
  UNLOCK_APPROVED: '✓',
  UNLOCK_DENIED: '✗',
};

const FILTER_TABS = ['All', 'Alert', 'Unlock', 'Immobilization', 'GPS'];

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function matchesFilter(ev: EventLog, filter: string): boolean {
  if (filter === 'All') return true;
  if (filter === 'Alert') return ['ANOMALY_DETECTED', 'GEOFENCE_BREACH', 'TAMPER_DETECTED', 'GPS_JAMMING_SUSPECTED'].includes(ev.eventType);
  if (filter === 'Unlock') return ev.eventType.includes('UNLOCK');
  if (filter === 'Immobilization') return ['IMMOBILIZE', 'RESTORE'].includes(ev.eventType);
  if (filter === 'GPS') return ['GPS_UPDATE', 'GPS_JAMMING_SUSPECTED'].includes(ev.eventType);
  return true;
}

function EventRow({ ev }: { ev: EventLog }) {
  const color = EVENT_COLORS[ev.eventType] ?? C.muted;
  const icon  = EVENT_ICONS[ev.eventType] ?? '·';
  const title = ev.user?.name
    ? `User ${ev.user.name} ${ev.eventType.toLowerCase().replace(/_/g, ' ')}`
    : ev.eventType.replace(/_/g, ' ');

  return (
    <View style={styles.eventRow}>
      <View style={[styles.eventIcon, { backgroundColor: color + '22' }]}>
        <Text style={[styles.eventIconText, { color }]}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eventType, { color }]}>{ev.eventType}</Text>
        <Text style={styles.eventTitle}>{title}</Text>
        <Text style={styles.eventDate}>{formatDate(ev.createdAt)}</Text>
      </View>
      <Text style={styles.eventTime}>{formatTime(ev.createdAt)}</Text>
    </View>
  );
}

export default function AdminAlertsScreen() {
  const [events, setEvents]     = useState<EventLog[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]     = useState('All');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await http.get('/logs?limit=100');
      setEvents(res.data.logs ?? res.data.events ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchEvents(); };

  const filtered = events.filter(e => matchesFilter(e, filter));

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Event Logs</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Text style={{ color: C.muted, fontSize: 18 }}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={[styles.tab, filter === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events */}
      {loading ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={styles.emptyText}>No events found</Text>
            </View>
          ) : (
            filtered.map(ev => <EventRow key={ev._id} ev={ev} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  pageTitle:     { fontSize: 28, fontWeight: '800', color: C.text },
  refreshBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  tabBar:        { maxHeight: 52, marginBottom: 8 },
  tab:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  tabActive:     { backgroundColor: C.accent + '22', borderColor: C.accent },
  tabText:       { fontSize: 13, color: C.muted, fontWeight: '500' },
  tabTextActive: { color: C.accent, fontWeight: '700' },
  eventRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  eventIcon:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eventIconText: { fontSize: 16, fontWeight: '700' },
  eventType:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle:    { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 2 },
  eventDate:     { fontSize: 12, color: C.muted, marginTop: 2 },
  eventTime:     { fontSize: 12, color: C.muted, flexShrink: 0 },
  empty:         { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText:     { fontSize: 16, color: C.muted },
});
