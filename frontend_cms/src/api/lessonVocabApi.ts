import axiosInstance from "./axios";

export interface LessonVocab {
  id: number;
  name: string;
  levelId: number | null;
  userId: number;
  createBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Phần `data` của BaseResponse khi gọi GET /api/lesson-vocab/admin (Spring Page). */
export type LessonVocabAdminPage = {
  content: LessonVocab[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export interface CreateLessonVocabRequest {
  name: string;
  levelId: number;
}

export const lessonVocabApi = {
  /** Không truyền params → backend dùng mặc định page/size. */
  getAll: () => axiosInstance.get("/api/lesson-vocab/admin"),

  getAdminPaged: (params: {
    page?: number;
    size?: number;
    sort?: string;
    order?: string;
  } = {}) =>
    axiosInstance.get("/api/lesson-vocab/admin", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort,
        order: params.order,
      },
    }),
  getById: (id: number) => axiosInstance.get(`/api/lesson-vocab/${id}`),
  create: (data: CreateLessonVocabRequest) =>
    axiosInstance.post("/api/lesson-vocab", data),
  update: (id: number, data: CreateLessonVocabRequest) =>
    axiosInstance.put(`/api/lesson-vocab/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/api/lesson-vocab/${id}`),
};
