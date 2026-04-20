import { Platform } from 'react-native';

/**
 * Base URL backend (không có /api ở cuối). Axios gọi path dạng `/api/auth/...`.
 *
 * Ưu tiên (khuyến nghị):
 * - `EXPO_PUBLIC_API_URL_WEB` — Expo Web / trình duyệt (thường `http://localhost:8080/api`).
 * - `EXPO_PUBLIC_API_URL_ANDROID` — Android emulator (thường `http://10.0.2.2:8080/api`).
 *
 * iOS simulator dùng cùng URL với Web (`EXPO_PUBLIC_API_URL_WEB`) khi có.
 *
 * Tương thích cũ: `EXPO_PUBLIC_API_BASE_URL` hoặc `EXPO_PUBLIC_API_URL` (một URL cho mọi nền tảng).
 */
function stripTrailingSlash(s: string) {
  return s.replace(/\/$/, '');
}

function normalizeBaseUrl(raw: string): string {
  let s = stripTrailingSlash(raw.trim());
  if (s.endsWith('/api')) {
    s = s.slice(0, -4);
  }
  return stripTrailingSlash(s);
}

function defaultBaseUrlForPlatform(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }
  return 'http://localhost:8080';
}

/**
 * Một URL duy nhất trong .env với 10.0.2.2: trên Web/iOS không hoạt động — đổi sang localhost.
 */
function rewriteAndroidEmulatorHostForCurrentPlatform(url: string): string {
  if (!url.includes('10.0.2.2')) return url;
  if (Platform.OS === 'android') return url;
  return url.replace('10.0.2.2', 'localhost');
}

function getApiBaseUrl(): string {
  const webUrl = process.env.EXPO_PUBLIC_API_URL_WEB?.trim();
  const androidUrl = process.env.EXPO_PUBLIC_API_URL_ANDROID?.trim();

  if (Platform.OS === 'web' && webUrl) {
    return normalizeBaseUrl(webUrl);
  }
  if (Platform.OS === 'android' && androidUrl) {
    return normalizeBaseUrl(androidUrl);
  }
  if (Platform.OS === 'ios' && webUrl) {
    return normalizeBaseUrl(webUrl);
  }

  const base = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (base) return rewriteAndroidEmulatorHostForCurrentPlatform(normalizeBaseUrl(base));

  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (apiUrl) return rewriteAndroidEmulatorHostForCurrentPlatform(normalizeBaseUrl(apiUrl));

  return defaultBaseUrlForPlatform();
}

export const API_BASE_URL = getApiBaseUrl();
