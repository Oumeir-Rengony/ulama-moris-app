import Pause from 'lucide-react-native/icons/pause';
import Play from 'lucide-react-native/icons/play';
import { useColorScheme } from 'nativewind';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useThemeShadows, type SemanticColor } from '@/theme/tokens';

// Its own component, with explicit variants, because the size, fill and icon colour change with
// where the button sits: a list row, the Continue listening card, the mini player or Now Playing.
type PlayPauseVariant = 'row' | 'rowActive' | 'hero' | 'mini' | 'nowPlaying';

type PlayPauseButtonProps = {
  // The icon to show: 'play' while paused or idle, 'pause' while playing.
  state: 'play' | 'pause';
  variant: PlayPauseVariant;
  // "Play {title}" / "Pause {title}" in lists; "Play" / "Pause" in the players.
  accessibilityLabel: string;
  onPress?: () => void;
};

type VariantStyle = {
  buttonClass: string;
  iconSize: number;
  iconColor: SemanticColor;
};

function getVariantStyle(variant: PlayPauseVariant, isPlaying: boolean, isDark: boolean): VariantStyle {
  if (variant === 'row') {
    return { buttonClass: 'h-touch w-touch rounded-full bg-bg', iconSize: 18, iconColor: 'fg' };
  }
  if (variant === 'rowActive') {
    return { buttonClass: 'h-touch w-touch rounded-full bg-primary', iconSize: 18, iconColor: 'primaryFg' };
  }
  if (variant === 'hero') {
    return { buttonClass: 'h-[52px] w-[52px] rounded-full bg-secondary', iconSize: 22, iconColor: 'secondaryFg' };
  }
  if (variant === 'mini') {
    // Same colour as miniPlayer.fg: inverse-fg on the light bar, emphasis-fg on the dark bar.
    let miniIconColor: SemanticColor = 'inverseFg';
    if (isDark) {
      miniIconColor = 'emphasisFg';
    }
    return { buttonClass: 'h-touch w-touch rounded-full bg-transparent', iconSize: 22, iconColor: miniIconColor };
  }

  // nowPlaying: 96 × 76, a squarer shape while playing (radius 26) and rounder while paused (38).
  // The change will be animated in a later stage.
  let radiusClass = 'rounded-[38px]';
  if (isPlaying) {
    radiusClass = 'rounded-[26px]';
  }
  return { buttonClass: `h-[76px] w-24 bg-primary ${radiusClass}`, iconSize: 30, iconColor: 'primaryFg' };
}

export function PlayPauseButton({ state, variant, accessibilityLabel, onPress }: PlayPauseButtonProps) {
  const { colorScheme } = useColorScheme();
  const shadows = useThemeShadows();

  const isPlaying = state === 'pause';
  const isDark = colorScheme === 'dark';
  const variantStyle = getVariantStyle(variant, isPlaying, isDark);

  let glyph = Play;
  if (isPlaying) {
    glyph = Pause;
  }

  let shadowStyle = undefined;
  if (variant === 'nowPlaying') {
    shadowStyle = { boxShadow: shadows.playButton };
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={`shrink-0 items-center justify-center active:opacity-80 ${variantStyle.buttonClass}`}
      style={shadowStyle}
    >
      <Icon icon={glyph} size={variantStyle.iconSize} color={variantStyle.iconColor} filled />
    </Pressable>
  );
}
