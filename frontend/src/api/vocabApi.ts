import { http } from './http';
import { ApiEnvelope, Vocabulary } from './types';

export interface CreateListVocabRequest {
  listVocabRequest: Partial<Vocabulary>[];
}

export type CreateVocabSimpleRequest = {
  term: string;
  vi: string;
};

export type VocabHomeStats = {
  total: number;
  newWords: number;
  dueToday: number;
  overdue: number;
  upcoming: number;
  upcoming7d: number;
};

export const vocabApi = {
  createListVocab: async (lessonId: number, payload: CreateListVocabRequest) => {
    const res = await http.post<ApiEnvelope<any>>(`/api/vocab/${lessonId}`, payload);
    const body = res.data;
    // Backend có thể trả HTTP 200 nhưng code != 200 cho lỗi nghiệp vụ
    if (body?.code != null && body.code !== 200) {
      const err: any = new Error(body.message || 'Không thể lưu từ vựng');
      err.code = body.code;
      throw err;
    }
    return body;
  },

  createVocabSimple: async (lessonId: number, payload: CreateVocabSimpleRequest) => {
    const res = await http.post<ApiEnvelope<Vocabulary>>(`/api/vocab/${lessonId}/simple`, payload);
    const body = res.data;
    if (body?.code != null && body.code !== 200) {
      const err: any = new Error(body.message || 'Không thể thêm từ vựng');
      err.code = body.code;
      throw err;
    }
    return body;
  },

  homeStats: async () => {
    const res = await http.get<ApiEnvelope<VocabHomeStats>>('/api/vocab/home-stats');
    return res.data;
  },

  /**
   * Số từ cần học/ôn hôm nay. userId phải trùng user đăng nhập (backend kiểm tra).
   * `data` trong envelope là số (long).
   */
  getDueTodayCount: async (userId: number, lessonVocabId: number) => {
    const res = await http.get<ApiEnvelope<number>>('/api/vocab/due-today-count', {
      params: { userId, lessonVocabId },
    });
    return res.data;
  },
};
