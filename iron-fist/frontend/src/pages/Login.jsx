import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Shield, LockKeyhole, Mail, Fingerprint } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   DESIGN SYSTEM  —  Editorial Light / Apple–Google Clarity
   ─────────────────────────────────────────────────────────────
   Same token set as Dashboard.jsx for full visual cohesion.

   Display  : Playfair Display  — engraved serif for the wordmark
   Data     : Geist Mono        — precise monospace for sub-labels
   Body/UI  : Geist — geometric grotesque, warm & crisp

   Palette  :
     #F8F7F4  warm off-white surface
     #FFFFFF  card / form surface
     #0D0D0D  near-black ink — primary
     #3A3A3A  dark grey  — secondary
     #888888  mid grey   — muted / placeholders
     #E2E1DE  warm grey  — borders
     #D63B3B  danger
     #1A7A52  success
─────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,800;1,400;1,600&family=Geist:wght@300;400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* ── Surfaces (Pricing Section 4 Dark Theme) ── */
    --surface:        #050814;
    --paper:          rgba(10, 15, 36, 0.65);
    --hover-fill:     rgba(255, 138, 42, 0.08); /* slight amber hover */

    /* ── Borders ── */
    --border:         rgba(255, 255, 255, 0.1);
    --border-strong:  rgba(255, 255, 255, 0.2);
    --border-focus:   #FF8A2A;

    /* ── Ink ── */
    --ink-1:   #FFFFFF;
    --ink-2:   #E2E8F0;
    --ink-3:   #94A3B8;
    --ink-4:   #475569;

    --f-display: 'Playfair Display', Georgia, serif;
    --f-mono:    'Geist Mono', 'Courier New', monospace;
    --f-ui:      'Geist', system-ui, sans-serif;
  }

  html, body { height: 100%; }

  body {
    background: var(--surface);
    font-family: var(--f-ui);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Background decoration like the dark neon themes ── */
  .login-bg {
    min-height: 100vh;
    background-color: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }
  .login-bg::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%; width: 100vw; height: 100vh;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle at top, rgba(255, 138, 42, 0.08), transparent 50%),
                radial-gradient(circle at bottom, rgba(59, 130, 246, 0.05), transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Card (Glassmorphic) ── */
  .login-card {
    background: var(--paper);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    width: 100%;
    max-width: 420px;
    margin: 0 16px;
    padding: 48px 44px 44px;
    position: relative;
    overflow: hidden;
    z-index: 10;
  }
  
  /* Hairline top glow */
  .login-card::before {
    content: '';
    position: absolute;
    top: 0; left: 15%; right: 15%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 138, 42, 0.6), transparent);
  }

  /* ── Icon wrapper ── */
  .shield-wrap {
    width: 56px; height: 56px;
    background: linear-gradient(135deg, rgba(255, 138, 42, 0.2), rgba(25, 25, 25, 0.8));
    border: 1px solid rgba(255, 138, 42, 0.3);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 28px;
    box-shadow: 0 4px 15px rgba(255, 138, 42, 0.15);
  }

  /* ── Field ── */
  .field-wrap {
    position: relative;
    margin-bottom: 14px;
  }
  .field-icon {
    position: absolute;
    top: 50%; left: 14px;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--ink-4);
    display: flex; align-items: center;
    transition: color 0.18s;
  }
  .field-input {
    width: 100%;
    padding: 12px 14px 12px 42px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--ink-1);
    font-family: var(--f-ui);
    font-size: 13.5px;
    font-weight: 400;
    outline: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-appearance: none;
  }
  .field-input::placeholder {
    color: var(--ink-4);
    font-weight: 400;
  }
  .field-input:hover {
    background: rgba(0, 0, 0, 0.4);
    border-color: var(--border-strong);
  }
  .field-input:focus {
    background: rgba(0, 0, 0, 0.6);
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(255, 138, 42, 0.1);
  }
  .field-wrap:focus-within .field-icon { color: var(--border-focus); }

  /* ── Submit button ── */
  .btn-submit {
    width: 100%;
    height: 48px;
    margin-top: 12px;
    background: linear-gradient(135deg, #FF8A2A, #E06C00);
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-family: var(--f-ui);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 15px rgba(255, 138, 42, 0.3);
    position: relative;
    overflow: hidden;
  }
  .btn-submit:hover:not(:disabled) {
    background: linear-gradient(135deg, #FF9C4A, #F57C00);
    box-shadow: 0 6px 20px rgba(255, 138, 42, 0.4);
    transform: translateY(-1px);
  }
  .btn-submit:active:not(:disabled) {
    transform: scale(0.98);
    box-shadow: 0 2px 10px rgba(255, 138, 42, 0.3);
  }
  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--ink-4);
    box-shadow: none;
  }

  /* ── Spinner ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 15px; height: 15px;
    border: 1.5px solid rgba(255,255,255,0.30);
    border-top-color: #FFFFFF;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* ── Divider ── */
  .meta-row {
    display: flex; align-items: center;
    gap: 10px;
    margin-top: 28px;
  }
  .meta-rule { flex: 1; height: 1px; background: var(--border); }
  .meta-label {
    font-family: var(--f-mono);
    font-size: 9.5px;
    color: var(--ink-4);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;
  }
