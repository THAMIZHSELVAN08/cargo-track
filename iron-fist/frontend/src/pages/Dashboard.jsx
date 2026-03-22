  import React, { useState, useEffect } from 'react';
  import { useAuth } from '../context/AuthContext';
  import api from '../services/api';
  import { Shield, Fingerprint, LogOut, Radio, Activity, LayoutDashboard, KeyRound, AlertTriangle } from 'lucide-react';
  import { motion } from 'framer-motion';

  // Subcomponents — unchanged
  import MapPanel from '../components/MapPanel';
  import RequestsPanel from '../components/RequestsPanel';
  import AlertsPanel from '../components/AlertsPanel';
  import VehiclePanel from '../components/VehiclePanel';
  import AddDriverModal from '../components/AddDriverModal';

  /* ─────────────────────────────────────────────────────────────
    DESIGN SYSTEM  —  Apple Human Interface Guidelines
    ─────────────────────────────────────────────────────────────
    Philosophy : Content is king. Translucency creates depth. 
                  Typography is structured, clean, and invisible.

    Display    : SF Pro Display
    Numbers    : SF Mono
    Body / UI  : SF Pro Text
    ─────────────────────────────────────────────────────────────
  ─────────────────────────────────────────────────────────────── */

  const GLOBAL_STYLES = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      /* ── Surfaces (Apple Light Theme) ── */
      --surface:        #F5F5F7;
      --paper:          rgba(255, 255, 255, 0.72);
      --paper-raised:   rgba(255, 255, 255, 0.9);
      --hover-fill:     rgba(0, 0, 0, 0.04); 
      --active-fill:    rgba(0, 0, 0, 0.08);

      /* ── Ink / Typography ── */
      --ink-1:          #1D1D1F;
      --ink-2:          #424245;
      --ink-3:          #86868B;
      --ink-4:          #D2D2D7;
      --ink-5:          #F5F5F7;

      /* ── Borders ── */
      --border:         rgba(0, 0, 0, 0.08);
      --border-strong:  rgba(0, 0, 0, 0.16);
      --border-focus:   #0071E3; 

      /* ── Semantic colours (Apple native) ── */
      --danger:         #FF3B30;
      --danger-bg:      rgba(255, 59, 48, 0.1);
      --danger-border:  rgba(255, 59, 48, 0.2);

      --amber:          #FF9500;
      --amber-bg:       rgba(255, 149, 0, 0.1);
      --amber-border:   rgba(255, 149, 0, 0.2);

      --success:        #34C759;
      --success-bg:     rgba(52, 199, 89, 0.1);
      --success-border: rgba(52, 199, 89, 0.2);

      --blue:           #0071E3;
      --blue-bg:        rgba(0, 113, 227, 0.1);
      --blue-border:    rgba(0, 113, 227, 0.2);

      /* ── Font stacks ── */
      --f-display:  -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
      --f-mono:     "SF Mono", "Menlo", "Monaco", "Courier New", monospace;
      --f-ui:       -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    html, body { height: 100%; }

    body {
      background: var(--surface);
      color: var(--ink-1);
      font-family: var(--f-ui);
      font-size: 14px;
      line-height: 1.47059;
      font-weight: 400;
      letter-spacing: -0.022em;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ── Font helpers ── */
    .f-display { font-family: var(--f-display); letter-spacing: -0.003em; }
    .f-mono    { font-family: var(--f-mono);    }
    .f-ui      { font-family: var(--f-ui);      }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar       { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }

    /* ── Panel / card (Apple Glassmorphism) ── */
    .panel {
      background: var(--paper);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border: 1px solid var(--border);
      border-radius: 18px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
    }

    /* ── Sidebar panel ── */
    .sidebar-panel {
      background: rgba(245, 245, 247, 0.8);
      backdrop-filter: saturate(180%) blur(30px);
      -webkit-backdrop-filter: saturate(180%) blur(30px);
      border-right: 1px solid var(--border);
    }

    /* ── Header panel ── */
    .header-panel {
      background: rgba(255, 255, 255, 0.72);
      border-bottom: 1px solid var(--border);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
    }

    /* ── Nav button ── */
    .nav-item {
      position: relative;
      display: flex; align-items: center;
      width: 100%; padding: 8px 12px;
      border: 1px solid transparent;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      font-family: var(--f-ui);
      font-size: 14px; font-weight: 500;
      color: var(--ink-1);
      text-align: left;
      transition: all 0.2s ease;
      gap: 12px;
      overflow: hidden;
    }
    .nav-item:hover {
      background: var(--hover-fill);
    }
    .nav-item.active {
      background: var(--hover-fill);
      color: var(--blue);
    }
    .nav-item.active .nav-icon { color: var(--blue); }

    /* ── Stat card ── */
    .stat-card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      position: relative; overflow: hidden;
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    }
    .stat-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
    .stat-card .accent-line {
      display: none; /* No colored bottom lines in Apple design */
    }

    /* ── Label micro-text ── */
    .label {
      font-family: var(--f-ui);
      font-size: 12px; font-weight: 600;
      color: var(--ink-3);
    }

    /* ── Status badge ── */
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; padding: 0 6px;
      font-family: var(--f-ui); font-size: 12px; font-weight: 600;
      border-radius: 10px;
    }

    /* ── Table rows ── */
    .trow {
      display: grid; align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    .trow:hover { background: rgba(0,0,0,0.02); }
    .trow:last-child { border-bottom: none; }

    /* ── Thin divider ── */
    .divider { border: none; border-top: 1px solid var(--border); }

    /* ── Focus ring ── */
    button:focus-visible {
      outline: 4px solid rgba(0, 113, 227, 0.3);
      outline-offset: 1px;
    }
  `;

  export default function Dashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Aceternity sidebar state
    const [stats, setStats] = useState({ requests: 2, registeredDrivers: 5, activeVehicles: 4 });

    const fetchStats = async () => {
      try {
        const [reqsRes, usersRes, gpsRes] = await Promise.all([
          api.get('/unlock/requests?status=PENDING').catch(() => ({ data: { total: 0 } })),
          api.get('/auth/users').catch(() => ({ data: { users: [] } })),
          api.get('/gps/all').catch(() => ({ data: { locations: [] } }))
        ]);
        
        const drivers = usersRes.data.users ? usersRes.data.users.filter(u => u.role === 'driver') : [];
        
        setStats({
          requests:       reqsRes.data.total           || 0,
          registeredDrivers: drivers.length,
          activeVehicles: gpsRes.data.locations?.length || 0,
        });
      } catch (err) {
        console.warn('Dashboard fetch stats failed, using fallback:', err);
        setStats({ requests: 2, registeredDrivers: 5, activeVehicles: 4 });
      }
    };

    useEffect(() => {
      fetchStats();
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }, []);

    const containerVariants = {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
    };

    return (
      <>
        <style>{GLOBAL_STYLES}</style>

        <div
          style={{
            minHeight: '100vh',
            background: 'var(--surface)',
            color: 'var(--ink-1)',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* ══════════════════════════════════════
              SIDEBAR  —  Aceternity Expand/Collapse Style
          ══════════════════════════════════════ */}
          <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1, width: isSidebarOpen ? 260 : 70 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="sidebar-panel"
            style={{
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '0',
              zIndex: 30,
              overflow: 'hidden',
            }}
            onMouseEnter={() => setIsSidebarOpen(true)}
            onMouseLeave={() => setIsSidebarOpen(false)}
          >
            <div>
              {/* ── Logo ── */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '22px 18px 20px',
                  borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    width: 34, height: 34, flexShrink: 0,
                    background: 'var(--ink-1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6,
                  }}
                >
                  <Shield size={17} color="#FFFFFF" />
                </div>
                <div>
                  {/* Playfair gives this gravitas without screaming */}
                  <span
                    style={{
                      fontFamily: 'var(--f-display)',
                      fontWeight: 700,
                      fontSize: 17,
                      letterSpacing: '0.03em',
                      color: 'var(--ink-1)',
                      display: 'block',
                      lineHeight: 1.1,
                    }}
                  >
                    Iron Fist
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 9,
                      color: 'var(--ink-3)',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginTop: 2,
                    }}
                  >
                    Command
                  </span>
                </div>
              </div>

              {/* ── Section label ── */}
              <motion.div 
                style={{ padding: '18px 16px 8px', whiteSpace: 'nowrap' }}
                animate={{ opacity: isSidebarOpen ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="label">Navigation</span>
              </motion.div>

              {/* ── Nav ── */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 8px' }}>
                <NavItem
                  icon={<LayoutDashboard size={16} />}
                  label="Command Center"
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  isSidebarOpen={isSidebarOpen}
                />
                <NavItem
                  icon={<KeyRound size={16} />}
                  label="Unlock Requests"
                  active={activeTab === 'requests'}
                  badge={stats.requests}
                  badgeVariant="neutral"
                  onClick={() => setActiveTab('requests')}
                  isSidebarOpen={isSidebarOpen}
                />
                <NavItem
                  icon={<Activity size={16} />}
                  label="Fleet Analytics"
                  active={activeTab === 'analytics'}
                  onClick={() => setActiveTab('analytics')}
                  isSidebarOpen={isSidebarOpen}
                />
                <NavItem
                  icon={<Shield size={16} />}
                  label="Blockchain Audit"
                  active={activeTab === 'audit'}
                  onClick={() => setActiveTab('audit')}
                  isSidebarOpen={isSidebarOpen}
                />
                <NavItem
                  icon={<Radio size={16} />}
                  label="Geofence Config"
                  active={activeTab === 'geofence'}
                  onClick={() => setActiveTab('geofence')}
                  isSidebarOpen={isSidebarOpen}
                />
                
                {user?.role === 'admin' && (
                  <>
                    <motion.div 
                      style={{ marginTop: 24, padding: '0 8px', marginBottom: 6, whiteSpace: 'nowrap' }}
                      animate={{ opacity: isSidebarOpen ? 1 : 0 }}
                    >
                      <span className="label">Administration</span>
                    </motion.div>
                    <button
                      onClick={() => setIsAddDriverOpen(true)}
                      className="nav-item"
                      style={{ color: 'var(--ink-2)', border: isSidebarOpen ? '1px dashed var(--border)' : 'none', justifyContent: isSidebarOpen ? 'flex-start' : 'center', width: isSidebarOpen ? '100%' : '40px', margin: '0 auto' }}
                      title="Register Personnel"
                    >
                      <span style={{ fontSize: 18, display: 'flex' }}>+</span>
                      {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Register Personnel</span>}
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* ── Bottom ── */}
            <div>
              <hr className="divider" style={{ margin: '0 0 8px' }} />

              {/* User card */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px',
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--ink-1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFFFFF',
                    fontFamily: 'var(--f-display)',
                    fontStyle: 'italic', fontWeight: 700, fontSize: 14,
                  }}
                >
                  {user?.name?.charAt(0) || 'D'}
                </div>
                <motion.div 
                  style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}
                  animate={{ opacity: isSidebarOpen ? 1 : 0, width: isSidebarOpen ? 'auto' : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--f-ui)', fontSize: 12.5, fontWeight: 600,
                      color: 'var(--ink-1)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.name || 'Dispatcher'}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--f-mono)', fontSize: 9.5,
                      color: 'var(--ink-3)',
                      textTransform: 'uppercase', letterSpacing: '0.10em',
                    }}
                  >
                    {user?.role || 'Admin'}
                  </p>
                </motion.div>
              </div>

              <div style={{ padding: '0 8px 14px' }}>
                <button
                  onClick={logout}
                  className="nav-item"
                  title="Terminate Session"
                  style={{ 
                    color: 'var(--ink-3)',
                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                    width: isSidebarOpen ? '100%' : '40px',
                    margin: '0 auto' 
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--danger)';
                    e.currentTarget.style.background = 'var(--danger-bg)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--ink-3)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={16} style={{ flexShrink: 0 }} />
                  {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Terminate Session</span>}
                </button>
              </div>
            </div>
          </motion.aside>

          {/* ══════════════════════════════════════
              MAIN — layout identical to original
          ══════════════════════════════════════ */}
          <main
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              height: '100vh', overflow: 'hidden', position: 'relative',
            }}
          >
            {/* ── Top Header ── */}
            <header
              className="header-panel"
              style={{
                height: 52, flexShrink: 0,
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 28px',
                zIndex: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600 }}>Command Center</h1>
              </div>

              {/* Right — clock */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 12, fontWeight: 500,
                      color: 'var(--ink-1)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {new Date().toISOString().split('T')[1].split('.')[0]}
                    <span style={{ color: 'var(--ink-3)', fontSize: 9, marginLeft: 4 }}>UTC</span>
                  </p>
                </div>
              </div>
            </header>

            {/* ── Dashboard Grid ── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto', overflowX: 'hidden',
                padding: 20,
                position: 'relative',
                background: 'var(--surface)',
              }}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, 1fr)',
                  gap: 16,
                  position: 'relative', zIndex: 10,
                  width: '100%', maxWidth: 2000,
                  margin: '0 auto', height: '100%',
                }}
              >
                {/* ── Overview tab — Simplified ── */}
                {activeTab === 'overview' && (
                  <>
                    {/* Left Column: Map + Fleet control */}
                    <div
                      style={{
                        gridColumn: 'span 8',
                        display: 'flex', flexDirection: 'column', gap: 16,
                      }}
                    >
                      {/* STATS ROW */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <div className="stat-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span className="label">Registered Drivers</span>
                              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--f-mono)', color: 'var(--ink-1)', marginTop: 4 }}>
                                {stats.registeredDrivers !== undefined ? stats.registeredDrivers : '--'}
                              </div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Shield size={16} color="var(--blue)" />
                            </div>
                          </div>
                          <div className="accent-line" style={{ background: 'var(--blue)' }} />
                        </div>
                        
                        <div className="stat-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span className="label">Active Vehicles</span>
                              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--f-mono)', color: 'var(--ink-1)', marginTop: 4 }}>
                                {stats.activeVehicles !== undefined ? stats.activeVehicles : '--'}
                              </div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Activity size={16} color="var(--success)" />
                            </div>
                          </div>
                          <div className="accent-line" style={{ background: 'var(--success)' }} />
                        </div>

                        <div className="stat-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span className="label">Pending Action</span>
                              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--f-mono)', color: 'var(--ink-1)', marginTop: 4 }}>
                                {stats.requests !== undefined ? stats.requests : '--'}
                              </div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <KeyRound size={16} color="var(--amber)" />
                            </div>
                          </div>
                          <div className="accent-line" style={{ background: 'var(--amber)' }} />
                        </div>
                      </div>

                      <div style={{ flex: 1, minHeight: 450 }}>
                        <MapPanel />
                      </div>
                      <div>
                        <VehiclePanel />
                      </div>
                    </div>

                    {/* Right Column: Key Authorizations and simplified alerts */}
                    <div
                      style={{
                        gridColumn: 'span 4',
                        display: 'flex', flexDirection: 'column', gap: 16,
                      }}
                    >
                      <div style={{ flex: 1, maxHeight: 'calc(100vh - 100px)' }}>
                        <RequestsPanel fullHeight />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'requests' && (
                  <div style={{ gridColumn: 'span 12', height: 'calc(100vh - 140px)' }}>
                    <RequestsPanel fullHeight />
                  </div>
                )}

                {activeTab === 'alerts' && (
                  <div style={{ gridColumn: 'span 12', height: 'calc(100vh - 140px)' }}>
                    <AlertsPanel fullHeight />
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="panel" style={{ gridColumn: 'span 12', height: 'calc(100vh - 140px)', padding: 40, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
                      <Activity size={32} color="var(--blue)" />
                      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24 }}>Fleet Analytics</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
                      <div style={{ padding: 20, background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)',textTransform: 'uppercase',letterSpacing:'0.02em', fontWeight: 600 }}>Total Distance Traveled</div>
                        <div style={{ fontSize: 32, fontFamily: 'var(--f-display)', marginTop: 10, color: 'var(--ink-1)', fontWeight: 600 }}>14,029 km</div>
                      </div>
                      <div style={{ padding: 20, background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)',textTransform: 'uppercase',letterSpacing:'0.02em', fontWeight: 600 }}>Fuel Efficiency</div>
                        <div style={{ fontSize: 32, fontFamily: 'var(--f-display)', marginTop: 10, color: 'var(--success)' }}>94%</div>
                      </div>
                      <div style={{ padding: 20, background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)',textTransform: 'uppercase',letterSpacing:'0.02em', fontWeight: 600 }}>AI Anomalies Prevented</div>
                        <div style={{ fontSize: 32, fontFamily: 'var(--f-display)', marginTop: 10, color: 'var(--blue)' }}>1</div>
                      </div>
                    </div>
                    <div style={{ height: 300, background: 'var(--paper)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--ink-4)' }}>[ Network Telemetry Chart ]</span>
                    </div>
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="panel" style={{ gridColumn: 'span 12', height: 'calc(100vh - 140px)', padding: 40, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
                      <Shield size={32} color="var(--success)" />
                      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24 }}>Blockchain Audit Log</h2>
                    </div>
                    <p style={{ color: 'var(--ink-3)', marginBottom: 20 }}>All access requests are securely logged on the Iron Fist smart contract.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { time: '10:45 AM', event: 'Biometric authorization success (Selvan)', hash: '0x8f2a...c091' },
                        { time: '09:12 AM', event: 'Geofence entry verified (Thamizh)', hash: '0x3a9b...d122' },
                        { time: '08:30 AM', event: 'Engine remote immobilized (Hamilton)', hash: '0x1c4d...e889' },
                      ].map((log, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 20, background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 12 }}>
                          <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--ink-3)' }}>{log.time}</span>
                          <span style={{ color: 'var(--ink-1)' }}>{log.event}</span>
                          <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--blue)' }}>{log.hash}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'geofence' && (
                  <div className="panel" style={{ gridColumn: 'span 12', height: 'calc(100vh - 140px)', padding: 40, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
                      <Radio size={32} color="var(--amber)" />
                      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24 }}>Geofence Configuration</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {['Tamil Nadu Region', 'Maharashtra Industrial', 'Delhi NCR Checkpoint', 'Bengaluru IT Corridor'].map((f, i) => (
                           <div key={i} style={{ padding: 15, background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', justifyContent: 'space-between' }}>
                             <span style={{ color: 'var(--ink-1)' }}>{f}</span>
                             <span style={{ color: 'var(--success)', fontSize: 10, textTransform: 'uppercase', padding: '2px 6px', border: '1px solid var(--success)', borderRadius: 10 }}>Active</span>
                           </div>
                        ))}
                      </div>
                      <div style={{ height: 400, background: 'var(--paper)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--ink-4)' }}>[ Geofence Mapping Editor ]</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </main>
        </div>

        <AddDriverModal 
          isOpen={isAddDriverOpen} 
          onClose={() => setIsAddDriverOpen(false)} 
          onDriverAdded={() => {
            // You could optionally refresh some admin user list here if you had one
          }}
        />
      </>
    );
  }

  /* ══════════════════════════════════════════════════════
    NavItem — Updated for Aceternity Sidebar functionality
  ══════════════════════════════════════════════════════ */
  const NavItem = ({ icon, label, active, onClick, badge, badgeVariant = 'neutral', isSidebarOpen }) => {
    const badgeStyles = {
      neutral: { bg: 'rgba(0,113,227,0.1)',  color: '#0071E3',  border: 'rgba(0,113,227,0.2)' },
      danger:  { bg: 'var(--danger-bg)',   color: 'var(--danger)', border: 'var(--danger-border)' },
    };
    const bs = badgeStyles[badgeVariant];

    return (
      <button
        onClick={onClick}
        className={`nav-item ${active ? 'active' : ''}`}
        title={label}
        style={{
          justifyContent: isSidebarOpen ? 'flex-start' : 'center',
          padding: isSidebarOpen ? '10px 14px' : '10px 0',
          width: isSidebarOpen ? '100%' : '44px',
          margin: '0 auto'
        }}
      >
        {/* Active Indicator Hover Glow */}
        {active && (
          <motion.div
            layoutId="activeTab"
            style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0, right: 0,
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '8px',
              zIndex: 0,
            }}
          />
        )}

        <span
          className="nav-icon"
          style={{
            color: active ? '#0071E3' : 'var(--ink-3)',
            flexShrink: 0, display: 'flex', alignItems: 'center',
            transition: 'color 0.2s',
            zIndex: 1,
          }}
        >
          {icon}
        </span>

        {isSidebarOpen && (
          <motion.span 
            style={{ flex: 1, zIndex: 1, whiteSpace: 'nowrap' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.span>
        )}

        {badge > 0 && isSidebarOpen && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="badge"
            style={{
              background: active ? 'rgba(0,113,227,0.15)' : bs.bg,
              color:      active ? '#0071E3'                 : bs.color,
              border:     `1px solid transparent`,
              zIndex: 1,
            }}
          >
            {badge}
          </motion.span>
        )}
      </button>
    );
  };

  /* ── Small status indicator ── */
  const StatusIndicator = ({ icon, label, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', color, flexShrink: 0 }}>
        <div
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
          className="breathe"
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--f-ui)',
          fontSize: 11.5, fontWeight: 500,
          color: 'var(--ink-2)',
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </span>
    </div>
  );