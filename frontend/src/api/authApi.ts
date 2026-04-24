import { http } from './http';
import { ApiEnvelope, AuthResponse } from './types';

export type RegisterBody = {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
};

export type VerifyOtpBody = {
  email: string;
  otp: string;
};

export type ResendOtpBody = {
  email: string;
};

export type LoginBody = {
  username: string;
  password: string;
};

export type GoogleLoginBody = {
  idToken: string;
};

export type RefreshBody = {
  refreshToken: string;
};

export type ChangePasswordBody = {
  oldPassword: string;
  newPassword: string;
};

export type ForgotPasswordRequestOtpBody = {
  email: string;
};

export type ForgotPasswordResetBody = {
  email: string;
  otp: string;
  newPassword: string;
};

export const authApi = {
  async register(body: RegisterBody) {
    const res = await http.post<ApiEnvelope<null>>('/api/auth/register', body);
    return res.data;
  },
  async verifyOtp(body: VerifyOtpBody) {
    const res = await http.post<ApiEnvelope<AuthResponse>>('/api/auth/verify-otp', body);
    return res.data;
  },
  async resendOtp(body: ResendOtpBody) {
    const res = await http.post<ApiEnvelope<null>>('/api/auth/resend-otp', body);
    return res.data;
  },
  async login(body: LoginBody) {
    const res = await http.post<ApiEnvelope<AuthResponse>>('/api/auth/login', body);
    return res.data;
  },
  async google(body: GoogleLoginBody) {
    const res = await http.post<ApiEnvelope<AuthResponse>>('/api/auth/google', body);
    return res.data;
  },
  async refresh(body: RefreshBody) {
    const res = await http.post<ApiEnvelope<AuthResponse>>('/api/auth/refresh', body);
    return res.data;
  },
  async logout(body: RefreshBody) {
    const res = await http.post<ApiEnvelope<null>>('/api/auth/logout', body);
    return res.data;
  },
  async changePassword(body: ChangePasswordBody) {
    const res = await http.put<ApiEnvelope<null>>('/api/auth/change-password', body);
    return res.data;
  },
  async forgotPasswordRequestOtp(body: ForgotPasswordRequestOtpBody) {
    const res = await http.post<ApiEnvelope<null>>('/api/auth/forgot-password/request-otp', body);
    return res.data;
  },
  async forgotPasswordReset(body: ForgotPasswordResetBody) {
    const res = await http.put<ApiEnvelope<null>>('/api/auth/forgot-password/reset', body);
    return res.data;
  },
  async me() {
    const res = await http.get<ApiEnvelope<{ id: number; email: string; username: string; fullName: string }>>(
      '/api/auth/me',
    );
    return res.data;
  },
};

