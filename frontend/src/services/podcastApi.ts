import { apiClient } from './apiClient';

export interface PodcastResponse {
  id: number;
  title: string;
  description: string;
  audioUrl: string;
  thumbnailUrl: string;
  levelId: number;
  topicId: number;
  duration: number;
  orderIndex: number;
  createdAt: string;
}

export interface DialogueItem {
  id: number;
  speaker: string;
  content: string;
  orderIndex: number;
  timestampStart: number;
}

export interface VocabItem {
  id: number;
  term: string;
  definition: string;
  pronunciation: string;
  example: string;
  wordType: string;
  vocabType: string;
  orderIndex: number;
}

export interface PodcastDetailResponse extends PodcastResponse {
  dialogues: DialogueItem[];
  vocab: VocabItem[];
}

export const podcastApi = {
  getAllPodcasts: async () => {
    const response = await apiClient.get<{ data: PodcastResponse[] }>('/api/podcasts');
    return response.data.data;
  },

  getPodcastById: async (id: number) => {
    const response = await apiClient.get<{ data: PodcastDetailResponse }>(`/api/podcasts/${id}`);
    return response.data.data;
  },
};
