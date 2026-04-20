import { http } from './http';
import { ApiEnvelope, Vocabulary } from './types';

export type CreateVocabRequest = {
  term: string;
  vi: string;
  type: string;
  pronunciation: string;
  example: string;
};

export type CreateListVocabRequest = {
  listVocabRequest: CreateVocabRequest[];
};

export const vocabApi = {
  async createVocab(lessonId: number, body: CreateVocabRequest) {
    const res = await http.post<ApiEnvelope<Vocabulary>>(`/api/vocab/${lessonId}/single`, body);
    return res.data;
  },

  async createListVocab(lessonId: number, body: CreateListVocabRequest) {
    const res = await http.post<ApiEnvelope<Vocabulary[]>>(`/api/vocab/${lessonId}`, body);
    return res.data;
  },
};
