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

