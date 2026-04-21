import { http } from './http';
import { ApiEnvelope, Vocabulary } from './types';

export const aiApi = {
  formatTerms: async (input: string) => {
    const res = await http.post<ApiEnvelope<Vocabulary[]>>('/api/ai/terms/format', { input });
    return res.data;
  },
};
