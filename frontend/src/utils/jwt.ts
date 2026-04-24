/** Làm mới access token trước khi hết hạn (ms) — tránh gọi API rồi mới 401. */
const DEFAULT_SKEW_MS = 90_000;

/**
 * Trả về thời điểm hết hạn của JWT (ms từ epoch), hoặc null nếu không đọc được.
 */
export function getJwtExpMs(accessToken: string): number | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return null;
    const payloadJson = base64UrlDecodeToString(parts[1]);
    const payload = JSON.parse(payloadJson) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isAccessTokenExpiredOrExpiringSoon(
  accessToken: string,
  skewMs: number = DEFAULT_SKEW_MS,
): boolean {
  const expMs = getJwtExpMs(accessToken);
  if (expMs == null) return false;
  return Date.now() >= expMs - skewMs;
}

function base64UrlDecodeToString(segment: string): string {
  let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (b64.length % 4)) % 4;
  b64 += '='.repeat(pad);
  if (typeof globalThis.atob !== 'function') {
    throw new Error('atob unavailable');
  }
  return globalThis.atob(b64);
}
