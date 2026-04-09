import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store';
import { AppTheme } from './src/constants/theme';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PaperProvider theme={AppTheme}>
          <SafeAreaProvider>
            <StatusBar style="light" backgroundColor="#0F0F1A" />
            <RootNavigator />
          </SafeAreaProvider>
        </PaperProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
