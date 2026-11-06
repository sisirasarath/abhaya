import axios from 'axios';

const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = (rawUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) {
    return '/api';
  }
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('abhaya_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/')
    ) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('abhaya_refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            { refresh },
            { withCredentials: true }
          );
          if (res.data?.access) {
            localStorage.setItem('abhaya_access_token', res.data.access);
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return apiClient(originalRequest);
          }
        } catch (_err) {
          localStorage.removeItem('abhaya_access_token');
          localStorage.removeItem('abhaya_refresh_token');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
