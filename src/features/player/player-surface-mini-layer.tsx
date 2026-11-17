import { memo, useState } from 'react';
import { PanResponder, View, type LayoutChangeEvent, type PanResponderGestureState } from 'react-native';
import Animated, { Extrapolation, FadeIn, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { MiniPlayer } from '@/components/MiniPlayer';

import { skipForward15, toggle } from './audio-engine';
import { pickMiniPlayerPlayState } from './mini-player-play-state';
import { MiniPlayerProgressLine } from './mini-player-progress-line';
import { dismissMiniPlayer, openNowPlayingForLoadedLecture } from './open-now-playing';
import { MINI_DROP_DISTANCE_PX, MINI_THUMB_SIZE } from './player-motion-config';
import { shouldDismissMini, type Rect } from './player-surface-geometry';
import { expand, miniDrop, reducedMotion, snapMiniBack } from './player-surface-motion';
import { selectCurrentLecture, usePlayerStore } from './player.store';

type MiniLayerProps = {
  // Distance from the bottom of the tabs layout: the tab bar's measured height plus the gap.
  bottomOffset: number;
  // The width of the surface the bar is drawn in (the window).
  surfaceWidth: number;
  // The bar's rectangle in window coordinates, measured from its layout.
  onMiniRectChange: (rect: Rect) => void;
  // Touches and screen readers reach the bar only while Now Playing is closed (or closing, so a
  // tap can grow it back).
  isInteractive: boolean;
  isHiddenFromScreenReaders: boolean;
};

// A drag counts as "down" once it has moved this far, mostly vertically. Before that, a touch is
// left to the bar's buttons, so a tap stays a tap.
const DRAG_START_DISTANCE = 10;

// The tailwind `bar` spacing (12 px), as a number: NativeWind classes don't reach Animated.View.
const BAR_SIDE_INSET = 12;

// The screens' content column (Home, Events, Now Playing) is at most 600 wide and centred. The bar
// sits in the same column, so on a wide window (web, tablets) it lines up with the content instead
// of stretching from edge to edge.
const CONTENT_COLUMN_MAX_WIDTH = 600;

type BarHorizontalPosition = {
  left: number;
  width: number;
};

// On a phone the column is the whole window, so this is the plain 12 px inset on each side.
function getBarHorizontalPosition(surfaceWidth: number): BarHorizontalPosition {
  const columnWidth = Math.min(surfaceWidth, CONTENT_COLUMN_MAX_WIDTH);
  const barWidth = columnWidth - BAR_SIDE_INSET * 2;
  const left = (surfaceWidth - barWidth) / 2;
  return { left, width: barWidth };
}

function isDownwardDrag(gesture: PanResponderGestureState): boolean {
  const isMostlyVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx);
  return gesture.dy > DRAG_START_DISTANCE && isMostlyVertical;
}

function clampShare(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function handleDragMove(_event: unknown, gesture: PanResponderGestureState) {
  miniDrop.set(clampShare(gesture.dy / MINI_DROP_DISTANCE_PX));
}

function handleDragRelease(_event: unknown, gesture: PanResponderGestureState) {
  // PanResponder reports speed in points per millisecond; the threshold is per second.
  const velocityPerSecond = gesture.vy * 1000;
  if (shouldDismissMini(gesture.dy, velocityPerSecond)) {
    dismissMiniPlayer();
    return;
  }
  snapMiniBack();
}

// Swipe the bar down to stop and close it. The bar follows the finger, then drops or springs
// back. React Native's own PanResponder rather than Gesture Handler: Gesture Handler's v3
// detector received no touches on this floating, absolutely positioned bar on iOS (Stage 11).
// The drag is the one motion here driven from JS; it is short and the bar is small.
function createDismissResponder() {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => isDownwardDrag(gesture),
    onPanResponderMove: handleDragMove,
    onPanResponderRelease: handleDragRelease,
    onPanResponderTerminate: snapMiniBack,
  });
}

function handleSkipForwardPress() {
  skipForward15();
}

// The bar's content: title, scholar, play/pause, forward 15, progress line. The background and
// the cover thumbnail are separate layers, so they can grow into Now Playing.
export const MiniLayer = memo(function MiniLayer({
  bottomOffset,
  surfaceWidth,
  onMiniRectChange,
  isInteractive,
  isHiddenFromScreenReaders,
}: MiniLayerProps) {
  const lecture = usePlayerStore(selectCurrentLecture);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const audioLoadState = usePlayerStore((state) => state.audioLoadState);

  // Created once for this bar. Its handlers call module-level functions, so it never goes stale.
  const [dismissResponder] = useState(createDismissResponder);

  // onLayout reports untransformed layout, so the drop and the tuck don't distort the rectangle.
  // The surface's root fills the window, so these are window coordinates.
  function handleLayout(event: LayoutChangeEvent) {
    const { x, y, width, height } = event.nativeEvent.layout;
    onMiniRectChange({ x, y, width, height });
  }

  const animatedStyle = useAnimatedStyle(() => {
    const morphHidden = interpolate(expand.get(), [0, 0.25], [0, 1], Extrapolation.CLAMP);
    const drop = miniDrop.get();
    const dropHidden = Math.min(Math.max(drop, 0), 1);

    let dropDistance = MINI_DROP_DISTANCE_PX;
    if (reducedMotion.get()) {
      dropDistance = 0;
    }

    return {
      opacity: (1 - morphHidden) * (1 - dropHidden),
      transform: [{ translateY: drop * dropDistance }],
    };
  });

  if (lecture === null) {
    return null;
  }

  let pointerEvents: 'auto' | 'none' = 'none';
  if (isInteractive) {
    pointerEvents = 'auto';
  }

  const barPosition = getBarHorizontalPosition(surfaceWidth);

  return (
    <Animated.View
      onLayout={handleLayout}
      pointerEvents={pointerEvents}
      accessibilityElementsHidden={isHiddenFromScreenReaders}
      importantForAccessibility={isHiddenFromScreenReaders ? 'no-hide-descendants' : 'auto'}
      style={[
        { position: 'absolute', left: barPosition.left, width: barPosition.width, bottom: bottomOffset },
        animatedStyle,
      ]}
    >
      <View {...dismissResponder.panHandlers}>
        {/* Keyed by slug: when the next lecture starts on its own, its title fades in. */}
        <Animated.View key={lecture.slug} entering={FadeIn.duration(200)}>
          <MiniPlayer
            title={lecture.title}
            author={lecture.author}
            playState={pickMiniPlayerPlayState({ isLoaded, isBuffering, isPlaying, audioLoadState })}
            progressLine={<MiniPlayerProgressLine />}
            onOpenPress={openNowPlayingForLoadedLecture}
            onTogglePress={toggle}
            onSkipForwardPress={handleSkipForwardPress}
            onDismiss={dismissMiniPlayer}
            // The cover layer draws the thumbnail over this space.
            thumbnail={<View style={{ width: MINI_THUMB_SIZE, height: MINI_THUMB_SIZE }} />}
            background="transparent"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
});
