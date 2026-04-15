import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.7:5001/api',  // ← Quité el espacio al final
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;