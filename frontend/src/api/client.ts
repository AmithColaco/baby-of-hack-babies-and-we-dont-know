import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Note: Do NOT set a default Content-Type here.
  // Axios automatically sets the correct Content-Type per request:
  //   - 'application/json' for plain objects/JSON bodies
  //   - 'multipart/form-data; boundary=...' for FormData bodies (e.g. image uploads)
  // A hardcoded default here would override Axios's automatic multipart detection,
  // stripping the required boundary parameter and breaking file upload endpoints.
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
