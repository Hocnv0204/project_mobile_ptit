import axiosInstance from "./axios";

export interface Level {
  id: number;
  name: string;
  description: string;
}

export interface CreateLevelRequest {
  name: string;
  description?: string;
}

export const levelApi = {
  getAll: () => axiosInstance.get("/api/levels"),
  getById: (id: number) => axiosInstance.get(`/api/levels/${id}`),
  create: (data: CreateLevelRequest) => axiosInstance.post("/api/levels", data),
  update: (id: number, data: CreateLevelRequest) =>
    axiosInstance.put(`/api/levels/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/api/levels/${id}`),
};
