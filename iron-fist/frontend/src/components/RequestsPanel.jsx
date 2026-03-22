import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { KeyRound, CheckCircle, XCircle, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const STYLES = `
  /* ─────────────────────────────────────────────────────────────
     RequestsPanel — Apple Light Native OS Aesthetic
     Clean glassmorphic list, round avatars, and sleek buttons.
  ───────────────────────────────────────────────────────────── */
  .rp-root {
    --border: rgba(0, 0, 0, 0.08);
    --border-strong: rgba(0, 0, 0, 0.16);
    --paper: rgba(255, 255, 255, 0.72);
    --f-mono: 'SF Mono', Menlo, Monaco, Consolas, monospace;
    --f-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .rp-scroll::-webkit-scrollbar       { width: 6px; }
  .rp-scroll::-webkit-scrollbar-track { background: transparent; }
  .rp-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }

  /* Request card (iOS notification style) */
  .rp-card {
    padding: 16px;
    background: #FFFFFF;
    border: 1px solid var(--border);
    border-radius: 18px;
    margin-bottom: 12px;
    transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  }
  @media (min-width: 480px) {
    .rp-card { flex-direction: row; align-items: center; justify-content: space-between; }
  }
  .rp-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
  .rp-card:last-child { margin-bottom: 0; }

  /* Avatar / Icon Left */
  .rp-avatar {
    width: 40px; height: 40px;
    border-radius: 50%;
    background: #F5F5F7;
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* Info Block */
  .rp-info {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column; gap: 4px;
  }
  .rp-title {
    font-family: var(--f-ui);
    font-size: 15px; font-weight: 600; color: #1D1D1F;
    letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .rp-meta {
    font-family: var(--f-ui);
    font-size: 13px; color: #86868B;
  }

  /* Chip */
  .rp-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px;
    font-family: var(--f-ui);
    font-size: 11px; font-weight: 600;
    border-radius: 12px;
    border: 1px solid;
    margin-left: 8px;
  }

  /* Action buttons (iOS Pills) */
  .rp-actions {
    display: flex; gap: 8px; flex-shrink: 0;
  }
  .rp-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 16px;
    font-family: var(--f-ui);
    font-size: 14px; font-weight: 500;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    border: none;
  }
  .rp-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Solid call to action (Apple Blue / Green) */
  .rp-btn-approve {
    background: #0071E3;
    color: #FFFFFF;
  }
  .rp-btn-approve:hover:not(:disabled) {
    background: #0077ED;
    transform: scale(1.02);
  }

  /* Outline secondary (Apple Gray / Destructive Red) */
  .rp-btn-deny {
    background: #F5F5F7;
    color: #FF3B30;
  }
  .rp-btn-deny:hover:not(:disabled) {
    background: #E8E8ED;
  }

  /* Count badge */
  .rp-count {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 4px 10px;
    background: rgba(0, 113, 227, 0.1);
    color: #0071E3;
    border-radius: 12px;
    font-family: var(--f-ui);
    font-size: 12px; font-weight: 500;
  }

  @keyframes rp-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .rp-pulse { animation: rp-pulse 2.2s ease-in-out infinite; }
`;

export default function RequestsPanel({ fullHeight = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { user }                = useAuth();

  const fetchRequests = async () => {
    try {
      const res = await api.get('/unlock/requests?status=PENDING');
      setRequests(res.data.requests || []);
    } catch {
      setRequests([
        { _id: 'mock-req-1', containerId: 'C-8842', driverId: { name: 'Alex T.' }, biometricVerified: true,  createdAt: new Date(Date.now() - 1000 * 60 * 5) },
        { _id: 'mock-req-2', containerId: 'C-109X', driverId: { name: 'Sara M.' }, biometricVerified: false, createdAt: new Date(Date.now() - 1000 * 60 * 12) },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (requestId, action) => {
    try {
      await api.post('/unlock/approve', {
        requestId, action,
        notes: action === 'APPROVE' ? 'Verified by dispatch' : 'Rejected manually',
      });
      toast.success(`Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} Successfully`);
      fetchRequests();
    } catch (e) {
      toast.error(`Action failed: ${e.response?.data?.error || e.message}`);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div
        className="rp-root panel"
        style={{
          width: '100%',
          height: fullHeight ? '100%' : '100%',
          display: 'flex', flexDirection: 'column',
          border: '1px solid var(--border)',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'transparent',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--f-ui)',
              fontWeight: 600,
              fontSize: 18, color: '#1D1D1F',
              display: 'flex', alignItems: 'center', gap: 10,
              letterSpacing: '-0.022em'
            }}
          >
            <KeyRound size={18} color="#0071E3" />
            Pending Authorizations
          </h2>

          <span className="rp-count">
            {requests.length} Request{requests.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Body ── */}
        <div
          className="rp-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%',
                fontFamily: "var(--f-mono)", fontSize: 13,
                color: '#86868B',
              }}
              className="rp-pulse"
            >
              Scanning secure channels…
            </div>
          ) : requests.length === 0 ? (
            <div
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: 12, opacity: 0.6,
              }}
            >
              <KeyRound size={40} color="#86868B" />
              <p style={{ fontFamily: "var(--f-ui)", fontSize: 14, color: '#86868B', fontWeight: 500 }}>
                No pending unlock requests.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {requests.map((req) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                  transition={{ duration: 0.3 }}
                  className="rp-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    {/* Team Invitation style Avatar */}
                    <div className="rp-avatar">
                      <Fingerprint size={20} color={req.biometricVerified ? '#10B981' : '#EF4444'} />
                    </div>

                    <div className="rp-info">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="rp-title">{req.driverId?.name || 'Unknown Driver'}</span>
                        <span
                          className="rp-chip"
                          style={
                            req.biometricVerified
                              ? { background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.2)' }
                              : { background: 'rgba(239, 68, 68, 0.1)',  color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)' }
                          }
                        >
                          {req.biometricVerified ? 'Bio OK' : 'Bio Fail'}
                        </span>
                      </div>
                      <div className="rp-meta">
                        Req: <span style={{ fontFamily: "var(--f-mono)", color: '#0071E3' }}>{req.containerId}</span> • {formatDistanceToNow(new Date(req.createdAt))} ago
                      </div>
                    </div>
                  </div>

                  {/* Action buttons styled as pills */}
                  <div className="rp-actions">
                    <button
                      onClick={() => handleAction(req._id, 'REJECT')}
                      className="rp-btn rp-btn-deny"
                    >
                      Refuse
                    </button>
                    <button
                      onClick={() => handleAction(req._id, 'APPROVE')}
                      disabled={!req.biometricVerified}
                      className="rp-btn rp-btn-approve"
                    >
                      Authorize
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}