import { http } from '../http';
import { ApiEnvelope, PageResponse } from '../types';
import { TopicResponse } from './types';

export const topicApi = {
  getTopics: async (params?: {
    searchTerm?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const res = await http.get<ApiEnvelope<PageResponse<TopicResponse>>>('/api/topics', { params });
    return res.data.data;
  },
};
