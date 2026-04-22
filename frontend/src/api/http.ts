import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config/env';
import { toApiError, ApiError, extractBackendMessage } from '../utils/apiErrors';
import { ApiEnvelope, AuthResponse } from './types';
import { useAuthStore } from '../store/authStore';

let refreshingPromise: Promise<any> | null = null;


if (__DEV__) {
  console.log('[API] Base URL:', API_BASE_URL);
}

async function refreshAccessToken(): Promise<any> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    throw new Error('TOKEN_NOT_FOUND');
  }
  const cleanAxios = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });
  const res = await cleanAxios.post<ApiEnvelope<any>>('/api/auth/refresh', {
    refreshToken,
  });
  return res.data.data;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

http.interceptors.request.use(async (config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => {
    const data: any = res?.data;
    // Backend BaseResponse có thể trả HTTP 200 nhưng code != 200 cho lỗi nghiệp vụ
    if (data && typeof data === 'object' && typeof data.code === 'number' && data.code !== 200) {
      // Trả về lỗi "đã chuẩn hoá" để UI show đúng message backend
      return Promise.reject({ code: data.code, message: extractBackendMessage(data) || 'Đã có lỗi xảy ra' });
    }
    return res;
  },
  async (error) => {
    const status = error?.response?.status;
    const original = error.config;
    if (status !== 401 || original?._retry || original?.url === '/api/auth/refresh') {
      return Promise.reject(toApiError(error, API_BASE_URL));
    }

    original._retry = true;

    try {
      if (!refreshingPromise) {
        refreshingPromise = refreshAccessToken().then(async (auth) => {
          useAuthStore.getState().setAuth({
            accessToken: auth.accessToken,
            refreshToken: auth.refreshToken,
            user: auth.user,
          });
          return auth;
        }).finally(() => {
          refreshingPromise = null;
        });
      }
      const auth = await refreshingPromise;
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${auth.accessToken}`;
      return http(original);
    } catch (e) {
      useAuthStore.getState().logout();
      return Promise.reject(toApiError(e, API_BASE_URL));
    }
  },
);

