import axios from 'axios';

// Create an axios instance with base URL
const API = axios.create({
  baseURL: 'https://vinsup-4vt5.onrender.com/api', // Unga Render backend URL
});

// Request Interceptor: Ella API request pogum pothum ihu automatic-a run aagum
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // localStorage-la irukkura token-a edukrom
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Header-la token-a add panrom
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;