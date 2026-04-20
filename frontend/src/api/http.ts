import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config/env';
import { ApiEnvelope, ApiError, AuthResponse } from './types';
import { clearTokens, getTokens, setTokens } from './authStorage';

let refreshingPromise: Promise<AuthResponse> | null = null;

function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const ae = err as AxiosError<any>;
    const data = ae.response?.data;
    const message =
      (typeof data?.message === 'string' && data.message) ||
      ae.message ||
      'Đã có lỗi xảy ra';
    return { code: typeof data?.code === 'number' ? data.code : undefined, message };
  }
  return { message: 'Đã có lỗi xảy ra' };
}

async function refreshAccessToken(instance: AxiosInstance): Promise<AuthResponse> {
  const { refreshToken } = await getTokens();
  if (!refreshToken) {
    throw new Error('TOKEN_NOT_FOUND');
  }
  const res = await instance.post<ApiEnvelope<AuthResponse>>('/api/auth/refresh', {
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
  const { accessToken } = await getTokens();
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
    if (status !== 401 || original?._retry) {
      return Promise.reject(toApiError(error));
    }

    original._retry = true;

    try {
      if (!refreshingPromise) {
        refreshingPromise = refreshAccessToken(http).finally(() => {
          refreshingPromise = null;
        });
      }
      const auth = await refreshingPromise;
      await setTokens({ accessToken: auth.accessToken, refreshToken: auth.refreshToken });
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${auth.accessToken}`;
      return http(original);
    } catch (e) {
      await clearTokens();
      return Promise.reject(toApiError(e));
    }
  },
);

