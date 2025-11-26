import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Interceptor para agregar token si existe
apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token && config && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // silent
  }
  return config;
});

export default apiClient;
