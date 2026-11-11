// Tier 3: component tokens for loading states. A stable hook if the loading look changes.
import { borderAlpha } from '@/theme/tokens';

export const skeleton = {
  bg: 'bg-surface-2',   // placeholder bars, circles and tiles
  row: 'bg-surface-1',  // the row they sit in
} as const;

// Spinner (react-native-svg): ring = fg at border-strong alpha, arc = primary.
//   const c = useThemeColors();
//   <Circle stroke={c.fg} strokeOpacity={spinner.trackOpacity} … /> <Path stroke={c.primary} … />
export const spinner = { trackOpacity: borderAlpha.borderStrong } as const;
