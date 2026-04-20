import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  fullName: string;
  roles?: string[];
};

export type AuthState = {
  isHydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  accessTokenExpiresIn: number | null;
  user: AuthUser | null;
};

const AUTH_STORAGE_KEY = 'auth.v1';

const initialState: AuthState = {
  isHydrated: false,
  accessToken: null,
  refreshToken: null,
  tokenType: null,
  accessTokenExpiresIn: null,
  user: null,
};

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null as AuthState | null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    return null as AuthState | null;
  }
});

export const persistAuth = async (state: Pick<
  AuthState,
  'accessToken' | 'refreshToken' | 'tokenType' | 'accessTokenExpiresIn' | 'user'
>) => {
  await AsyncStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      isHydrated: true,
      ...state,
    }),
  );
};

export const clearPersistedAuth = async () => {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        accessTokenExpiresIn: number;
        user: AuthUser;
      }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.tokenType = action.payload.tokenType;
      state.accessTokenExpiresIn = action.payload.accessTokenExpiresIn;
      state.user = action.payload.user;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenType = null;
      state.accessTokenExpiresIn = null;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(hydrateAuth.fulfilled, (state, action) => {
      state.isHydrated = true;
      if (!action.payload) return;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.tokenType = action.payload.tokenType;
      state.accessTokenExpiresIn = action.payload.accessTokenExpiresIn;
      state.user = action.payload.user;
    });
    builder.addCase(hydrateAuth.rejected, (state) => {
      state.isHydrated = true;
    });
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;

