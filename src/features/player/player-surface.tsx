import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeOut, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { closeNowPlaying } from './open-now-playing';
import { SurfaceBackground } from './player-surface-background';
import { SurfaceCover } from './player-surface-cover';
import { FullLayer } from './player-surface-full-layer';
import type { Rect } from './player-surface-geometry';
import { MiniLayer } from './player-surface-mini-layer';
import {
  riseMini,
  setPrefersReducedMotion,
  snapToRest,
  coverRectValue,
  miniRectValue,
  windowSizeValue,
  surfaceOpacity,
} from './player-surface-motion';
import {
  selectCurrentLecture,
  selectIsMiniPlayerVisible,
  usePlayerStore,
  type NowPlayingPresentation,
} from './player.store';

type PlayerSurfaceProps = {
  // Distance from the bottom of the tabs layout to the bar: the tab bar's height plus the gap.
  // 0 until the tab bar has been measured.
  bottomOffset: number;
};

function isNowPlayingInFront(presentation: NowPlayingPresentation): boolean {
  return presentation === 'opening' || presentation === 'open';
}

// The mini player and Now Playing, as one surface in two states, drawn over the tabs by
// (tabs)/_layout.tsx. Search is a root-stack screen, so it still covers it.
//
// Always mounted, so the geometry is known before the first open. It re-renders only when the
// presentation, the lecture or the bar's visibility changes: a few times per open or close,
// never per frame.
export function PlayerSurface({ bottomOffset }: PlayerSurfaceProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isReducedMotion = useReducedMotion();
  const lecture = usePlayerStore(selectCurrentLecture);
  const presentation = usePlayerStore((state) => state.nowPlayingPresentation);
  const isBarVisible = usePlayerStore(selectIsMiniPlayerVisible);

  useEffect(() => {
    setPrefersReducedMotion(isReducedMotion);
  }, [isReducedMotion]);

  // The window changed size (split screen, a foldable): write the geometry and jump to the
  // resting position, rather than animate from a stale size. Reads the presentation from the store
  // so the effect runs only when the size changes.
  useEffect(() => {
    windowSizeValue.set({ width: windowWidth, height: windowHeight });
    const currentPresentation = usePlayerStore.getState().nowPlayingPresentation;
    if (currentPresentation === 'closed' || currentPresentation === 'open') {
      snapToRest(currentPresentation === 'open');
    }
  }, [windowWidth, windowHeight]);

  // Android back collapses Now Playing instead of leaving the screen. (Web has no back handler;
  // the browser's back navigates the tabs as before.)
  const isInFront = isNowPlayingInFront(presentation);
  useEffect(() => {
    if (!isInFront) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeNowPlaying();
      return true;
    });
    return () => {
      subscription.remove();
    };
  }, [isInFront]);

  const isPlayerInUse = presentation !== 'closed';
  const isTabBarMeasured = bottomOffset > 0;
  const shouldRender = lecture !== null && (isPlayerInUse || isBarVisible) && isTabBarMeasured;
  if (!shouldRender) {
    return null;
  }

  return <SurfaceLayers bottomOffset={bottomOffset} presentation={presentation} />;
}

type SurfaceLayersProps = {
  bottomOffset: number;
  presentation: NowPlayingPresentation;
};

function SurfaceLayers({ bottomOffset, presentation }: SurfaceLayersProps) {
  // Positions the cover with plain layout styles. Changes only when Now Playing's layout does.
  const [coverRect, setCoverRect] = useState<Rect | null>(null);

  // Mounted straight into the bar (no collapse led here, e.g. playing again from the lock screen
  // after the queue ended): the bar rises into place. Read once, at mount.
  useEffect(() => {
    const presentationAtMount = usePlayerStore.getState().nowPlayingPresentation;
    if (presentationAtMount === 'closed') {
      riseMini();
    }
  }, []);

  const handleCoverRectChange = useCallback((rect: Rect) => {
    coverRectValue.set(rect);
    setCoverRect(rect);
  }, []);

  const handleMiniRectChange = useCallback((rect: Rect) => {
    miniRectValue.set(rect);
  }, []);

  const rootStyle = useAnimatedStyle(() => {
    return { opacity: surfaceOpacity.get() };
  });

  // Who can be touched follows the presentation. The bar also takes taps while closing, so a tap
  // can grow it back mid-collapse.
  const isClosed = presentation === 'closed';
  const isBarInteractive = isClosed || presentation === 'closing';
  const isFullInteractive = isNowPlayingInFront(presentation);

  // box-none: the tabs underneath stay touchable around the bar.
  // exiting: an unplanned unmount while the bar shows (the queue ended) fades it out. After a
  // planned drop the bar is already transparent, so this is invisible there.
  return (
    <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, rootStyle]} exiting={FadeOut.duration(200)}>
      <SurfaceBackground />
      <FullLayer
        onCoverRectChange={handleCoverRectChange}
        isInteractive={isFullInteractive}
        isOpen={presentation === 'open'}
      />
      {coverRect !== null ? <SurfaceCover coverRect={coverRect} /> : null}
      <MiniLayer
        bottomOffset={bottomOffset}
        onMiniRectChange={handleMiniRectChange}
        isInteractive={isBarInteractive}
        isHiddenFromScreenReaders={!isClosed}
      />
    </Animated.View>
  );
}
