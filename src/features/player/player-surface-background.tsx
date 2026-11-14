import { useColorScheme } from 'nativewind';
import { memo } from 'react';
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import { useThemeColors } from '@/theme/tokens';

import { MINI_DROP_DISTANCE_PX } from './player-motion-config';
import { getBackgroundFrame } from './player-surface-geometry';
import { enterY, expand, miniDrop, readSurfaceGeometry, reducedMotion } from './player-surface-motion';

function clampShare(value: number): number {
  'worklet';
  return Math.min(Math.max(value, 0), 1);
}

// The bar's background, which grows into Now Playing's background. A childless view, so
// animating its frame (left / top / width / height) is cheap: the one layout-property exception
// to "transforms and opacity only".
// Reanimated views take plain styles here: NativeWind classes don't reach Animated.View.
export const SurfaceBackground = memo(function SurfaceBackground() {
  const { colorScheme } = useColorScheme();
  const colors = useThemeColors();
  const isDark = colorScheme === 'dark';

  // The bar is inverse (charcoal) in light and emphasis (forest) in dark; Now Playing is bg.
  let barColor = colors.inverse;
  if (isDark) {
    barColor = colors.emphasis;
  }
  const fullColor = colors.bg;

  const frameStyle = useAnimatedStyle(() => {
    const geometry = readSurfaceGeometry();
    const expandValue = expand.get();
    const frame = getBackgroundFrame(expandValue, geometry.miniRect, geometry.windowWidth, geometry.windowHeight);
    const drop = miniDrop.get();
    let dropDistance = MINI_DROP_DISTANCE_PX;
    if (reducedMotion.get()) {
      dropDistance = 0;
    }

    return {
      left: frame.left,
      top: frame.top,
      width: frame.width,
      height: frame.height,
      borderRadius: frame.borderRadius,
      backgroundColor: interpolateColor(expandValue, [0, 0.6], [barColor, fullColor]),
      opacity: 1 - clampShare(drop),
      transform: [{ translateY: enterY.get() + drop * dropDistance }],
    };
  });

  // Dark mode only: the bar's 1 px outline, fading out as the bar starts to grow.
  const outlineStyle = useAnimatedStyle(() => {
    const geometry = readSurfaceGeometry();
    const expandValue = expand.get();
    const frame = getBackgroundFrame(expandValue, geometry.miniRect, geometry.windowWidth, geometry.windowHeight);
    const morphHidden = interpolate(expandValue, [0, 0.25], [0, 1], Extrapolation.CLAMP);
    const drop = miniDrop.get();
    let dropDistance = MINI_DROP_DISTANCE_PX;
    if (reducedMotion.get()) {
      dropDistance = 0;
    }

    return {
      left: frame.left,
      top: frame.top,
      width: frame.width,
      height: frame.height,
      opacity: (1 - morphHidden) * (1 - clampShare(drop)),
      transform: [{ translateY: drop * dropDistance }],
    };
  });

  return (
    <>
      {/* No shadow: on Android (development build) a Reanimated view with a shadow style wasn't
          drawn at all, so Now Playing had no sheet and the tabs showed through its text. */}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, frameStyle]} />
      {isDark ? (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, outlineStyle]}>
          {/* A plain View carries the classes. Its radius stays at the bar's 20: the outline has
              faded out by the time the corners have changed much. */}
          <View className="flex-1 rounded-mini border border-border" />
        </Animated.View>
      ) : null}
    </>
  );
});
