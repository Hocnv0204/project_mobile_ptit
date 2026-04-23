import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store';
import { AppDarkTheme, AppLightTheme } from './src/constants/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { ToastProvider } from './src/components/ToastProvider';
import { useSettingsStore } from './src/store/settingsStore';

export default function App() {
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const settingsHydrated = useSettingsStore((s) => s.isHydrated);

  useEffect(() => {
    hydrateSettings().catch(() => undefined);
  }, [hydrateSettings]);

  if (!settingsHydrated) return null;

  const theme = themeMode === 'dark' ? AppDarkTheme : AppLightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <ToastProvider>
              <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
              <RootNavigator />
            </ToastProvider>
          </SafeAreaProvider>
        </PaperProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
