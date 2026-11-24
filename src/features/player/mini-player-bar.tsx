import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { CoverArt } from '@/components/artwork/cover-art';
import { MiniPlayer } from '@/components/MiniPlayer';
import { miniPlayer, MINI_PLAYER_GAP_ABOVE_TAB_BAR } from '@/components/MiniPlayer/tokens';

import { toggle } from './audio-engine';
import { pickMiniPlayerPlayState } from './mini-player-play-state';
import { MiniPlayerProgressLine } from './mini-player-progress-line';
import { dismissMiniPlayer, openNowPlayingForLoadedLecture } from './open-now-playing';
import { shouldDismissBar, shouldOpenFromBar } from './panel-rules';
import {
  BAR_DISMISS_DURATION_MS,
  BAR_DISMISS_FAIL_OFFSET_X,
  BAR_SPRING,
  BAR_SWIPE_ACTIVE_OFFSET_Y,
  ESTIMATED_BAR_HEIGHT,
} from './player-motion-config';
import {
  selectActiveLectureSlug,
  selectCurrentLecture,
  selectHasAudioFailed,
  usePlayerStore,
} from './player.store';

type MiniPlayerBarProps = {
  // Distance from the bottom of the tabs layout: the tab bar's measured height plus the gap.
  // 0 until the tab bar has been measured.
  bottomOffset: number;
};

// The screens' content column (Home, Events, Now Playing) is at most 600 wide and centred. The
// bar sits in the same column, minus its 12 px side inset on each side, so on a wide window (web,
// tablets) it lines up with the content instead of stretching from edge to edge.
const BAR_MAX_WIDTH = 600 - 12 * 2;

// A strong ease-out for the bar sliding away.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// The mini player: a bar floating just above the tab bar whenever a lecture is active. It stays
// rendered while Now Playing is open, so it is already in place when the panel slides away; while
// Now Playing is open it is covered, hidden from screen readers and not touchable.
//
// Tap it, or swipe it up, to open Now Playing. Swipe it down to stop playback and close it: only
// this bar's own gesture (or its screen-reader action) can stop playback.
//
// Swiping up doesn't move the bar or the panel with the finger: on release it asks the flows to
// open Now Playing, exactly like a tap, and the panel slides up from the bottom on its own. The
// bar's position is never tied to the panel's.
export function MiniPlayerBar({ bottomOffset }: MiniPlayerBarProps) {
  const activeLectureSlug = usePlayerStore(selectActiveLectureSlug);

  // Wait for the tab bar, so the bar doesn't appear at the bottom edge and then jump up.
  const isTabBarMeasured = bottomOffset > 0;
  if (activeLectureSlug === null || !isTabBarMeasured) {
    return null;
  }

  return <SwipeableBar bottomOffset={bottomOffset} />;
}

