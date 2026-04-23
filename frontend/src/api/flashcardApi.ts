import { http } from './http';
import { ApiEnvelope, VocabularyStatus } from './types';

export type FlashcardCard = {
  id: number;
  vocabularyId: number;
  term: string;
  vi: string;
  type: string;
  pronunciation: string;
  example: string;
  audioUrl?: string;
  imageUrl?: string;

  repetition: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewDate: string;
  lastReviewedAt?: string;
  status: VocabularyStatus;
};

export type FlashcardSession = {
  lessonVocabId: number;
  dueCount: number;
  upcomingCount: number;
  dueCards: FlashcardCard[];
};

export type SubmitReviewRequest = {
  vocabularyId: number;
  quality: number; // 0-5
};

export type ReviewResult = {
  vocabularyId: number;
  quality: number;
  easeFactorBefore: number;
  easeFactorAfter: number;
  intervalBefore: number;
  intervalAfter: number;
  nextReviewDate: string;
  repetition: number;
};

export const flashcardApi = {
  getSession: async (lessonVocabId: number, mode: 'DUE' | 'ALL' = 'DUE') => {
    const res = await http.get<ApiEnvelope<FlashcardSession>>(`/api/flashcard/${lessonVocabId}/session?mode=${mode}`);
    return res.data;
  },
  submitReview: async (payload: SubmitReviewRequest) => {
    const res = await http.post<ApiEnvelope<ReviewResult>>('/api/flashcard/review', payload);
    return res.data;
  },
};

