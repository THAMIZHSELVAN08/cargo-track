import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        }
      } catch (e) {
        console.warn('Token expired or invalid');
        await SecureStore.deleteItemAsync('token');
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      await SecureStore.setItemAsync('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Login failed' };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
