import { http } from './http';
import { ApiEnvelope } from './types';

export const userApi = {
  updateLevel: async (levelId: number) => {
    const res = await http.put<ApiEnvelope<string>>('/api/users/me/level', { levelId });
    return res.data;
  },

  getCurrentLevel: async () => {
    // Backend có thể trả levelId (number) hoặc level label (string)
    const res = await http.get<ApiEnvelope<number | string | null>>('/api/users/me/level');
    return res.data;
  },
};
