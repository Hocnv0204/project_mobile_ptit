import { useTheme } from 'react-native-paper';

export function useAppColors() {
  const theme = useTheme();
  const c = theme.colors;

  return {
    theme,
    background: c.background,
    surface: c.surface,
    card: c.elevation?.level1 ?? c.surface,
    text: c.onBackground,
    mutedText: c.onSurfaceVariant,
    border: c.outline,
    primary: c.primary,
  };
}

