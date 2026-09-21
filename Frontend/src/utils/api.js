import axios from 'axios';

// Helper function to resolve backend server URL dynamically
export const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.endsWith('.local')
    ) {
      return `http://${hostname}:5001`;
    }
  }
  return 'https://vinsup-4vt5.onrender.com';
};

// Create an axios instance with base URL
const API = axios.create({
  baseURL: `${getBaseUrl()}/api`,
});

// Request Interceptor: Attach JWT Bearer token to all outgoing requests
API.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');
  
  if (!token) {
    try {
      const userAuth = JSON.parse(localStorage.getItem('userAuth') || '{}');
      if (userAuth && userAuth.token) {
        token = userAuth.token;
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  if (!token) {
    token = localStorage.getItem('adminToken');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API] 401 Unauthorized:', error.response.data?.message || 'Session expired or missing token');
    }
    return Promise.reject(error);
  }
);

export default API;