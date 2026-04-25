import axiosInstance from "./axios";

// ==================== Types ====================

export interface LessonSentence {
  id: number;
  sentenceVi: string;
  orderIndex: number;
  suggestVocabularies: SuggestVocabulary[];
}

export interface SuggestVocabulary {
  id: number;
  term: string;
  vietnamese: string;
  type: string;
  pronunciation: string;
  example: string;
}

export interface LessonWriting {
  id: number;
  name: string;
  description: string;
  status: string;
  deleteFlag: boolean;
  totalSentences: number;
  topicId: number | null;
  topicName: string | null;
  levelId: number | null;
  levelName: string | null;
  createdAt: string;
  updatedAt: string | null;
  sentences: LessonSentence[];
  suggestVocabularies: SuggestVocabulary[];
}

export interface LessonWritingSummary {
  id: number;
  name: string;
  status: string;
  deleteFlag: boolean;
  topicId: number | null;
  topicName: string | null;
  levelId: number | null;
  levelName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CreateLessonWritingRequest {
  draftName: string;
  topicId: number;
  levelId: number;
  description: string;
}

export interface ManualSuggestVocabulary {
  term: string;
  vietnamese: string;
  type?: string;
  pronunciation?: string;
  example?: string;
}

export interface ManualSentence {
  sentenceVi: string;
  orderIndex?: number;
  suggestVocabularies?: ManualSuggestVocabulary[];
}

export interface ManualCreateLessonRequest {
  name: string;
  description: string;
  topicId: number;
  levelId: number;
  sentences: ManualSentence[];
}

export interface UpdateLessonWritingRequest {
  name?: string;
  description?: string;
}

export interface CreateSentenceRequest {
  lessonWritingId: number;
  sentenceVi: string;
  orderIndex?: number;
}

export interface UpdateSentenceRequest {
  sentenceVi?: string;
  orderIndex?: number;
}

// ==================== API ====================

export const lessonWritingApi = {
  // Lesson CRUD
  getAll: (params?: {
    searchTerm?: string;
    topicId?: number;
    levelId?: number;
    isDeleted?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => axiosInstance.get("/api/admin/lessons", { params }),

  getById: (id: number) => axiosInstance.get(`/api/admin/lessons/${id}`),

  generateWithAi: (data: CreateLessonWritingRequest) =>
    axiosInstance.post("/api/admin/lessons/generate-with-ai", data),

  createManual: (data: ManualCreateLessonRequest) =>
    axiosInstance.post("/api/admin/lessons/create-manual", data),

  update: (id: number, data: UpdateLessonWritingRequest) =>
    axiosInstance.put(`/api/admin/lessons/${id}`, data),

  delete: (id: number) => axiosInstance.delete(`/api/admin/lessons/${id}`),

  restore: (id: number) =>
    axiosInstance.put(`/api/admin/lessons/${id}/restore`),

  // Sentence management
  getSentences: (lessonId: number) =>
    axiosInstance.get(`/api/admin/lessons/${lessonId}/sentences`),

  createSentence: (data: CreateSentenceRequest) =>
    axiosInstance.post("/api/admin/lessons/sentences", data),

  updateSentence: (sentenceId: number, data: UpdateSentenceRequest) =>
    axiosInstance.put(`/api/admin/lessons/sentences/${sentenceId}`, data),

  deleteSentence: (sentenceId: number) =>
    axiosInstance.delete(`/api/admin/lessons/sentences/${sentenceId}`),
};
