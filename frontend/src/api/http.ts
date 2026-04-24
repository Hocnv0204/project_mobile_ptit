import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/env';
import { toApiError, extractBackendMessage } from '../utils/apiErrors';
import { ApiEnvelope, AuthResponse } from './types';
import { useAuthStore } from '../store/authStore';
import { isAccessTokenExpiredOrExpiringSoon } from '../utils/jwt';

let refreshingPromise: Promise<AuthResponse> | null = null;

function userFromAuthResponse(user: AuthResponse['user']) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    levelId: user.levelId ?? null,
    roles: user.roles ?? [],
  };
}

if (__DEV__) {
  console.log('[API] Base URL:', API_BASE_URL);
}

/** Các route auth không gửi Bearer — tránh JWT filter chặn trước khi tới controller (đặc biệt /refresh). */
const AUTH_PATHS_WITHOUT_BEARER = [
  '/api/auth/refresh',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/google',
  '/api/auth/forgot-password/request-otp',
  '/api/auth/forgot-password/reset',
];

function requestUrl(config: InternalAxiosRequestConfig): string {
  return `${config.baseURL ?? ''}${config.url ?? ''}`;
}

function shouldAttachBearer(config: InternalAxiosRequestConfig): boolean {
  const full = requestUrl(config);
  return !AUTH_PATHS_WITHOUT_BEARER.some((p) => full.includes(p));
}

function isRefreshRequest(config: InternalAxiosRequestConfig): boolean {
  return requestUrl(config).includes('/api/auth/refresh');
}

async function refreshAccessToken(): Promise<AuthResponse> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    throw new Error('TOKEN_NOT_FOUND');
  }
  const cleanAxios = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });
  const res = await cleanAxios.post<ApiEnvelope<AuthResponse>>('/api/auth/refresh', {
    refreshToken,
  });
  return res.data.data;
}

/** Single-flight: mọi request chờ cùng một lần refresh. */
function runSingleFlightRefresh(): Promise<AuthResponse> {
  if (!refreshingPromise) {
    refreshingPromise = refreshAccessToken()
      .then((auth) => {
        useAuthStore.getState().setAuth({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: userFromAuthResponse(auth.user),
        });
        return auth;
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

http.interceptors.request.use(async (config) => {
  if (isRefreshRequest(config)) {
    delete (config.headers as any).Authorization;
    return config;
  }

  const { accessToken, refreshToken } = useAuthStore.getState();

  if (
    accessToken &&
    refreshToken &&
    shouldAttachBearer(config) &&
    isAccessTokenExpiredOrExpiringSoon(accessToken)
  ) {
    try {
      await runSingleFlightRefresh();
    } catch (e) {
      useAuthStore.getState().logout();
      return Promise.reject(toApiError(e, API_BASE_URL));
    }
  }

  if (shouldAttachBearer(config)) {
    const { accessToken: token } = useAuthStore.getState();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } else {
    delete (config.headers as any).Authorization;
  }

  return config;
});

http.interceptors.response.use(
  async (res) => {
    const data: any = res?.data;
    const original: any = res?.config;

    if (data && typeof data === 'object' && typeof data.code === 'number' && (data.code < 200 || data.code >= 300)) {
      if (
        (data.code === 401 || data.code === 5004) &&
        original &&
        !original._retry &&
        !isRefreshRequest(original)
      ) {
        original._retry = true;
        try {
          const auth = await runSingleFlightRefresh();
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${auth.accessToken}`;
          return http(original);
        } catch (e) {
          useAuthStore.getState().logout();
          return Promise.reject(toApiError(e, API_BASE_URL));
        }
      }

      return Promise.reject({ code: data.code, message: extractBackendMessage(data) || 'Đã có lỗi xảy ra' });
    }
    return res;
  },
  async (error: AxiosError) => {
    const status = error?.response?.status;
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!original || original._retry || isRefreshRequest(original)) {
      return Promise.reject(toApiError(error, API_BASE_URL));
    }

    const rawCode = (error.response?.data as { code?: unknown })?.code;
    const bodyCode = typeof rawCode === 'number' ? rawCode : Number(rawCode);
    const isTokenError = status === 401 || bodyCode === 401 || bodyCode === 5004;

    if (!isTokenError) {
      return Promise.reject(toApiError(error, API_BASE_URL));
    }

    original._retry = true;

    try {
      const auth = await runSingleFlightRefresh();
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${auth.accessToken}`;
      return http(original);
    } catch (e) {
      useAuthStore.getState().logout();
      return Promise.reject(toApiError(e, API_BASE_URL));
    }
  },
);
