import Pause from 'lucide-react-native/icons/pause';
import Play from 'lucide-react-native/icons/play';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { useThemeColors, useThemeShadows, type SemanticColor } from '@/theme/tokens';

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
  // Shown at 35% and not pressable: the players' play button while the lecture's audio didn't load.
  disabled?: boolean;
};

type VariantStyle = {
  buttonClass: string;
  iconSize: number;
  iconColor: SemanticColor;
};

function getVariantStyle(variant: PlayPauseVariant, isDark: boolean): VariantStyle {
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

  // nowPlaying: 96 × 76. Its fill and rounded shape are drawn by NowPlayingButtonShape, which
  // animates the corner radius.
  return { buttonClass: 'h-[76px] w-24', iconSize: 30, iconColor: 'primaryFg' };
}

const playingRadius = 26;
const pausedRadius = 38;
const radiusChangeMs = 250;

// The Now Playing button's fill: squarer while playing (radius 26), rounder while paused (38).
// The radius animates over 0.25 s, or changes at once when the user asks for less motion.
// A Reanimated view takes plain style values only, so the colour comes from useThemeColors().
function NowPlayingButtonShape({ isPlaying }: { isPlaying: boolean }) {
  const colors = useThemeColors();
  const shadows = useThemeShadows();
  const isReduceMotionOn = useReducedMotion();

  let targetRadius = pausedRadius;
  if (isPlaying) {
    targetRadius = playingRadius;
  }

  const radius = useSharedValue(targetRadius);

  useEffect(() => {
    if (isReduceMotionOn) {
      radius.set(targetRadius);
      return;
    }
    radius.set(withTiming(targetRadius, { duration: radiusChangeMs }));
  }, [isReduceMotionOn, radius, targetRadius]);

  const radiusStyle = useAnimatedStyle(() => {
    return { borderRadius: radius.get() };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.primary },
        { boxShadow: shadows.playButton },
        radiusStyle,
      ]}
    />
  );
}

export function PlayPauseButton({ state, variant, accessibilityLabel, onPress, disabled = false }: PlayPauseButtonProps) {
  const { colorScheme } = useColorScheme();

  const isPlaying = state === 'pause';
  const isDark = colorScheme === 'dark';
  const variantStyle = getVariantStyle(variant, isDark);

  let glyph = Play;
  if (isPlaying) {
    glyph = Pause;
  }

  let shape = null;
  if (variant === 'nowPlaying') {
    shape = <NowPlayingButtonShape isPlaying={isPlaying} />;
  }

  let opacityClass = 'active:opacity-80';
  if (disabled) {
    opacityClass = 'opacity-[0.35]';
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`shrink-0 items-center justify-center ${opacityClass} ${variantStyle.buttonClass}`}
    >
      {shape}
      {/* The icon sits in a View so it draws above the Now Playing fill on web. The fill is
          absolutely positioned, and in CSS a positioned element paints over an unpositioned one
          (the bare <svg>) whatever their order. react-native-web makes every View positioned, so
          the order decides again, as it does on iOS and Android. */}
      <View>
        <Icon icon={glyph} size={variantStyle.iconSize} color={variantStyle.iconColor} filled />
      </View>
    </Pressable>
  );
}
