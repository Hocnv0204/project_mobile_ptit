import { http } from './http';
import { ApiEnvelope } from './types';

export type QuizMode = 'EN_TO_VI' | 'VI_TO_EN' | 'MIXED';
export type QuizType = 'MULTIPLE_CHOICE' | 'ESSAY';

export interface QuizQuestion {
  questionIndex: number;
  total: number;
  vocabularyId: number;
  mode: 'EN_TO_VI' | 'VI_TO_EN';
  question: string;
  options: string[]; // 4 lựa chọn (chỉ có trong trắc nghiệm)
}

export interface QuizSession {
  lessonVocabId: number;
  mode: QuizMode;
  questions: QuizQuestion[];
}

export interface QuizCheckResult {
  correct: boolean;
  correctAnswer: string;
  explanation?: string;
}

export interface FillBlankQuestion {
  questionIndex: number;
  total: number;
  vocabularyId: number;
  sentence: string;
  hint: string;
  wordLength: number;
}

export interface FillBlankSession {
  lessonVocabId: number;
  questions: FillBlankQuestion[];
}

export const quizApi = {
  /** Sinh toàn bộ session câu hỏi trắc nghiệm */
  generateSession: async (lessonVocabId: number, mode: QuizMode = 'MIXED') => {
    const res = await http.get<ApiEnvelope<QuizSession>>(
      `/api/quiz/lesson/${lessonVocabId}/session?mode=${mode}`,
    );
    return res.data;
  },

  /** Chấm điểm 1 câu (trắc nghiệm hoặc tự luận) */
  checkAnswer: async (vocabularyId: number, mode: 'EN_TO_VI' | 'VI_TO_EN', answer: string) => {
    const res = await http.post<ApiEnvelope<QuizCheckResult>>('/api/quiz/check', {
      vocabularyId,
      mode,
      answer,
    });
    return res.data;
  },

  /** Sinh session điền từ vào chỗ trống (AI) */
  generateFillBlankSession: async (lessonVocabId: number) => {
    const res = await http.get<ApiEnvelope<FillBlankSession>>(
      `/api/quiz/lesson/${lessonVocabId}/fill-blank`,
    );
    return res.data;
  },
};
