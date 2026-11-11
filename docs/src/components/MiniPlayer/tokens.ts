// Tier 3: component tokens for the mini player. Point at semantic tokens; primitives only where no role fits.
// Exists because the bar maps to a DIFFERENT role per theme (inverse in light, emphasis in dark).
import { primitives } from '../../theme/primitives';
import { lightColors, darkColors } from '../../theme/tokens';

export const miniPlayer = {
  bg: 'bg-inverse dark:bg-emphasis',
  // In dark, a 1px hairline separates the forest bar from the charcoal ground.
  outline: 'dark:border dark:border-border',
  thumbBg: 'bg-emphasis',                      // 44px artwork thumb behind the small rosette
  fg: 'text-inverse-fg dark:text-emphasis-fg',
  fgMuted: 'text-emphasis-fg-muted',           // scholar name
  progress: 'bg-secondary',                    // 3px line on the bottom edge
  errorLine: 'bg-danger',                      // progress line when the lecture fails to load
  retryBg: 'bg-emphasis-fg/[0.12]',            // translucent circle behind the retry icon
  // No semantic role fits light clay text on a dark bar yet → primitive (clay-200). Promote to a
  // semantic token (e.g. emphasis-danger-fg) when a second component needs it.
  errorFg: 'text-[#E6BCA9]',
} as const;

// JS values for icons (lucide `color` prop) and SVG.
export const miniPlayerColors = {
  light: { fg: lightColors.inverseFg, fgMuted: lightColors.emphasisFgMuted, errorFg: primitives.clay[200] },
  dark: { fg: darkColors.emphasisFg, fgMuted: darkColors.emphasisFgMuted, errorFg: primitives.clay[200] },
} as const;
