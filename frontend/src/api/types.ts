export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: number;
  user: {
    id: number;
    email: string;
    username: string;
    fullName: string;
    roles?: string[];
    levelId?: number;
  };
};

export type ApiError = {
  code?: number;
  message: string;
};

export interface LessonVocab {
  id: number;
  name: string;
  userId: number | null;
  createBy: string | null;
  levelId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vocabulary {
  id: number;
  term: string;
  vi: string;
  type: string;
  pronunciation: string;
  example: string;
  audioUrl?: string;
  imageUrl?: string;
  lessonVocabId?: number;
}

export type VocabularyStatus = 'NEW' | 'DUE_TODAY' | 'OVERDUE' | 'UPCOMING';

export type VocabularyWithStatus = Vocabulary & {
  status: VocabularyStatus;
  nextReviewDate?: string;
  daysUntilReview?: number;
};

export type PageResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  alreadyCheckedInToday: boolean;
}
