import { apiCall, http } from './http';

export type UnlockStatus = 'pending' | 'approved' | 'rejected' | 'none';
export type VehicleStatus = 'running' | 'stopped' | 'unknown';

export type UnlockRequest = {
  status?: string;
  requestId?: string;
  request?: {
    status?: string;
  };
};

export async function requestUnlock(payload: { containerId: string; lat: number; lng: number; biometricSessionId: string }) {
  return apiCall<UnlockRequest>(() => http.post('/api/unlock/request', payload));
}

export async function getUnlockStatus(requestId: string) {
  return apiCall<UnlockRequest>(() => http.get(`/api/unlock/status/${requestId}`));
}

export async function getVehicleStatus(containerId: string) {
  return apiCall<{ engineStatus: VehicleStatus }>(() => http.get(`/api/immobilize/status/${containerId}`));
}

