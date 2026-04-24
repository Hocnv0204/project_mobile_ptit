import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'vi' | 'en';

const LANGUAGE_STORAGE_KEY = 'app_language';

interface SettingsState {
  language: AppLanguage;
  isHydrated: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'vi',
  isHydrated: false,
  setLanguage: async (language) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    set({ language });
  },
  hydrate: async () => {
    const stored = (await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)) as AppLanguage | null;
    set({ language: stored === 'en' ? 'en' : 'vi', isHydrated: true });
  },
}));

