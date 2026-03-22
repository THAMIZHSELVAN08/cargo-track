import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { AlertTriangle, MapPin, Activity, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

/* ─────────────────────────────────────────────────────────────
   Same design token set as Dashboard / Login
   White / off-white · Black ink · Warm borders
   Danger = #C93535 · Amber = #B8720F · Success = #1A7A52
   Playfair Display · Geist Mono · Geist
───────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Geist:wght@300;400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');

  .ap-root {
    --paper:          #FFFFFF;
    --surface:        #F8F7F4;
    --hover-fill:     #F3F2EF;
    --border:         #E2E1DE;
    --border-strong:  #C8C7C4;

    --ink-1:  #0D0D0D;
    --ink-2:  #3A3A3A;
    --ink-3:  #888888;
    --ink-4:  #C0BFBC;

    --danger:        #C93535;
    --danger-bg:     #FDF2F2;
    --danger-border: #F0CACA;
    --danger-text:   #9B1C1C;

    --amber:        #B8720F;
    --amber-bg:     #FEFBF2;
    --amber-border: #EDD9A3;

    --success:        #1A7A52;
    --success-bg:     #F2FAF6;
    --success-border: #A8D9C0;

    --f-display: 'Playfair Display', Georgia, serif;
    --f-mono:    'Geist Mono', monospace;
    --f-ui:      'Geist', system-ui, sans-serif;
  }

  .ap-root * { box-sizing: border-box; }

  /* Scrollbar */
  .ap-scroll::-webkit-scrollbar       { width: 3px; }
  .ap-scroll::-webkit-scrollbar-track { background: transparent; }
  .ap-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* Alert row */
  .ap-row {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    background: var(--paper);
    margin-bottom: 8px;
    transition: border-color 0.15s, box-shadow 0.15s;
    cursor: default;
    position: relative;
  }
  .ap-row:hover {
    border-color: var(--border-strong);
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  .ap-row:last-child { margin-bottom: 0; }

  /* Severity left bar */
  .ap-row::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
  }
  .ap-row.danger::before  { background: var(--danger); }
  .ap-row.amber::before   { background: var(--amber);  }

  /* Icon box */
  .ap-icon-box {
    width: 34px; height: 34px; flex-shrink: 0;
    border: 1px solid var(--border);
    background: var(--surface);
    display: flex; align-items: center; justify-content: center;
  }

  /* Chip */
  .ap-chip {
    display: inline-flex; align-items: center;
    padding: 1px 7px;
    font-family: var(--f-mono);
    font-size: 9.5px; font-weight: 500;
    letter-spacing: 0.06em;
    border: 1px solid;
    white-space: nowrap;
  }

  /* Active threat badge */
  .ap-threat-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px;
    background: var(--danger);
    color: #FFFFFF;
    font-family: var(--f-mono);
    font-size: 9px; font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  @keyframes ap-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
  .ap-pulse { animation: ap-pulse 2.2s ease-in-out infinite; }
`;

export default function AlertsPanel({ fullHeight = false }) {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/logs?outcome=WARNING&limit=15');
      setAlerts(res.data.logs || []);
    } catch {
      setAlerts([
        { _id: 'a1', eventType: 'GEOFENCE_BREACH',  containerId: 'C-109X', details: { reason: 'Vehicle 500m outside boundary'    }, createdAt: new Date(Date.now() - 1000 * 60 * 2)  },
        { _id: 'a2', eventType: 'ANOMALY_DETECTED', containerId: 'C-38Z9', details: { reason: 'Long stop detected on highway'      }, createdAt: new Date(Date.now() - 1000 * 60 * 45) },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type) => {
    const color = type === 'ANOMALY_DETECTED' ? 'var(--danger)' : 'var(--amber)';
    if (type === 'GEOFENCE_BREACH')  return <MapPin    size={15} color={color} />;
    if (type === 'ANOMALY_DETECTED') return <Activity  size={15} color={color} />;
    return                                  <ShieldAlert size={15} color={color} />;
  };

  const rowClass = (type) =>
    type === 'ANOMALY_DETECTED' ? 'ap-row danger' : 'ap-row amber';

  const chipStyle = (type) =>
    type === 'ANOMALY_DETECTED'
      ? { background: 'var(--danger-bg)', color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }
      : { background: 'var(--amber-bg)',  color: 'var(--amber)',        borderColor: 'var(--amber-border)'  };

  return (
    <>
      <style>{STYLES}</style>

      <div
        className="ap-root"
        style={{
          width: '100%',
          height: fullHeight ? '100%' : '100%',
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          fontFamily: 'var(--f-ui)',
        }}
      >
        {/* ── Header — same structure as original ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border)',
            background: alerts.length > 0 ? 'var(--danger-bg)' : 'var(--paper)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--f-display)',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 16,
              color: 'var(--ink-1)',
              display: 'flex', alignItems: 'center', gap: 9,
            }}
          >
            <AlertTriangle
              size={15}
              color={alerts.length > 0 ? 'var(--danger)' : 'var(--ink-3)'}
              className={alerts.length > 0 ? 'ap-pulse' : ''}
            />
            Critical Alerts
          </h2>

          {alerts.length > 0 && (
            <span className="ap-threat-badge ap-pulse">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFFFFF', flexShrink: 0 }} />
              Active Threat
            </span>
          )}
        </div>

        {/* ── Body — same conditional structure ── */}
        <div
          className="ap-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: 14 }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%',
                fontFamily: 'var(--f-mono)', fontSize: 11,
                color: 'var(--ink-4)', letterSpacing: '0.08em',
              }}
              className="ap-pulse"
            >
              Scanning surveillance grid…
            </div>
          ) : alerts.length === 0 ? (
            <div
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: 10, opacity: 0.5,
              }}
            >
              <ShieldAlert size={36} color="var(--success)" />
              <p style={{ fontFamily: 'var(--f-ui)', fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '0.02em' }}>
                System secure. No threats detected.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {alerts.map((alert) => (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={rowClass(alert.eventType)}
                >
                  {/* Icon box */}
                  <div className="ap-icon-box">
                    {getIcon(alert.eventType)}
                  </div>

                  {/* Content — identical data fields as original */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                      <h3
                        style={{
                          fontFamily: 'var(--f-ui)',
                          fontWeight: 700, fontSize: 12.5,
                          color: 'var(--ink-1)',
                          letterSpacing: '0.01em',
                          lineHeight: 1.2,
                        }}
                      >
                        {alert.eventType === 'GEOFENCE_BREACH' ? 'Geofence Breach' : 'AI Anomaly Detected'}
                      </h3>
                      <span
                        style={{
                          fontFamily: 'var(--f-mono)',
                          fontSize: 9.5,
                          color: 'var(--ink-4)',
                          whiteSpace: 'nowrap',
                          marginLeft: 10,
                          flexShrink: 0,
                        }}
                      >
                        {formatDistanceToNow(new Date(alert.createdAt))} ago
                      </span>
                    </div>

                    {/* Container ID chip */}
                    <span className="ap-chip" style={chipStyle(alert.eventType)}>
                      {alert.containerId}
                    </span>

                    {/* Reason */}
                    <p
                      style={{
                        fontFamily: 'var(--f-ui)',
                        fontSize: 12, color: 'var(--ink-3)',
                        marginTop: 5, lineHeight: 1.5,
                      }}
                    >
                      {alert.details?.reason || alert.details?.error || 'Unknown system warning'}
                    </p>
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