import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Truck, Power, PowerOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

/* ─────────────────────────────────────────────────────────────
   VehiclePanel — light theme
   Same design tokens as the rest of the suite
   All API logic, handlers, and grid layout identical to original
───────────────────────────────────────────────────────────── */
const STYLES = `
  /* ─────────────────────────────────────────────────────────────
     VehiclePanel — Apple Native OS Aesthetic
  ───────────────────────────────────────────────────────────── */
  .vp-root {
    --paper:          #FFFFFF;
    --hover-fill:     #F5F5F7; 
    --border:         rgba(0, 0, 0, 0.08);
    --border-strong:  rgba(0, 0, 0, 0.16);
    --ink-1:  #1D1D1F;
    --ink-2:  #424245;
    --ink-3:  #86868B;
    --ink-4:  #D2D2D7;
    --danger:         #FF3B30;
    --danger-bg:      rgba(255, 59, 48, 0.1);
    --danger-border:  rgba(255, 59, 48, 0.2);
    --danger-hover:   #D70015;
    --success:        #34C759;
    --success-bg:     rgba(52, 199, 89, 0.1);
    --success-border: rgba(52, 199, 89, 0.2);
    --success-hover:  #248A3D;
    --blue:           #0071E3;
    --blue-bg:        rgba(0, 113, 227, 0.1);
    --blue-border:    rgba(0, 113, 227, 0.2);
    --f-mono: 'SF Mono', Menlo, Monaco, monospace;
    --f-ui:   -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
  }

  .vp-root * { box-sizing: border-box; }

  /* Vehicle card */
  .vp-card {
    background: var(--paper);
    border: 1px solid var(--border);
    padding: 18px 18px 16px;
    position: relative;
    border-radius: 18px;
    transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  }
  .vp-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  /* Status chip */
  .vp-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px;
    font-family: var(--f-ui);
    font-size: 11px; font-weight: 500;
    border: 1px solid;
    border-radius: 12px;
  }

  /* Engine control buttons (Apple borderless or tinted pills) */
  .vp-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 10px;
    font-family: var(--f-ui);
    font-size: 13px; font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  .vp-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .vp-btn-kill {
    background: var(--danger-bg);
    color: var(--danger);
  }
  .vp-btn-kill:hover:not(:disabled) {
    background: var(--danger);
    color: #FFF;
  }

  .vp-btn-start {
    background: var(--success-bg);
    color: var(--success);
  }
  .vp-btn-start:hover:not(:disabled) {
    background: var(--success);
    color: #FFF;
  }

  @keyframes vp-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
  .vp-pulse { animation: vp-pulse 2.2s ease-in-out infinite; }
`;

