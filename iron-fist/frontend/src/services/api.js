import axios from 'axios';

// Create a configured axios instance
// Assumes Vite sets up proxy from /api to localhost:5000
const api = axios.create({
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Explicit assignment for better compatibility with different Axios versions
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Interceptor to handle 401s (token expire/invalid) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = localStorage.getItem('token');
      localStorage.removeItem('token');
      // Only reload if we were previously logged in (to avoid loops on login page)
      if (hadToken && !window.location.pathname.includes('/login')) {
         window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
