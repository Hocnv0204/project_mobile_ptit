import { http } from './http';
import { ApiEnvelope, LessonVocab, Vocabulary } from './types';

export type CreateLessonVocabRequest = {
  name: string;
  levelId: number;
};

export type CreateLessonVocabSimpleRequest = {
  name: string;
};

export type UpdateLessonVocabRequest = {
  name: string;
  levelId?: number;
};

export const lessonVocabApi = {
  async getAll() {
    const res = await http.get<ApiEnvelope<LessonVocab[]>>('/api/lesson-vocab');
    return res.data;
  },

  async getById(id: number) {
    const res = await http.get<ApiEnvelope<LessonVocab>>(`/api/lesson-vocab/${id}`);
    return res.data;
  },

  async create(body: CreateLessonVocabRequest) {
    const res = await http.post<ApiEnvelope<LessonVocab>>('/api/lesson-vocab', body);
    return res.data;
  },

  async createSimple(body: CreateLessonVocabSimpleRequest) {
    const res = await http.post<ApiEnvelope<LessonVocab>>('/api/lesson-vocab/simple', body);
    return res.data;
  },

  async update(id: number, body: UpdateLessonVocabRequest) {
    const res = await http.put<ApiEnvelope<LessonVocab>>(`/api/lesson-vocab/${id}`, body);
    return res.data;
  },

  async delete(id: number) {
    const res = await http.delete<ApiEnvelope<null>>(`/api/lesson-vocab/${id}`);
    return res.data;
  },

  async getVocabularies(lessonId: number) {
    const res = await http.get<ApiEnvelope<Vocabulary[]>>(`/api/lesson-vocab/${lessonId}/vocabularies`);
    return res.data;
  },
};
