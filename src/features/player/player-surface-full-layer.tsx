import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { memo, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Extrapolation, FadeIn, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { TrackInfo } from '@/components/NowPlaying/track-info';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import type { Lecture } from '@/data/sample';
import { useLectureQuery } from '@/features/lectures/lectures.queries';

import { fitArtworkSize, nowPlayingTrackInfo } from './now-playing-content';
import { NowPlayingControls } from './now-playing-controls';
import { NowPlayingSeekBar } from './now-playing-seek-bar';
import { beginCloseAfterSwipe, closeNowPlaying, finishCloseAfterSwipe, openEventFromNowPlaying } from './open-now-playing';
import { MORPH_SPRING, SNAP_BACK_SPRING } from './player-motion-config';
import { getEntranceProgress, getSwipeRange, shouldCollapseAfterSwipe, type Rect } from './player-surface-geometry';
import { enterY, expand, readSurfaceGeometry } from './player-surface-motion';
import { selectCurrentLecture, selectSourceLabel, usePlayerStore } from './player.store';

const contentMaxWidth = 600;
// px-gutter on each side of the content column.
const sideGutters = 48;
// mt-2.5 above the artwork.
const artworkTopMargin = 10;
// Open ground left below the controls when the artwork has to shrink.
const spaceBelowControls = 16;
// How far each block rises while it fades in.
const blockRisePx = 16;

type FullLayerProps = {
  // The cover's rectangle in window coordinates, once it is known. The cover itself is drawn by
  // the cover layer above this one, so it can morph into the bar's thumbnail.
  onCoverRectChange: (rect: Rect) => void;
  // Touches and screen readers reach this layer only while Now Playing is opening or open.
  isInteractive: boolean;
  isOpen: boolean;
};

type BlockTiming = {
  // Where in the morph (expand 0 → 1) the block starts to fade in.
  expandStart: number;
  // Where in the fresh entrance (0 → 1) the block starts to fade in. Later starts arrive
  // visibly after the cover, because a spring spends its last stretch slowly.
  entranceStart: number;
};

const topBarTiming: BlockTiming = { expandStart: 0.35, entranceStart: 0.55 };
const trackInfoTiming: BlockTiming = { expandStart: 0.45, entranceStart: 0.62 };
const seekBarTiming: BlockTiming = { expandStart: 0.55, entranceStart: 0.7 };
const controlsTiming: BlockTiming = { expandStart: 0.65, entranceStart: 0.78 };

// One block of Now Playing that fades and rises in. During a morph the entrance factor is 1; during
// an entrance the expand factor is 1. Multiplying them covers every case, and nothing extra needs
// cancelling when the motion is interrupted.
function FadingBlock({ timing, children }: { timing: BlockTiming; children: ReactNode }) {
  const style = useAnimatedStyle(() => {
    const linearExpandFactor = interpolate(expand.get(), [timing.expandStart, 1], [0, 1], Extrapolation.CLAMP);
    // Squared, so the text is nearly gone early in a collapse. The content rides down with the
    // sheet's top edge, and its lower part would otherwise show below the shrinking sheet.
    const expandFactor = linearExpandFactor * linearExpandFactor;
    const entrance = getEntranceProgress(enterY.get(), readSurfaceGeometry().windowHeight);
    const entranceFactor = interpolate(entrance, [timing.entranceStart, 1], [0, 1], Extrapolation.CLAMP);
    const visibility = expandFactor * entranceFactor;
    return {
      opacity: visibility,
      transform: [{ translateY: (1 - visibility) * blockRisePx }],
    };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

// The collapse spring's completion, on the UI thread. A named module-level worklet, declared
// above its user: written inline, the React Compiler and the worklets plugin turn it into a
// constant that the swipe's worklet reads before it exists ("Cannot access '_temp' before
// initialization").
function handleSwipeCollapseFinished(finished?: boolean) {
  'worklet';
  scheduleOnRN(finishCloseAfterSwipe, finished === true);
}

// Swipe down on Now Playing: the player follows the finger (expand moves with it), then either
// collapses with the finger's speed or springs back. All of it runs on the UI thread. JS hears
// about it once, on release.
function useCollapseSwipe() {
  const dragStartExpand = useSharedValue(1);

  return usePanGesture({
    activeOffsetY: [-10, 10],
    // Horizontal movement belongs to the seek bar.
    failOffsetX: [-12, 12],
    onActivate: () => {
      'worklet';
      dragStartExpand.set(expand.get());
    },
    onUpdate: (event) => {
      'worklet';
      const swipeRange = getSwipeRange(readSurfaceGeometry());
      const nextExpand = dragStartExpand.get() - event.translationY / swipeRange;
      expand.set(Math.min(Math.max(nextExpand, 0), 1));
    },
    onDeactivate: (event) => {
      'worklet';
      const geometry = readSurfaceGeometry();
      const swipeRange = getSwipeRange(geometry);
      // expand moves the opposite way to the finger, in units of the swipe range.
      const expandVelocity = -event.velocityY / swipeRange;

      const shouldCollapse = shouldCollapseAfterSwipe(event.translationY, event.velocityY, geometry.windowHeight);
      if (!shouldCollapse) {
        expand.set(withSpring(1, { ...SNAP_BACK_SPRING, velocity: expandVelocity }));
        return;
      }

      expand.set(withSpring(0, { ...MORPH_SPRING, velocity: expandVelocity }, handleSwipeCollapseFinished));
      scheduleOnRN(beginCloseAfterSwipe);
    },
  });
}

function NowPlayingTopBar({ isOpen }: { isOpen: boolean }) {
  const sourceLabel = usePlayerStore(selectSourceLabel);
  const chevronRef = useRef<ComponentRef<typeof View>>(null);

  // On open, screen readers start at the chevron, like a native modal.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    // react-native-web has no sendAccessibilityEvent.
    if (Platform.OS === 'web') {
      return;
    }
    const chevron = chevronRef.current;
    if (chevron !== null) {
      AccessibilityInfo.sendAccessibilityEvent(chevron, 'focus');
    }
  }, [isOpen]);

  return (
    <ScreenTopBar
      left={
        <IconButton ref={chevronRef} accessibilityLabel="Minimise player" tone="ghost" onPress={closeNowPlaying}>
          <Icon icon={ChevronDown} size={24} />
        </IconButton>
      }
      center={
        <View className="items-center gap-0.5">
          <Text variant="caption" className="font-manrope-semibold text-fg-muted">
            Playing from
          </Text>
          <Text variant="bodySm" numberOfLines={1} className="font-manrope-bold">
            {sourceLabel}
          </Text>
        </View>
      }
    />
  );
}

// Now Playing's content, without the background and the cover (layers of their own). Stays
// mounted while the bar shows, because the morph needs it.
export const FullLayer = memo(function FullLayer({ onCoverRectChange, isInteractive, isOpen }: FullLayerProps) {
  const insets = useSafeAreaInsets();
  const currentLecture = usePlayerStore(selectCurrentLecture);
  // The detail record (topic, event) of the loaded lecture. The queue holds list summaries.
  const { data: lecture } = useLectureQuery(currentLecture?.slug);
  const collapseSwipe = useCollapseSwipe();

  // The content rides with the sheet's top edge (the background's top), so during a swipe or a
  // collapse the text moves down with the sheet while it fades, instead of staying behind.
  const rootStyle = useAnimatedStyle(() => {
    const sheetTop = (1 - expand.get()) * readSurfaceGeometry().miniRect.y;
    return { transform: [{ translateY: enterY.get() + sheetTop }] };
  });

  let pointerEvents: 'auto' | 'none' = 'none';
  if (isInteractive) {
    pointerEvents = 'auto';
  }

  // No header covers the notch and the tab bar is behind, so this layer owns both insets.
  return (
    <GestureDetector gesture={collapseSwipe}>
      <Animated.View
        pointerEvents={pointerEvents}
        accessibilityViewIsModal={isInteractive}
        accessibilityElementsHidden={!isInteractive}
        importantForAccessibility={isInteractive ? 'auto' : 'no-hide-descendants'}
        style={[StyleSheet.absoluteFill, { paddingTop: insets.top, paddingBottom: insets.bottom }, rootStyle]}
      >
        <FadingBlock timing={topBarTiming}>
          <View className="w-full self-center" style={{ maxWidth: contentMaxWidth }}>
            <NowPlayingTopBar isOpen={isOpen} />
          </View>
        </FadingBlock>
        {lecture ? <NowPlayingBody lecture={lecture} onCoverRectChange={onCoverRectChange} /> : null}
      </Animated.View>
    </GestureDetector>
  );
});

type BodyArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type NowPlayingBodyProps = {
  lecture: Lecture;
  onCoverRectChange: (rect: Rect) => void;
};

function NowPlayingBody({ lecture, onCoverRectChange }: NowPlayingBodyProps) {
  const trackInfo = nowPlayingTrackInfo(lecture);

  let handleEventPress: (() => void) | undefined = undefined;
  const eventSlug = trackInfo.eventSlug;
  if (eventSlug !== undefined) {
    handleEventPress = () => {
      openEventFromNowPlaying(eventSlug);
    };
  }

  // The artwork's size depends on how much room the screen has, so two things are measured:
  // the body area, and the block under the artwork (whose height doesn't depend on it).
  const [bodyArea, setBodyArea] = useState<BodyArea | null>(null);
  const [belowArtworkHeight, setBelowArtworkHeight] = useState<number | null>(null);

  // The body is a direct child of the layer's root, which sits at the window's origin, so its
  // layout x / y are window coordinates. onLayout ignores transforms, so the entrance offset
  // doesn't affect them. Keep it a direct child.
  function handleBodyLayout(event: LayoutChangeEvent) {
    const { x, y, width, height } = event.nativeEvent.layout;
    setBodyArea({ x, y, width, height });
  }

  function handleBelowArtworkLayout(event: LayoutChangeEvent) {
    setBelowArtworkHeight(event.nativeEvent.layout.height);
  }

  let artworkSize: number | null = null;
  if (bodyArea !== null && belowArtworkHeight !== null) {
    const columnWidth = Math.min(bodyArea.width, contentMaxWidth) - sideGutters;
    artworkSize = fitArtworkSize({
      availableWidth: columnWidth,
      availableHeight: bodyArea.height,
      heightOfEverythingElse: artworkTopMargin + belowArtworkHeight + spaceBelowControls,
    });
  }

  // The artwork is centred in the column, and the column in the body.
  useEffect(() => {
    if (bodyArea === null || artworkSize === null) {
      return;
    }
    const coverRect: Rect = {
      x: bodyArea.x + (bodyArea.width - artworkSize) / 2,
      y: bodyArea.y + artworkTopMargin,
      width: artworkSize,
      height: artworkSize,
    };
    onCoverRectChange(coverRect);
  }, [bodyArea, artworkSize, onCoverRectChange]);

  // A plain View, not a ScrollView: the artwork shrinks so everything fits, and a scroll view
  // would compete with the swipe down.
  return (
    <View className="flex-1 overflow-hidden" onLayout={handleBodyLayout}>
      <View className="w-full self-center px-gutter" style={{ maxWidth: contentMaxWidth }}>
        {/* The cover layer draws the artwork here. This keeps its space. */}
        <View className="mt-2.5 items-center">
          {artworkSize !== null ? <View style={{ width: artworkSize, height: artworkSize }} /> : null}
        </View>

        <View onLayout={handleBelowArtworkLayout}>
          <FadingBlock timing={trackInfoTiming}>
            {/* Keyed by slug: when the next lecture starts on its own, its text fades in. */}
            <Animated.View key={lecture.slug} entering={FadeIn.duration(200)} style={{ marginTop: 20 }}>
              <TrackInfo
                title={lecture.title}
                author={lecture.author}
                venue={trackInfo.venue}
                dateLabel={trackInfo.dateLabel}
                topicLabel={trackInfo.topicLabel}
                topicCategory={trackInfo.topicCategory}
                eventTitle={trackInfo.eventTitle}
                onEventPress={handleEventPress}
              />
            </Animated.View>
          </FadingBlock>
          {/* Only the seek bar and the controls follow the player, so the rest doesn't re-render
              with the position. */}
          <FadingBlock timing={seekBarTiming}>
            <View className="mt-[18px]">
              <NowPlayingSeekBar dataDuration={lecture.duration} />
            </View>
          </FadingBlock>
          <FadingBlock timing={controlsTiming}>
            <View className="mt-[18px]">
              <NowPlayingControls />
            </View>
          </FadingBlock>
        </View>
      </View>
    </View>
  );
}
