import { http } from './http';
import { ApiEnvelope } from './types';

export const userApi = {
  updateLevel: async (levelId: number) => {
    const res = await http.put<ApiEnvelope<string>>('/api/users/me/level', { levelId });
    return res.data;
  },
};
