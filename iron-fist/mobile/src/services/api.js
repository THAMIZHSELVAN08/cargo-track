import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Require explicit configuration — no silent fallback to a hardcoded IP.
// Set EXPO_PUBLIC_API_URL in your .env file before running the app.
// Example: EXPO_PUBLIC_API_URL=http://192.168.1.42:5000/api
if (!process.env.EXPO_PUBLIC_API_URL) {
  throw new Error(
    '[Iron Fist] EXPO_PUBLIC_API_URL is not set.\n' +
    'Create a .env file in the mobile/ directory with:\n' +
    '  EXPO_PUBLIC_API_URL=http://<your-machine-ip>:5000/api'
  );
}

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