function SwipeableBar({ bottomOffset }: MiniPlayerBarProps) {
  const lecture = usePlayerStore(selectCurrentLecture);
  const isNowPlayingOpen = usePlayerStore((state) => state.nowPlayingPresentation === 'open');
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const hasAudioFailed = usePlayerStore(selectHasAudioFailed);

  const [barHeight, setBarHeight] = useState(ESTIMATED_BAR_HEIGHT);

  // Mounted while Now Playing is already open (a row opened it with nothing loaded): the panel is
  // still rising from the bottom edge, and the bar would show above it for a few frames. So it
  // stays invisible until Now Playing first closes, while the panel still covers it. Set during
  // render (React's pattern for state that follows a prop), so no frame shows the stale value.
  const [hasBeenRevealed, setHasBeenRevealed] = useState(!isNowPlayingOpen);
  if (!hasBeenRevealed && !isNowPlayingOpen) {
    setHasBeenRevealed(true);
  }

  // How far the bar is pushed down by the dismiss drag. Never negative.
  const translateY = useSharedValue(0);

  function handleBarLayout(event: LayoutChangeEvent) {
    const measuredHeight = event.nativeEvent.layout.height;
    if (measuredHeight > 0) {
      setBarHeight(measuredHeight);
    }
  }

  // The bar has slid away. Dismissing stops playback, and the bar unmounts with the session. If
  // the flow refused (Now Playing was opened in the meantime), bring the bar back.
  function handleSlideAwayFinished() {
    dismissMiniPlayer();
    const isStillActive = selectActiveLectureSlug(usePlayerStore.getState()) !== null;
    if (isStillActive) {
      translateY.set(withSpring(0, BAR_SPRING));
    }
  }

  // Far enough down to leave the bar's resting place; it has faded out by then.
  const slideAwayDistance = barHeight + MINI_PLAYER_GAP_ABOVE_TAB_BAR;

  const swipeGesture = usePanGesture({
    enabled: !isNowPlayingOpen,
    // Up or down.
    activeOffsetY: BAR_SWIPE_ACTIVE_OFFSET_Y,
    failOffsetX: BAR_DISMISS_FAIL_OFFSET_X,
    onUpdate: (event) => {
      'worklet';
      // Only downward drags move the bar; upward, it stays put.
      translateY.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      'worklet';
      const endedAboveStart = event.translationY < 0;
      if (endedAboveStart) {
        // The bar never moved (it doesn't follow upward drags), so there's nothing to spring back.
        translateY.set(0);
        const isOpening = shouldOpenFromBar({
          translationY: event.translationY,
          velocityY: event.velocityY,
          barHeight,
        });
        if (isOpening) {
          scheduleOnRN(openNowPlayingForLoadedLecture);
        }
        return;
      }

      const isDismissed = shouldDismissBar({
        translationY: Math.max(0, event.translationY),
        velocityY: event.velocityY,
        barHeight,
      });
      if (!isDismissed) {
        translateY.set(withSpring(0, { ...BAR_SPRING, velocity: event.velocityY }));
        return;
      }
      translateY.set(
        withTiming(slideAwayDistance, { duration: BAR_DISMISS_DURATION_MS, easing: EASE_OUT }, (finished) => {
          if (finished) {
            scheduleOnRN(handleSlideAwayFinished);
          }
        }),
      );
    },
  });

  const dragStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.get(), [0, slideAwayDistance], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: translateY.get() }],
  }));

  if (lecture === null) {
    return null;
  }

  let revealOpacity = 1;
  if (!hasBeenRevealed) {
    revealOpacity = 0;
  }

  const thumbnail = (
    <View className={`h-11 w-11 overflow-hidden rounded-thumb-sm ${miniPlayer.thumbBg}`}>
      <CoverArt />
    </View>
  );

  // box-none: the screen underneath stays touchable on both sides of the bar.
  return (
    <View
      testID="mini-player-bar"
      pointerEvents={isNowPlayingOpen ? 'none' : 'box-none'}
      accessibilityElementsHidden={isNowPlayingOpen}
      importantForAccessibility={isNowPlayingOpen ? 'no-hide-descendants' : 'auto'}
      className="absolute inset-x-0 items-center px-bar"
      style={{ bottom: bottomOffset, opacity: revealOpacity }}
    >
      <GestureDetector gesture={swipeGesture}>
        {/* Plain styles on the Animated.View: NativeWind classes don't reach it, and the bar's
            shadow stays on MiniPlayer's own plain View. */}
        <Animated.View style={[styles.bar, dragStyle]}>
          <View onLayout={handleBarLayout}>
            <MiniPlayer
              title={lecture.title}
              author={lecture.author}
              playState={pickMiniPlayerPlayState({ isLoaded, isBuffering, isPlaying, hasAudioFailed })}
              progressLine={<MiniPlayerProgressLine />}
              onOpenPress={openNowPlayingForLoadedLecture}
              onTogglePress={toggle}
              onDismiss={dismissMiniPlayer}
              thumbnail={thumbnail}
              background="filled"
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    maxWidth: BAR_MAX_WIDTH,
  },
});
