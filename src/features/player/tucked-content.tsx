import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { primitives } from '@/theme/primitives';

import { TUCK } from './player-motion-config';
import { getOpenness } from './player-surface-geometry';
import { enterY, expand, reducedMotion, readSurfaceGeometry } from './player-surface-motion';
import { usePlayerStore } from './player.store';

// What shows around the tucked screen's rounded corners, and the colour of the dim. A primitive
// because it is the same dark in both themes, like the space behind an iOS sheet.
const tuckBackdropColor = primitives.charcoal[900];

// The tabs (tab bar included) as one layer that shrinks, rounds its corners and dims while Now
// Playing covers it. Wrapping the whole navigator means Android scales one composited layer.
export function TuckedContent({ children }: { children: ReactNode }) {
  const presentation = usePlayerStore((state) => state.nowPlayingPresentation);
  // Changes only at phase boundaries, never per frame. Covers the swipe too ('open').
  const isPlayerInFront = presentation !== 'closed' && presentation !== 'miniLeaving';

  const tuckStyle = useAnimatedStyle(() => {
    const openness = getOpenness(expand.get(), enterY.get(), readSurfaceGeometry().windowHeight);
    const borderRadius = interpolate(openness, [0, 1], [0, TUCK.radius]);

    // Reduce Motion: dim only, no scale and no move.
    if (reducedMotion.get()) {
      return { borderRadius, transform: [{ translateY: 0 }, { scale: 1 }] };
    }

    const scale = interpolate(openness, [0, 1], [1, TUCK.scale]);
    return {
      borderRadius,
      transform: [{ translateY: openness * TUCK.translateY }, { scale }],
    };
  });

  const dimStyle = useAnimatedStyle(() => {
    const openness = getOpenness(expand.get(), enterY.get(), readSurfaceGeometry().windowHeight);
    return { opacity: openness * TUCK.dimOpacity };
  });

  return (
    <View className="flex-1" style={{ backgroundColor: tuckBackdropColor }}>
      <Animated.View
        style={[{ flex: 1, overflow: 'hidden' }, tuckStyle]}
        // A bitmap of the tabs while they move. Off when closed: the texture costs memory.
        renderToHardwareTextureAndroid={isPlayerInFront}
        shouldRasterizeIOS={isPlayerInFront}
        // Screen readers must not reach the tabs behind Now Playing.
        accessibilityElementsHidden={isPlayerInFront}
        importantForAccessibility={isPlayerInFront ? 'no-hide-descendants' : 'auto'}
      >
        {children}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: tuckBackdropColor }, dimStyle]}
        />
      </Animated.View>
    </View>
  );
}
