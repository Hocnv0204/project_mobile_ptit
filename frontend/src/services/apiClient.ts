import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { getAccessToken, getRefreshToken, saveTokens } from '../utils/tokenStorage';
import { API_BASE_URL } from '../config/env';

const BASE_URL = API_BASE_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken: refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await saveTokens(accessToken, newRefreshToken);
        
        // Update store if needed (Zustand doesn't automatically update from here unless we call it)
        // For simplicity, we just use the token in the retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
