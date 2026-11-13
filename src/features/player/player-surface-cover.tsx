import { memo } from 'react';
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { CoverArt } from '@/components/artwork/cover-art';
import { useThemeColors, useThemeShadows } from '@/theme/tokens';

import { MINI_DROP_DISTANCE_PX } from './player-motion-config';
import { getCoverTransform, getEntranceProgress, getThumbRect, type Rect } from './player-surface-geometry';
import { enterY, expand, miniDrop, reducedMotion, readSurfaceGeometry } from './player-surface-motion';

// During a fresh entrance the cover rises 40 px and grows from 90 % as it arrives.
const ENTRANCE_RISE_PX = 40;
const ENTRANCE_START_SCALE = 0.9;

type SurfaceCoverProps = {
  // Where Now Playing's artwork sits, in window coordinates. The cover is laid out there and
  // moved onto the bar's thumbnail with transforms.
  coverRect: Rect;
};

// The one cover for both states: Now Playing's artwork, and the bar's thumbnail. Only transforms,
// opacity and its corner radius animate. The shadow stays at its final value.
export const SurfaceCover = memo(function SurfaceCover({ coverRect }: SurfaceCoverProps) {
  const shadows = useThemeShadows();
  const colors = useThemeColors();

  const outerStyle = useAnimatedStyle(() => {
    const geometry = readSurfaceGeometry();
    const thumbRect = getThumbRect(geometry.miniRect);
    const morph = getCoverTransform(expand.get(), thumbRect, geometry.coverRect);

    const entrance = getEntranceProgress(enterY.get(), geometry.windowHeight);
    const entranceArrival = interpolate(entrance, [0.1, 1], [0, 1], Extrapolation.CLAMP);
    const entranceRise = (1 - entranceArrival) * ENTRANCE_RISE_PX;
    const entranceScale = ENTRANCE_START_SCALE + (1 - ENTRANCE_START_SCALE) * entranceArrival;

    const drop = miniDrop.get();
    let dropDistance = MINI_DROP_DISTANCE_PX;
    if (reducedMotion.get()) {
      dropDistance = 0;
    }
    const dropHidden = Math.min(Math.max(drop, 0), 1);

    return {
      opacity: 1 - dropHidden,
      borderRadius: morph.borderRadius,
      // Translate first, then scale: the translation moves centre onto centre.
      transform: [
        { translateX: morph.translateX },
        { translateY: morph.translateY + enterY.get() + entranceRise + drop * dropDistance },
        { scale: morph.scale * entranceScale },
      ],
    };
  });

  const clipStyle = useAnimatedStyle(() => {
    const geometry = readSurfaceGeometry();
    const thumbRect = getThumbRect(geometry.miniRect);
    const morph = getCoverTransform(expand.get(), thumbRect, geometry.coverRect);
    return { borderRadius: morph.borderRadius };
  });

  // Two views: the outer one carries the shadow, the inner one clips the image to the radius.
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: coverRect.x, top: coverRect.y, width: coverRect.width, height: coverRect.height },
        { boxShadow: shadows.artwork },
        outerStyle,
      ]}
    >
      <Animated.View style={[{ flex: 1, overflow: 'hidden', backgroundColor: colors.emphasis }, clipStyle]}>
        <View className="flex-1">
          <CoverArt />
        </View>
      </Animated.View>
    </Animated.View>
  );
});
