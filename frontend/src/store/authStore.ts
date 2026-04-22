import { create } from 'zustand';
import { saveTokens, clearTokens, getAccessToken, getRefreshToken, getUser } from '../utils/tokenStorage';

interface UserInfo {
  id: number;
  email: string;
  username: string;
  fullName: string;
  levelId: number | null;
  roles: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (data: { accessToken: string; refreshToken: string; user: UserInfo }) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  setAuth: async (data) => {
    await saveTokens(data.accessToken, data.refreshToken, data.user);
    set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      isAuthenticated: true,
    });
  },
  logout: async () => {
    await clearTokens();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
  hydrate: async () => {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    const user = await getUser();
    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: !!accessToken,
      isHydrated: true,
    });
  },
}));
