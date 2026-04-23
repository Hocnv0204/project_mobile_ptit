import axiosInstance from "./axios";

export interface LessonVocab {
  id: number;
  name: string;
  levelId: number;
}

export interface CreateLessonVocabRequest {
  name: string;
  levelId: number;
}

export const lessonVocabApi = {
  getAll: () => axiosInstance.get("/api/lesson-vocab"),
  getById: (id: number) => axiosInstance.get(`/api/lesson-vocab/${id}`),
  create: (data: CreateLessonVocabRequest) =>
    axiosInstance.post("/api/lesson-vocab", data),
  update: (id: number, data: CreateLessonVocabRequest) =>
    axiosInstance.put(`/api/lesson-vocab/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/api/lesson-vocab/${id}`),
};
