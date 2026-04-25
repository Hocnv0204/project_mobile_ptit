import axios, { AxiosError } from 'axios';

export function extractBackendMessage(data: unknown): string | null {
  if (!data) return null;

  // Backend đôi khi trả string thẳng
  if (typeof data === 'string') {
    const s = data.trim();
    return s ? s : null;
  }

  if (typeof data !== 'object') return null;

  const any = data as any;

  // BaseResponse: { code, message }
  if (typeof any.message === 'string' && any.message.trim()) return any.message.trim();

  // Một số framework trả { error: "..."} hoặc { detail: "..."}
  if (typeof any.error === 'string' && any.error.trim()) return any.error.trim();
  if (typeof any.detail === 'string' && any.detail.trim()) return any.detail.trim();

  // Spring validation thường có { errors: [{ defaultMessage / message }] }
  const errs = any.errors;
  if (Array.isArray(errs) && errs.length > 0) {
    const first = errs[0];
    const m =
      (typeof first?.defaultMessage === 'string' && first.defaultMessage.trim() && first.defaultMessage) ||
      (typeof first?.message === 'string' && first.message.trim() && first.message) ||
      null;
    if (m) return String(m).trim();
  }

  // Một số API trả { message: { ... } } hoặc { data: { message } }
  if (any.data && typeof any.data === 'object') {
    const m2 = extractBackendMessage(any.data);
    if (m2) return m2;
  }

  return null;
}

export type ApiError = {
  code?: number;
  message: string;
};

export function toApiError(err: unknown, apiBaseUrl?: string): ApiError {
  if (axios.isAxiosError(err)) {
    const ae = err as AxiosError<any>;
    const data = ae.response?.data;
    const status = ae.response?.status;
    const isNetwork =
      ae.code === 'ERR_NETWORK' ||
      ae.code === 'ECONNABORTED' ||
      ae.message === 'Network Error';

    const networkHint = isNetwork && apiBaseUrl
      ? ` Không gọi được ${apiBaseUrl}. Trên Android emulator dùng http://10.0.2.2:8080; kiểm tra backend đang chạy, app.json usesCleartextTraffic (HTTP), và restart: npx expo start -c.`
      : '';

    const msgFromBody = extractBackendMessage(data);
    const message =
      msgFromBody ||
      (status != null ? `HTTP ${status}${ae.response?.statusText ? ` ${ae.response.statusText}` : ''}` : null) ||
      (ae.message ? `${ae.message}.${networkHint}` : null) ||
      `Đã có lỗi xảy ra.${networkHint}`;

    return {
      code: typeof (data as { code?: unknown })?.code === 'number' ? (data as { code: number }).code : undefined,
      message,
    };
  }

  // Nếu đã là lỗi chuẩn hoá dạng { code?, message } thì giữ nguyên (không bọc lại)
  if (err && typeof err === 'object') {
    const e = err as { code?: unknown; message?: unknown };
    if (typeof e.message === 'string' && e.message.trim()) {
      return {
        code: typeof e.code === 'number' ? e.code : undefined,
        message: e.message,
      };
    }
  }

  if (err instanceof Error) {
    return { message: err.message || 'Đã có lỗi xảy ra' };
  }
  return { message: 'Đã có lỗi xảy ra' };
}
