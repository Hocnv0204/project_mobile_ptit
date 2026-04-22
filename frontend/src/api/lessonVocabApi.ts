import { http } from './http';
import { ApiEnvelope, LessonVocab, Vocabulary } from './types';

export type UpdateLessonVocabRequest = {
  name: string;
  levelId: number;
};

export const lessonVocabApi = {
  getAll: async () => {
    const res = await http.get<ApiEnvelope<LessonVocab[]>>('/api/lesson-vocab');
    return res.data;
  },

  getVocabularies: async (lessonId: number) => {
    const res = await http.get<ApiEnvelope<Vocabulary[]>>(`/api/lesson-vocab/${lessonId}/vocabularies`);
    return res.data;
  },

  createSimple: async (name: string) => {
    const res = await http.post<ApiEnvelope<LessonVocab>>('/api/lesson-vocab/simple', { name });
    return res.data;
  },

  getByUserId: async (userId: number) => {
    const res = await http.get<ApiEnvelope<LessonVocab[]>>(`/api/lesson-vocab/user/${userId}`);
    return res.data;
  },

  /** Lấy lesson hệ thống do username (admin) tạo, lọc theo levelId của user */
  getSystemLessons: async (username: string, levelId?: number) => {
    const params = new URLSearchParams({ username });
    if (levelId != null) params.append('levelId', String(levelId));
    const res = await http.get<ApiEnvelope<LessonVocab[]>>(`/api/lesson-vocab/system?${params}`);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await http.delete<ApiEnvelope<unknown>>(`/api/lesson-vocab/${id}`);
    return res.data;
  },

  update: async (id: number, request: UpdateLessonVocabRequest) => {
    const res = await http.put<ApiEnvelope<LessonVocab>>(`/api/lesson-vocab/${id}`, request);
    return res.data;
  },
};
