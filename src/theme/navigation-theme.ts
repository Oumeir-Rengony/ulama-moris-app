// React Navigation theme built from the semantic tokens, so stack transitions and the area
// behind screens use our ground colour and never flash white or black.
import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

import { borderAlpha, useThemeColors } from './tokens';

// "#292D25" + 0.1 → "rgba(41, 45, 37, 0.1)". Matches the `border` class (fg at 10%).
function hexWithAlpha(hex: string, alpha: number): string {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function useNavigationTheme(isDark: boolean): Theme {
  const colors = useThemeColors();

  // Fonts come from React Navigation's defaults. Every screen draws its own header with the
  // Manrope `Text` component, so navigation never renders text with these fonts.
  let baseTheme = DefaultTheme;
  if (isDark) {
    baseTheme = DarkTheme;
  }

  return {
    ...baseTheme,
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.bg,
      card: colors.bg,
      text: colors.fg,
      border: hexWithAlpha(colors.fg, borderAlpha.border),
      notification: colors.danger,
    },
  };
}
