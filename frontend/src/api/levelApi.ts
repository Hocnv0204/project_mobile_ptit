import { http } from './http';
import { ApiEnvelope } from './types';

export type Level = {
  id: number;
  name: string;
  description: string;
};

export const levelApi = {
  async getAll() {
    const res = await http.get<ApiEnvelope<Level[]>>('/api/levels');
    return res.data;
  },
};