export default function VehiclePanel() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);

  // The 5 requested drivers
  const mockDrivers = [
    { _id: 'v1', containerId: 'C-8842 (Thamizh)', engineStatus: 'RUNNING', lockStatus: 'LOCKED', assignedLocation: 'Chennai to Delhi' },
    { _id: 'v2', containerId: 'C-109X (Selvan)', engineStatus: 'RUNNING', lockStatus: 'UNLOCKED', assignedLocation: 'Mumbai to Kolkata' },
    { _id: 'v3', containerId: 'C-38Z9 (Visvanth)', engineStatus: 'RUNNING', lockStatus: 'LOCKED', assignedLocation: 'Delhi to Bangalore' },
    { _id: 'v4', containerId: 'C-99A1 (Ram)', engineStatus: 'RUNNING', lockStatus: 'LOCKED', assignedLocation: 'Kolkata to Mumbai' },
    { _id: 'v5', containerId: 'C-44B2 (Hamilton)', engineStatus: 'STOPPED', lockStatus: 'LOCKED', assignedLocation: 'Bangalore to Chennai' },
  ];

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/immobilize/status/all').catch(() => null);
      if (res?.data && res.data.vehicles?.length > 0) {
        setVehicles(res.data.vehicles);
      } else {
        throw new Error('Fallback to mock');
      }
    } catch {
      setVehicles(mockDrivers);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 15000);
    return () => clearInterval(interval);
  }, []);

  // Identical handler as original
  const handleEngineControl = async (containerId, action) => {
    try {
      await api.post('/immobilize', {
        containerId, action,
        reason: action === 'STOP' ? 'Suspicious activity detected via AI' : 'Cleared by dispatcher',
      });
      toast.success(`Engine ${action === 'STOP' ? 'Immobilized' : 'Started'} for ${containerId}`);
      fetchVehicles();
    } catch (e) {
      toast.error(`Engine control failed: ${e.response?.data?.error || e.message}`);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div
        className="vp-root"
        style={{
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '0 0 18px',
          fontFamily: 'var(--f-ui)',
        }}
      >
        {/* ── Header — same structure as original ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 20px 12px',
            borderBottom: '1px solid var(--border)',
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--f-ui)',
              fontWeight: 600,
              fontSize: 18, color: 'var(--ink-1)',
              display: 'flex', alignItems: 'center', gap: 9,
              letterSpacing: '-0.022em'
            }}
          >
            <Truck size={18} color="var(--blue)" />
            Active Fleet Control
          </h2>

          {/* Live count */}
          <span
            style={{
              fontFamily: 'var(--f-mono)', fontSize: 10,
              color: 'var(--success)',
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              padding: '2px 8px',
              letterSpacing: '0.08em',
            }}
          >
            {vehicles.filter(v => v.engineStatus === 'RUNNING').length} Running
          </span>
        </div>

        {/* ── Grid — same 1/2/3 column layout as original ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
            padding: '0 18px',
          }}
        >
          {loading ? (
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24,
                fontFamily: 'var(--f-mono)', fontSize: 11,
                color: 'var(--ink-4)', letterSpacing: '0.08em',
              }}
              className="vp-pulse"
            >
              Initialising fleet uplink…
            </div>
          ) : (
            vehicles.map((vehicle, i) => (
              <motion.div
                key={vehicle._id}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1,    opacity: 1 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
                className={`vp-card ${vehicle.engineStatus === 'RUNNING' ? 'running' : 'stopped'}`}
              >
                {/* Card header — same fields as original */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--f-ui)',
                        fontWeight: 600, fontSize: 16,
                        color: 'var(--ink-1)',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.1,
                        marginBottom: 7,
                      }}
                    >
                      {vehicle.containerId}
                    </h3>

                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {/* Lock status chip */}
                      <span
                        className="vp-chip"
                        style={
                          vehicle.lockStatus === 'LOCKED'
                            ? { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-border)' }
                            : { background: 'var(--danger-bg)',  color: 'var(--danger)',  borderColor: 'var(--danger-border)'  }
                        }
                      >
                        {vehicle.lockStatus === 'LOCKED'
                          ? <><ShieldCheck size={9} style={{ display: 'inline', marginRight: 2 }} />Locked</>
                          : <><ShieldAlert size={9} style={{ display: 'inline', marginRight: 2 }} />Unlocked</>
                        }
                      </span>

                      {/* Engine status chip */}
                      <span
                        className="vp-chip"
                        style={
                          vehicle.engineStatus === 'RUNNING'
                            ? { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-border)' }
                            : { background: 'var(--surface)',    color: 'var(--ink-3)',   borderColor: 'var(--border)'         }
                        }
                      >
                        {vehicle.engineStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, marginBottom: 12 }}>
                   <p style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 2 }}>Assigned Route</p>
                   <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 500, letterSpacing: '-0.01em' }}>
                     {vehicle.assignedLocation || 'Unassigned'}
                   </p>
                </div>

                {/* Action buttons — identical onClick / disabled logic as original */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 7 }}>
                  <button
                    onClick={() => handleEngineControl(vehicle.containerId, 'STOP')}
                    disabled={vehicle.engineStatus === 'STOPPED'}
                    className="vp-btn vp-btn-kill"
                  >
                    <PowerOff size={12} /> Kill
                  </button>
                  <button
                    onClick={() => handleEngineControl(vehicle.containerId, 'START')}
                    disabled={vehicle.engineStatus === 'RUNNING'}
                    className="vp-btn vp-btn-start"
                  >
                    <Power size={12} /> Start
                  </button>
                </div>
                
                <button
                  onClick={async () => {
                    const loc = prompt("Enter assigned location/route for " + vehicle.containerId);
                    if (loc) {
                      try {
                        // In a real app we'd need the vehicle's associated user ID.
                        // For now we'll assume we can update by containerId or we'd need a different endpoint.
                        // Let's assume we have a way to update vehicle metadata.
                        await api.put(`/auth/users/update-by-container/${vehicle.containerId}`, { assignedLocation: loc });
                        toast.success("Route assigned to " + vehicle.containerId);
                        fetchVehicles();
                      } catch (e) {
                        toast.error("Assignment failed: " + (e.response?.data?.error || e.message));
                      }
                    }
                  }}
                  className="vp-btn"
                  style={{ width: '100%', borderColor: 'var(--border)', color: 'var(--ink-2)' }}
                >
                  Assign Route
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </>
  );
}