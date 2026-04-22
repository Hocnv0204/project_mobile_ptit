import { http } from './http';
import { ApiEnvelope, Vocabulary } from './types';

export interface CreateListVocabRequest {
  listVocabRequest: Partial<Vocabulary>[];
}

export type CreateVocabSimpleRequest = {
  term: string;
  vi: string;
};

export const vocabApi = {
  createListVocab: async (lessonId: number, payload: CreateListVocabRequest) => {
    const res = await http.post<ApiEnvelope<any>>(`/api/vocab/${lessonId}`, payload);
    return res.data;
  },

  createVocabSimple: async (lessonId: number, payload: CreateVocabSimpleRequest) => {
    const res = await http.post<ApiEnvelope<Vocabulary>>(`/api/vocab/${lessonId}/simple`, payload);
    return res.data;
  },
};
