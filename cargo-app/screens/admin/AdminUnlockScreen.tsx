import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { http } from '../../services/http';

interface UnlockRequest {
  _id: string;
  containerId: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt: string;
  driverId?: { name?: string; email?: string };
  biometricVerified?: boolean;
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function RequestCard({ req, onApprove, onDeny, loading }: {
  req: UnlockRequest;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  loading: boolean;
}) {
  const isPending = req.status === 'PENDING';
  const statusColor = req.status === 'APPROVED' ? C.green : req.status === 'DENIED' ? C.red : C.yellow;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeaderRow}>
        <View style={[styles.iconCircle, { backgroundColor: req.biometricVerified ? C.green + '22' : C.red + '22' }]}>
          <Text style={{ fontSize: 20 }}>{req.biometricVerified ? '🔐' : '⚠️'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName}>{req.driverId?.name ?? 'Unknown Driver'}</Text>
          <Text style={styles.metaText}>{req.containerId} · {timeAgo(req.createdAt)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>{req.status}</Text>
        </View>
      </View>

      {/* Biometric info */}
      <View style={styles.bioRow}>
        <Text style={styles.bioLabel}>Biometric</Text>
        <Text style={[styles.bioValue, { color: req.biometricVerified ? C.green : C.red }]}>
          {req.biometricVerified ? '✓ Verified' : '✗ Failed'}
        </Text>
      </View>

      {/* Action buttons — only for pending */}
      {isPending && (
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: C.green + '22', borderColor: C.green }]}
            onPress={() => onApprove(req._id)}
            disabled={loading}
          >
            <Text style={[styles.btnText, { color: C.green }]}>✓ Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: C.red + '15', borderColor: C.red }]}
            onPress={() => onDeny(req._id)}
            disabled={loading}
          >
            <Text style={[styles.btnText, { color: C.red }]}>✗ Deny</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function AdminUnlockScreen() {
  const [requests, setRequests] = useState<UnlockRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await http.get('/unlock/requests');
      setRequests(res.data.requests ?? []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  const handleAction = async (id: string, action: 'approve' | 'deny') => {
    setActionLoading(true);
    try {
      await http.post('/unlock/approve', {
        requestId: id,
        action: action === 'approve' ? 'APPROVE' : 'REJECT',
      });
      await fetchRequests();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error ?? e.message ?? 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const pending  = requests.filter(r => r.status === 'PENDING');
  const resolved = requests.filter(r => r.status !== 'PENDING');

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
    >
      <Text style={styles.pageTitle}>Container Unlock</Text>
      <Text style={styles.pageSubTitle}>All Unlock Requests ({requests.length})</Text>

      {loading ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
      ) : requests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📥</Text>
          <Text style={styles.emptyText}>No unlock requests</Text>
        </View>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>⏳ Pending ({pending.length})</Text>
              {pending.map(r => (
                <RequestCard key={r._id} req={r} onApprove={id => handleAction(id, 'approve')} onDeny={id => handleAction(id, 'deny')} loading={actionLoading} />
              ))}
            </>
          )}
          {resolved.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>History ({resolved.length})</Text>
              {resolved.map(r => (
                <RequestCard key={r._id} req={r} onApprove={id => handleAction(id, 'approve')} onDeny={id => handleAction(id, 'deny')} loading={actionLoading} />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  pageTitle:     { fontSize: 28, fontWeight: '800', color: C.text, marginTop: 56, paddingHorizontal: 20 },
  pageSubTitle:  { fontSize: 14, color: C.blue, paddingHorizontal: 20, marginBottom: 16, marginTop: 4, fontWeight: '500' },
  sectionLabel:  { fontSize: 14, color: C.muted, fontWeight: '600', paddingHorizontal: 20, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:          { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 16, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: C.border },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconCircle:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  driverName:    { fontSize: 16, fontWeight: '700', color: C.text },
  metaText:      { fontSize: 12, color: C.muted, marginTop: 2 },
  statusPill:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  bioRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  bioLabel:      { fontSize: 13, color: C.muted },
  bioValue:      { fontSize: 13, fontWeight: '600' },
  btnRow:        { flexDirection: 'row', gap: 10 },
  btn:           { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  btnText:       { fontSize: 14, fontWeight: '700' },
  empty:         { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText:     { fontSize: 16, color: C.muted },
});
