import axios from 'axios';

// Helper function to resolve backend server URL dynamically
export const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
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

// Helper function to resolve image & file asset URLs dynamically
export const getImageUrl = (rawPath, fallback = '') => {
  if (!rawPath || typeof rawPath !== 'string') return fallback;
  if (
    rawPath.startsWith('http://') ||
    rawPath.startsWith('https://') ||
    rawPath.startsWith('data:image') ||
    rawPath.startsWith('blob:')
  ) {
    return rawPath;
  }
  const cleanPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const prefix = cleanPath.startsWith('uploads/') ? '' : 'uploads/';
  return `${getBaseUrl()}/${prefix}${cleanPath}`;
};

// Create an axios instance with base URL
export const API = axios.create({
  baseURL: `${getBaseUrl()}/api`,
});

// Configure default axios base URL for any component that uses global axios
axios.defaults.baseURL = `${getBaseUrl()}/api`;

const attachToken = (config) => {
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
};

// Request Interceptor: Attach JWT Bearer token to all outgoing requests
API.interceptors.request.use(attachToken, (error) => Promise.reject(error));
axios.interceptors.request.use(attachToken, (error) => Promise.reject(error));

// Response Interceptor: Handle auth errors
const handleAuthError = (error) => {
  if (error.response && error.response.status === 401) {
    console.warn('[API] 401 Unauthorized:', error.response.data?.message || 'Session expired or missing token');
  }
  return Promise.reject(error);
};

API.interceptors.response.use((res) => res, handleAuthError);
axios.interceptors.response.use((res) => res, handleAuthError);

export default API;