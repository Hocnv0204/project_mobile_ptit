import { MD3DarkTheme } from 'react-native-paper';
import { Colors } from './colors';

export const AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryDark,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryDark,
    tertiary: Colors.accent,
    tertiaryContainer: Colors.accentDark,
    background: Colors.background,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceVariant,
    onBackground: Colors.textPrimary,
    onSurface: Colors.textPrimary,
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
    error: Colors.error,
    onPrimary: Colors.textInverse,
  },
  fonts: {
    ...MD3DarkTheme.fonts,
  },
};

export type AppThemeType = typeof AppTheme;
