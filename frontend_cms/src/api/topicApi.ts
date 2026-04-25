import axiosInstance from "./axios";

export interface Topic {
  id: number;
  name: string;
  description: string;
  type: string;
  deleteFlag: boolean;
  createdAt: string;
}

export const topicApi = {
  getAll: (params?: { searchTerm?: string; isDeleted?: boolean; page?: number; size?: number }) =>
    axiosInstance.get("/api/admin/topics", { params }),
};
