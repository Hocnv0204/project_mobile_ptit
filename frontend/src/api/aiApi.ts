import { http } from './http';
import { ApiEnvelope, Vocabulary } from './types';

export type FormatTermsRequest = {
  input: string;
};

// The backend returns a raw list of Vocabulary objects in the BaseResponse success data
export const aiApi = {
  async formatTerms(input: string) {
    const res = await http.post<ApiEnvelope<Vocabulary[]>>('/api/ai/terms/format', { input });
    return res.data;
  },
};
