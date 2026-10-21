import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kalahaat_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, clear invalid token
      localStorage.removeItem('kalahaat_token');
      window.dispatchEvent(new Event('kalahaat_auth_expired'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
