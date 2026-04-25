import { http } from './http';
import { ApiEnvelope, LessonVocab, PageResponse, VocabularyWithStatus } from './types';

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
    const res = await http.get<ApiEnvelope<VocabularyWithStatus[]>>(`/api/lesson-vocab/${lessonId}/vocabularies`);
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

  /** Lấy lesson hệ thống theo user hiện tại (backend tự suy ra level). */
  getSystemLessons: async () => {
    const res = await http.get<ApiEnvelope<LessonVocab[]>>('/api/lesson-vocab/system');
    return res.data;
  },

  /**
   * Danh sách lesson phân trang (CMS / admin). data = Spring Page: content, pageNumber, pageSize, totalElements, last, …
   */
  getAdminList: async (params: {
    page?: number;
    size?: number;
    sort?: string;
    order?: 'asc' | 'desc' | string;
  } = {}) => {
    const res = await http.get<ApiEnvelope<PageResponse<LessonVocab>>>('/api/lesson-vocab/admin', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort,
        order: params.order,
      },
    });
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
