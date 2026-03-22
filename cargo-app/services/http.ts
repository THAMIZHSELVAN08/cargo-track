import axios, { AxiosError } from 'axios';
import { getApiBaseUrl } from './env';

export type ApiError = {
  message: string;
  status?: number;
  details?: unknown;
};

function normalizeAxiosError(err: unknown): ApiError {
  if (!axios.isAxiosError(err)) {
    return { message: 'Unexpected error occurred.' };
  }

  const axErr = err as AxiosError<any>;
  const status = axErr.response?.status;
  const data = axErr.response?.data;

  const messageFromServer =
    (typeof data === 'string' && data) ||
    (data?.message && String(data.message)) ||
    (data?.error && String(data.error));

  if (messageFromServer) {
    return { message: messageFromServer, status, details: data };
  }

  if (axErr.code === 'ECONNABORTED') {
    return { message: 'Request timed out. Please try again.', status };
  }

  if (!axErr.response) {
    return { message: 'Network error. Check your connection and API URL.', status };
  }

  return { message: 'Request failed. Please try again.', status, details: data };
}

const baseURL = getApiBaseUrl();

export const http = axios.create({
  baseURL: baseURL || undefined,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setAuthToken(token: string | null) {
  if (!token) {
    delete http.defaults.headers.common.Authorization;
    return;
  }
  http.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export async function apiCall<T>(fn: () => Promise<{ data: T }>): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  try {
    const res = await fn();
    return { ok: true, data: res.data };
  } catch (e) {
    return { ok: false, error: normalizeAxiosError(e) };
  }
}

