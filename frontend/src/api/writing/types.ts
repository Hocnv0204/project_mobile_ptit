export type LessonSummaryResponse = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
};

export type SuggestVocabularyResponse = {
  id: number;
  term: string;
  vietnamese: string;
  type: string;
  pronunciation: string;
  example: string;
};

export type LessonSentenceResponse = {
  id: number;
  sentenceVi: string;
  orderIndex: number;
  suggestVocabularies: SuggestVocabularyResponse[];
};

export type LessonResponse = {
  id: number;
  name: string;
  description: string;
  totalSentences: number;
  sentences: LessonSentenceResponse[];
};

export type UserLessonProgressResponse = {
  id: number;
  userId: number;
  lessonWritingId: number;
  lessonName: string;
  lessonDescription: string;
  currentOrderIndex: number;
  totalSentences: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type GradingRequest = {
  question: string;
  answer: string;
  suggestVocabularies: string[];
  sentenceId: number;
  aiProvider?: string;
};

export type GradingResponse = {
  accuracy_score: number;
  accuracy_label: string;
  suggested_translation: string;
  diff: Array<{
    type: "keep" | "delete" | "insert";
    text: string;
  }>;
  feedback_points: Array<{
    type: "error" | "warning" | "correct";
    user_text: string;
    correct_text: string;
    explanation: string;
  }>;
  overall_comment: string;
};

export type UserTranslationHistoryResponse = {
  id: number;
  userId: number;
  lessonWritingId: number;
  sentenceId: number;
  userAnswer: string;
  aiFeedbackJson: string;
  accuracyScore: number;
  createdAt: string;
  sentenceVi: string;
};
