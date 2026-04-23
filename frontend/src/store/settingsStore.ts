import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'vi' | 'en';
export type ThemeMode = 'light' | 'dark';

const LANGUAGE_STORAGE_KEY = 'app_language';
const THEME_STORAGE_KEY = 'app_theme_mode';

interface SettingsState {
  language: AppLanguage;
  themeMode: ThemeMode;
  isHydrated: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'vi',
  themeMode: 'light',
  isHydrated: false,
  setLanguage: async (language) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    set({ language });
  },
  setThemeMode: async (themeMode) => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
    set({ themeMode });
  },
  hydrate: async () => {
    const stored = (await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)) as AppLanguage | null;
    const storedTheme = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as ThemeMode | null;
    set({
      language: stored === 'en' ? 'en' : 'vi',
      themeMode: storedTheme === 'dark' ? 'dark' : 'light',
      isHydrated: true,
    });
  },
}));

