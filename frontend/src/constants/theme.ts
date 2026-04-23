import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { Colors } from './colors';

const LightColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  textPrimary: '#1A1D26',
  textSecondary: '#70778C',
  border: '#EEF0F6',
};

export const AppLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0066FF',
    primaryContainer: '#DBEAFE',
    secondary: '#8B5CF6',
    secondaryContainer: '#EDE9FE',
    tertiary: '#10B981',
    tertiaryContainer: '#DCFCE7',
    background: LightColors.background,
    surface: LightColors.surface,
    surfaceVariant: LightColors.surfaceVariant,
    onBackground: LightColors.textPrimary,
    onSurface: LightColors.textPrimary,
    onSurfaceVariant: LightColors.textSecondary,
    outline: LightColors.border,
    error: '#EF4444',
    onPrimary: '#FFFFFF',
  },
  fonts: {
    ...MD3LightTheme.fonts,
  },
};

export const AppDarkTheme = {
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

export type AppThemeType = typeof AppLightTheme;
