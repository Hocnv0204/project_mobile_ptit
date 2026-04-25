import { http } from "../http";
import { ApiEnvelope } from "../types";
import {
  LessonSummaryResponse,
  LessonResponse,
  UserLessonProgressResponse,
  GradingRequest,
  GradingResponse,
  UserTranslationHistoryResponse,
} from "./types";

export type SpringPage<T> = {
  content: T[];
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
};

export const writingApi = {
  getLessons: async (params?: {
    searchTerm?: string;
    topicId?: number;
    levelId?: number;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const res = await http.get<ApiEnvelope<SpringPage<LessonSummaryResponse>>>(
      "/api/lesson-writings",
      { params },
    );
    return res.data.data;
  },

  getLessonDetails: async (lessonId: number) => {
    const res = await http.get<ApiEnvelope<LessonResponse>>(
      `/api/lesson-writings/${lessonId}`,
    );
    return res.data.data;
  },

  getLessonProgress: async (lessonId: number) => {
    const res = await http.get<ApiEnvelope<UserLessonProgressResponse>>(
      `/api/lesson-writings/progress/${lessonId}`,
    );
    return res.data.data;
  },

  getBulkLessonProgress: async (lessonIds: number[]) => {
    const res = await http.get<ApiEnvelope<UserLessonProgressResponse[]>>(
      "/api/lesson-writings/progress/bulk",
      {
        params: {
          lessonIds: lessonIds.join(","),
        },
      },
    );
    return res.data.data;
  },

  updateLessonProgress: async (lessonId: number, currentOrderIndex: number) => {
    await http.put<ApiEnvelope<void>>(
      "/api/lesson-writings/progress",
      { lessonWritingId: lessonId, currentOrderIndex },
    );
  },

  gradeAnswer: async (request: GradingRequest) => {
    const res = await http.post<ApiEnvelope<GradingResponse>>(
      "/api/lesson-writings/grade",
      request,
    );
    return res.data.data;
  },

  getMyLessons: async (params?: {
    page?: number;
    size?: number;
  }) => {
    const res = await http.get<ApiEnvelope<SpringPage<UserLessonProgressResponse>>>(
      "/api/lesson-writings/my-lessons",
      { params },
    );
    return res.data.data;
  },

  getTranslationHistory: async (params?: {
    page?: number;
    size?: number;
  }) => {
    const res = await http.get<ApiEnvelope<SpringPage<UserTranslationHistoryResponse>>>(
      "/api/lesson-writings/history",
      { params },
    );
    return res.data.data;
  },
};
