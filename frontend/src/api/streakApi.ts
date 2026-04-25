import { http } from './http';
import { ApiEnvelope } from './types';

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  alreadyCheckedInToday: boolean;
}

export const streakApi = {
  getStreak: async () => {
    const res = await http.get<ApiEnvelope<StreakResponse>>('/api/streaks');
    return res.data;
  },
  checkIn: async () => {
    const res = await http.post<ApiEnvelope<StreakResponse>>('/api/streaks/check-in');
    return res.data;
  },
};
