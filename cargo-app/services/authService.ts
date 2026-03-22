import { apiCall, http } from './http';

export type LoginResponse = {
  token: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    assignedContainerId?: string;
    biometricFingerprintId?: string;
    faceEmbeddingId?: string;
  };
};

export async function login(email: string, password: string) {
  return apiCall<LoginResponse>(() =>
    http.post('/api/auth/login', {
      email,
      password,
    })
  );
}

export async function register(data: { name: string; email: string; password: string; age: number; biometricFingerprintId: string }) {
  return apiCall<LoginResponse>(() =>
    http.post('/api/auth/register', {
      ...data,
      role: 'driver',
    })
  );
}

export async function updateProfile(data: Partial<{ name: string; age: number; biometricFingerprintId: string }>) {
  return apiCall<{ ok: true; user: any }>(() => http.put('/api/auth/update-profile', data));
}

