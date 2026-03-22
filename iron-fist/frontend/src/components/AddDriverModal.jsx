import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AddDriverModal = ({ isOpen, onClose, onDriverAdded }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    role: 'driver',
    assignedContainerId: '',
    biometricFingerprintId: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      toast.success('Driver registered successfully.');
      onDriverAdded();
      onClose();
      setFormData({
        name: '', email: '', password: '', role: 'driver',
        assignedContainerId: '', biometricFingerprintId: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(3px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            background: 'var(--paper)',
            width: '100%',
            maxWidth: 440,
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            fontFamily: 'var(--f-ui)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)'
          }}>
            <h3 style={{
              display: 'flex', alignItems: 'center', gap: 8,
              margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ink-1)'
            }}>
              <UserPlus size={16} color="var(--ink-3)" />
              Register New Personnel
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--ink-3)', display: 'flex', alignItems: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Full Name *
              </label>
              <input
                type="text" name="name" required
                value={formData.name} onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontFamily: 'var(--f-ui)' }}
                placeholder="E.g., Ravi Kumar"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Email Address *
              </label>
              <input
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontFamily: 'var(--f-ui)' }}
                placeholder="driver@ironfist.com"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                  Password *
                </label>
                <input
                  type="password" name="password" required minLength={8}
                  value={formData.password} onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontFamily: 'var(--f-ui)' }}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                  Age *
                </label>
                <input
                  type="number" name="age" required
                  value={formData.age} onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontFamily: 'var(--f-ui)' }}
                  placeholder="Age"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                  Role *
                </label>
                <select
                  name="role" required
                  value={formData.role} onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontFamily: 'var(--f-ui)', cursor: 'pointer' }}
                >
                  <option value="driver">Driver</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                  Biometric ID
                </label>
                <input
                  type="text" name="biometricFingerprintId"
                  value={formData.biometricFingerprintId} onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontFamily: 'var(--f-ui)' }}
                  placeholder="Hardware bound ID"
                />
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button" onClick={onClose}
                style={{
                  padding: '9px 18px', border: '1px solid var(--border)', background: 'var(--surface)',
                  color: 'var(--ink-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={loading}
                style={{
                  padding: '9px 24px', border: '1px solid var(--ink-1)', background: 'var(--ink-1)',
                  color: '#FFF', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddDriverModal;
