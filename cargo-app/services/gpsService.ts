import { apiCall, http } from './http';

export type GpsPayload = {
  containerId: string;
  lat: number;
  lng: number;
};

export async function sendGpsUpdate(payload: GpsPayload) {
  return apiCall<{ ok: boolean }>(() => http.post('/api/gps/update', payload));
}

