import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config/env';
import { ApiEnvelope, ApiError, AuthResponse } from './types';
import { useAuthStore } from '../store/authStore';

let refreshingPromise: Promise<any> | null = null;

function backendMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const m = (data as { message?: unknown }).message;
  return typeof m === 'string' && m.trim() ? m : null;
}

function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const ae = err as AxiosError<any>;
    const data = ae.response?.data;
    const status = ae.response?.status;
    const isNetwork =
      ae.code === 'ERR_NETWORK' ||
      ae.code === 'ECONNABORTED' ||
      ae.message === 'Network Error';

    const networkHint = isNetwork
      ? ` Không gọi được ${API_BASE_URL}. Trên Android emulator dùng http://10.0.2.2:8080; kiểm tra backend đang chạy, app.json usesCleartextTraffic (HTTP), và restart: npx expo start -c.`
      : '';

    const msgFromBody = backendMessage(data);
    const message =
      msgFromBody ||
      (status != null ? `HTTP ${status}${ae.response?.statusText ? ` ${ae.response.statusText}` : ''}` : null) ||
      (ae.message ? `${ae.message}.${networkHint}` : null) ||
      `Đã có lỗi xảy ra.${networkHint}`;

    if (__DEV__) {
      console.warn('[API]', ae.config?.method?.toUpperCase(), ae.config?.baseURL, ae.config?.url, {
        code: ae.code,
        status,
        data: ae.response?.data,
      });
    }

    return {
      code: typeof (data as { code?: unknown })?.code === 'number' ? (data as { code: number }).code : undefined,
      message,
    };
  }
  if (err instanceof Error) {
    return { message: err.message || 'Đã có lỗi xảy ra' };
  }
  return { message: 'Đã có lỗi xảy ra' };
}

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
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error.config;
    if (status !== 401 || original?._retry || original?.url === '/api/auth/refresh') {
      return Promise.reject(toApiError(error));
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
      return Promise.reject(toApiError(e));
    }
  },
);