`;

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'biometric'
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleBiometricLogin = async () => {
    setLoading(true);
    // Simulate biometric scan
    await new Promise(r => setTimeout(r, 1500));
    const result = await login('admin@ironfist.com', 'admin123'); // Demo auto-auth
    setLoading(false);
    if (result.success) {
      navigate('/');
      toast.success('Identity Confirmed: Accessing Iron Fist Command Center');
    } else {
      toast.error('Biometric signature mismatch');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginMethod === 'biometric') {
      handleBiometricLogin();
      return;
    }
    if (!email || !password) { toast.warn('Please fill in all fields'); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
      toast.success('Access Granted to Iron Fist Command Center');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="login-bg">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="login-card"
        >
          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>

            {/* Shield icon — solid black square, same as sidebar logo */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.15 }}
              className="shield-wrap"
            >
              <Shield size={26} color="#FFFFFF" />
            </motion.div>

            {/* Wordmark — Playfair Display italic, same as sidebar */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: 'var(--f-display)',
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 32,
                letterSpacing: '0.04em',
                color: 'var(--ink-1)',
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              Iron Fist
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 10,
                color: 'var(--ink-3)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              Smart Cargo Security &amp; Telemetry
            </motion.p>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
            <button 
              onClick={() => setLoginMethod('password')}
              style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer', color: loginMethod === 'password' ? 'var(--ink-1)' : 'var(--ink-4)', borderBottom: loginMethod === 'password' ? '2px solid var(--ink-1)' : 'none' }}>
              PROTOCOL KEYS
            </button>
            <button 
              onClick={() => setLoginMethod('biometric')}
              style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer', color: loginMethod === 'biometric' ? 'var(--ink-1)' : 'var(--ink-4)', borderBottom: loginMethod === 'biometric' ? '2px solid var(--ink-1)' : 'none' }}>
              BIOMETRIC UPLINK
            </button>
          </div>

          {/* ── Form — identical structure to original ── */}
          <form onSubmit={handleLogin}>            {loginMethod === 'password' ? (
              <>
                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="field-wrap"
                >
                  <div className="field-icon">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    placeholder="Dispatch Email"
                    className="field-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="field-wrap"
                  style={{ marginBottom: 0 }}
                >
                  <div className="field-icon">
                    <LockKeyhole size={15} />
                  </div>
                  <input
                    type="password"
                    placeholder="Authorization Key"
                    className="field-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '20px 0' }}
              >
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--hover-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', cursor: 'pointer', border: '1px solid var(--border)' }} onClick={handleBiometricLogin}>
                   <Fingerprint size={40} color="var(--ink-1)" />
                </div>
                <p style={{ fontFamily: 'var(--f-ui)', fontSize: 13, color: 'var(--ink-3)' }}>Touch sensor to authenticate via encrypted biometric signature</p>
              </motion.div>
            )}
            {/* Submit */}
            <motion.button
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.60 }}
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Authenticating</span>
                </>
              ) : (
                <>
                  <span>Initiate Uplink</span>
                  <Shield size={13} />
                </>
              )}
            </motion.button>
          </form>

          {/* ── Decorative meta row ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="meta-row"
          >
            <div className="meta-rule" />
            <span className="meta-label">Secure Channel</span>
            <div className="meta-rule" />
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}