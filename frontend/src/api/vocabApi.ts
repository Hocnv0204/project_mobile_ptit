import { http } from './http';
import { ApiEnvelope, Vocabulary } from './types';

export interface CreateListVocabRequest {
  listVocabRequest: Partial<Vocabulary>[];
}

export const vocabApi = {
  createListVocab: async (lessonId: number, payload: CreateListVocabRequest) => {
    const res = await http.post<ApiEnvelope<any>>(`/api/vocab/${lessonId}`, payload);
    return res.data;
  },
};
