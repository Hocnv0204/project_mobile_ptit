/**
 * Giữ import cũ tương thích; mọi logic token/refresh nằm ở `src/api/http.ts`.
 * @deprecated Dùng trực tiếp `http` từ `../api/http`.
 */
export { http as apiClient } from '../api/http';
