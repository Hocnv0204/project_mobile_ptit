import { http } from './http';
import { ApiEnvelope } from './types';

// ── Types ────────────────────────────────────────────

export interface DictationItem {
  id: string;
  title: string;
  mediaUrl: string;
  totalSegments: number;
  progressPercent: number | null;
}

export interface DictationSegment {
  id: string;
  sequenceOrder: number;
  startTime: number;
  endTime: number;
  blankText: string;
  answerKeys: string[];
}

export interface DictationProgress {
  id: string | null;
  dictationId: string;
  currentSequence: number;
  completedSegments: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercent: number;
  updatedAt: string | null;
}

export interface SubmitSegmentResult {
  isCorrect: boolean;
  correctAnswers: string[];
}

// ── API ──────────────────────────────────────────────

export const dictationApi = {
  /** Danh sách bài dictation + % tiến độ của user */
  getAll: async () => {
    const res = await http.get<ApiEnvelope<DictationItem[]>>('/api/dictations');
    return res.data;
  },

  /** Lấy tất cả segments của bài dictation */
  getSegments: async (dictationId: string) => {
    const res = await http.get<ApiEnvelope<DictationSegment[]>>(
      `/api/dictations/${dictationId}/segments`,
    );
    return res.data;
  },

  /** Lấy tiến độ hiện tại */
  getProgress: async (dictationId: string) => {
    const res = await http.get<ApiEnvelope<DictationProgress>>(
      `/api/user/progress/${dictationId}`,
    );
    return res.data;
  },

  /** Đồng bộ tiến độ (upsert) */
  syncProgress: async (body: {
    dictationId: string;
    currentSequence: number;
    completedSegments: number;
  }) => {
    const res = await http.post<ApiEnvelope<DictationProgress>>(
      '/api/user/progress/sync',
      body,
    );
    return res.data;
  },

  /** Đánh dấu hoàn thành */
  complete: async (progressId: string) => {
    const res = await http.patch<ApiEnvelope<DictationProgress>>(
      `/api/user/progress/${progressId}/complete`,
    );
    return res.data;
  },

  /** Nộp đáp án segment */
  submitSegment: async (
    dictationId: string,
    body: { sequenceOrder: number; userInput: string[] },
  ) => {
    const res = await http.post<ApiEnvelope<SubmitSegmentResult>>(
      `/api/dictations/${dictationId}/submit-segment`,
      body,
    );
    return res.data;
  },
};
