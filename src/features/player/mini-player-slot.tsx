import { memo, useState } from 'react';
import { PanResponder, View, type PanResponderGestureState } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { MiniPlayer } from '@/components/MiniPlayer';

import { skipForward15, stopAndClear, toggle } from './audio-engine';
import { MINI_PLAYER_ENTER_MS, MINI_PLAYER_EXIT_MS } from './mini-player-motion';
import { pickMiniPlayerPlayState } from './mini-player-play-state';
import { MiniPlayerProgressLine } from './mini-player-progress-line';
import { openNowPlayingForLoadedLecture } from './open-now-playing';
import { selectCurrentLecture, selectIsMiniPlayerVisible, usePlayerStore } from './player.store';

type MiniPlayerSlotProps = {
  // Distance from the bottom of the tabs layout: the tab bar's measured height plus the gap.
  // 0 until the tab bar has been measured.
  bottomOffset: number;
};

// How far (points) or how fast (points per millisecond) the bar must be dragged down to dismiss it.
const DISMISS_DISTANCE = 40;
const DISMISS_VELOCITY = 0.5;
// A drag counts as "down" once it has moved this far, mostly vertically. Before that, a touch is
// left to the bar's buttons, so a tap stays a tap.
const DRAG_START_DISTANCE = 10;

function isDownwardDrag(gesture: PanResponderGestureState): boolean {
  const isMostlyVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx);
  return gesture.dy > DRAG_START_DISTANCE && isMostlyVertical;
}

function handleDragRelease(_event: unknown, gesture: PanResponderGestureState) {
  const isFarEnough = gesture.dy >= DISMISS_DISTANCE;
  const isFastEnough = gesture.vy >= DISMISS_VELOCITY;
  if (isFarEnough || isFastEnough) {
    stopAndClear();
  }
}

// Swipe the bar down to stop and close it. React Native's own PanResponder rather than Gesture
// Handler: the bar is a floating, absolutely positioned layer, and Gesture Handler's v3 detector
// (a zero-size `display: contents` view) received no touches there on iOS. PanResponder also takes
// over cleanly from the bar's Pressables once the finger moves down.
function createDismissResponder() {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => isDownwardDrag(gesture),
    onPanResponderRelease: handleDragRelease,
  });
}

function handleSkipForwardPress() {
  skipForward15();
}

// The mini player, connected to the player store. Rendered once by the tabs layout as a
// floating layer above the tab bar. Search and Now Playing are root-stack screens drawn on top
// of the tabs, so they cover it without any route checks.
export const MiniPlayerSlot = memo(function MiniPlayerSlot({ bottomOffset }: MiniPlayerSlotProps) {
  const isVisible = usePlayerStore(selectIsMiniPlayerVisible);
  const lecture = usePlayerStore(selectCurrentLecture);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  // Created once for this bar. Its handlers call module-level functions, so it never goes stale.
  const [dismissResponder] = useState(createDismissResponder);

  // Until the tab bar has been measured, the bar's position isn't known. Don't flash it at the
  // bottom edge.
  const isTabBarMeasured = bottomOffset > 0;

  // When this returns null, Reanimated's `exiting` keeps animating the last rendered bar, so the
  // leaving bar still shows the old lecture.
  if (!isVisible || lecture === null || !isTabBarMeasured) {
    return null;
  }

  // Positioned by a plain View (NativeWind classes); the Reanimated view inside only fades.
  // Positioned by a plain View (NativeWind classes); the Reanimated view inside only fades.
  return (
    <View pointerEvents="box-none" className="absolute left-bar right-bar" style={{ bottom: bottomOffset }}>
      <Animated.View entering={FadeIn.duration(MINI_PLAYER_ENTER_MS)} exiting={FadeOut.duration(MINI_PLAYER_EXIT_MS)}>
        <View {...dismissResponder.panHandlers}>
          <MiniPlayer
            title={lecture.title}
            author={lecture.author}
            playState={pickMiniPlayerPlayState({ isLoaded, isBuffering, isPlaying })}
            progressLine={<MiniPlayerProgressLine />}
            onOpenPress={openNowPlayingForLoadedLecture}
            onTogglePress={toggle}
            onSkipForwardPress={handleSkipForwardPress}
            onDismiss={stopAndClear}
          />
        </View>
      </Animated.View>
    </View>
  );
});
