import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginApi, register as registerApi } from '../services/authService';
import { setAuthToken } from '../services/http';

type AuthState = {
  token: string | null;
  driverName?: string | null;
  containerId?: string | null;
  biometricFingerprintId?: string | null;
  userRole?: string | null;
};

type AuthContextValue = AuthState & {
  isBootstrapping: boolean;
  isSigningIn: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true; needsEnrollment?: boolean } | { ok: false; message: string }>;
  signUp: (data: { name: string; email: string; password: string; age: number; biometricFingerprintId: string }) => Promise<{ ok: true; needsEnrollment?: boolean } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  completeEnrollment: (biometricId: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

const TOKEN_KEY = 'cargo_security_token';
const DRIVER_NAME_KEY = 'cargo_security_driver_name';
const CONTAINER_ID_KEY = 'cargo_security_container_id';
const BIOMETRIC_ID_KEY = 'cargo_security_biometric_id';
const USER_ROLE_KEY = 'cargo_security_user_role';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [containerId, setContainerId] = useState<string | null>(null);
  const [biometricFingerprintId, setBiometricFingerprintId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedName = await SecureStore.getItemAsync(DRIVER_NAME_KEY);
        const storedContainerId = await SecureStore.getItemAsync(CONTAINER_ID_KEY);
        const storedBioId = await SecureStore.getItemAsync(BIOMETRIC_ID_KEY);
        const storedRole = await SecureStore.getItemAsync(USER_ROLE_KEY);
        if (cancelled) return;
        setToken(storedToken ?? null);
        setDriverName(storedName ?? null);
        setContainerId(storedContainerId ?? null);
        setBiometricFingerprintId(storedBioId ?? null);
        setUserRole(storedRole ?? null);
        setAuthToken(storedToken ?? null);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      driverName,
      containerId,
      biometricFingerprintId,
      userRole,
      isBootstrapping,
      isSigningIn,
      signIn: async (email, password) => {
        setIsSigningIn(true);
        try {
          const res = await loginApi(email.trim(), password);
          if (!res.ok) return { ok: false, message: res.error.message };
          if (!res.data.token) return { ok: false, message: 'Login failed: missing token.' };

          const name = res.data.user?.name ?? null;
          const assignedId = res.data.user?.assignedContainerId ?? null;
          const bioId = res.data.user?.biometricFingerprintId ?? null;
          const role = res.data.user?.role ?? 'driver';

          await SecureStore.setItemAsync(TOKEN_KEY, res.data.token);
          if (name) await SecureStore.setItemAsync(DRIVER_NAME_KEY, name);
          if (assignedId) await SecureStore.setItemAsync(CONTAINER_ID_KEY, assignedId);
          if (bioId) await SecureStore.setItemAsync(BIOMETRIC_ID_KEY, bioId);
          await SecureStore.setItemAsync(USER_ROLE_KEY, role);

          setToken(res.data.token);
          setDriverName(name);
          setContainerId(assignedId);
          setBiometricFingerprintId(bioId);
          setUserRole(role);
          setAuthToken(res.data.token);
          return { ok: true, needsEnrollment: !bioId };
        } finally {
          setIsSigningIn(false);
        }
      },
      signUp: async (data) => {
        setIsSigningIn(true);
        try {
          const res = await registerApi(data);
          if (!res.ok) return { ok: false, message: res.error.message };
          if (!res.data.token) return { ok: false, message: 'Signup failed: missing token.' };

          const name = res.data.user?.name ?? null;
          const assignedId = res.data.user?.assignedContainerId ?? null;
          const bioId = res.data.user?.biometricFingerprintId ?? null;

          await SecureStore.setItemAsync(TOKEN_KEY, res.data.token);
          if (name) await SecureStore.setItemAsync(DRIVER_NAME_KEY, name);
          if (assignedId) await SecureStore.setItemAsync(CONTAINER_ID_KEY, assignedId);
          if (bioId) await SecureStore.setItemAsync(BIOMETRIC_ID_KEY, bioId);

          setToken(res.data.token);
          setDriverName(name);
          setContainerId(assignedId);
          setBiometricFingerprintId(bioId);
          setAuthToken(res.data.token);
          return { ok: true, needsEnrollment: !bioId };
        } finally {
          setIsSigningIn(false);
        }
      },
      signOut: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(DRIVER_NAME_KEY);
        await SecureStore.deleteItemAsync(CONTAINER_ID_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_ID_KEY);
        await SecureStore.deleteItemAsync(USER_ROLE_KEY);
        setToken(null);
        setDriverName(null);
        setContainerId(null);
        setBiometricFingerprintId(null);
        setUserRole(null);
        setAuthToken(null);
      },
      completeEnrollment: async (biometricId) => {
        try {
          // Update profile on API
          const { updateProfile } = require('../services/authService');
          const res = await updateProfile({ biometricFingerprintId: biometricId });
          if (!res.ok) return { ok: false, message: res.error.message };

          // Update local state and storage
          await SecureStore.setItemAsync(BIOMETRIC_ID_KEY, biometricId);
          setBiometricFingerprintId(biometricId);
          return { ok: true };
        } catch (e: any) {
          return { ok: false, message: e.message };
        }
      },
    }),
    [token, driverName, containerId, biometricFingerprintId, userRole, isBootstrapping, isSigningIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

