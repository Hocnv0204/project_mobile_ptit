import { http } from './http';
import { ApiEnvelope, LessonVocab, Vocabulary } from './types';

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
};
