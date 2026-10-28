import axios from 'axios';

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

export const getImageUrl = (rawPath, fallback = '') => {
  if (!rawPath || typeof rawPath !== 'string') return fallback;
  if (rawPath.startsWith('data:image') || rawPath.startsWith('blob:')) {
    return rawPath;
  }
  let pathStr = rawPath;
  if (pathStr.includes('/uploads/')) {
    pathStr = pathStr.substring(pathStr.indexOf('/uploads/') + 1);
  } else if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
    return pathStr;
  }
  const cleanPath = pathStr.replace(/\\/g, '/').replace(/^\/+/, '');
  const prefix = cleanPath.startsWith('uploads/') ? '' : 'uploads/';
  return `${getBaseUrl()}/${prefix}${cleanPath}`;
};

export const getAlternativeImageUrl = (currentUrl) => {
  if (!currentUrl || typeof currentUrl !== 'string') return '';
  if (currentUrl.includes('localhost:5001')) {
    return currentUrl.replace('http://localhost:5001', 'https://vinsup-4vt5.onrender.com');
  }
  if (currentUrl.includes('vinsup-4vt5.onrender.com')) {
    return currentUrl.replace('https://vinsup-4vt5.onrender.com', 'http://localhost:5001');
  }
  return '';
};

export const API = axios.create({
  baseURL: `${getBaseUrl()}/api`,
});

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

API.interceptors.request.use(attachToken, (error) => Promise.reject(error));
axios.interceptors.request.use(attachToken, (error) => Promise.reject(error));

const handleAuthError = (error) => {
  if (error.response && error.response.status === 401) {
    console.warn('[API] 401 Unauthorized:', error.response.data?.message || 'Session expired or missing token');
  }
  return Promise.reject(error);
};

API.interceptors.response.use((res) => res, handleAuthError);
axios.interceptors.response.use((res) => res, handleAuthError);

export default API;