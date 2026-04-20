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
  };
};

export type ApiError = {
  code?: number;
  message: string;
};

export type LessonVocab = {
  id: number;
  name: string;
  createBy: string;
  userId?: number;
  levelId?: number;
  createdAt: string;
  updatedAt: string;
  deleteFlag: boolean;
};

export type Vocabulary = {
  id: number;
  term: string;
  vi: string;
  type: string;
  pronunciation: string;
  example: string;
  audioUrl?: string;
  imageUrl?: string;
  lessonVocabId: number;
  userId?: number;
};

