// Tier 3: component tokens for loading states. A stable hook if the loading look changes.
import { borderAlpha } from '@/theme/tokens';

export const skeleton = {
  bg: 'bg-surface-2',   // placeholder bars, circles and tiles
  row: 'bg-surface-1',  // the row they sit in
  // A placeholder for a forest card is forest too, so the real card doesn't flash in over a
  // pale one. Its bars use the info-chip tint.
  emphasisCard: 'bg-emphasis',
  emphasisBar: 'bg-emphasis-fg/[0.12]',
} as const;

// Spinner (react-native-svg): ring = fg at border-strong alpha, arc = primary.
//   const c = useThemeColors();
//   <Circle stroke={c.fg} strokeOpacity={spinner.trackOpacity} … /> <Path stroke={c.primary} … />
// On a coloured button the ring is stronger (onColorTrackOpacity): at border-strong alpha only the
// arc showed, so the spinner looked smaller than the retry icon it replaces.
export const spinner = { trackOpacity: borderAlpha.borderStrong, onColorTrackOpacity: 0.45 } as const;
