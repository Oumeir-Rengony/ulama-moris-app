import BottomSheet, {
  useBottomSheetSpringConfigs,
  useGestureEventsHandlersDefault,
  type GestureEventHandlerCallbackType,
} from '@gorhom/bottom-sheet';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Keyboard, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { CoverArt } from '@/components/artwork/cover-art';
import { miniPlayer, MINI_PLAYER_GAP_ABOVE_TAB_BAR } from '@/components/MiniPlayer/tokens';
import { barInset } from '@/theme/tokens';

import { MiniPlayerBar, type ThumbnailSlot } from './mini-player-bar';
import { NowPlayingView, type ArtworkSlot } from './now-playing-view';
import { closeNowPlaying, handleSheetSettled } from './open-now-playing';
import {
  ESTIMATED_BAR_HEIGHT,
  PANEL_ACTIVE_OFFSET_Y,
  PANEL_FAIL_OFFSET_X,
  RESTING_AT_BAR_INDEX,
  RESTING_AT_FULL_INDEX,
  RESTING_GONE_INDEX,
  SHEET_JUMP,
  SHEET_SPRING,
} from './player-motion-config';
import { selectActiveLectureSlug, usePlayerStore } from './player.store';
import { useKeyboardHeight } from './use-keyboard-height';
import { ARTWORK_LAYOUT_SIZE, usePlayerMorph, usePlayerPlacementStyle } from './use-player-morph';

type NowPlayingPanelProps = {
  // The sheet's live index (0 = the bar, 1 = the full player, −1 = gone). Written by the sheet,
  // read by the tab bar too, so it slides away in step with the morph.
  sheetIndex: SharedValue<number>;
  // The tab bar's measured height. The bar sits just above it. 0 until measured.
  tabBarHeight: number;
  // 0 on a tab screen, 1 on a screen outside the tabs (Search): there the tab bar slides away and
  // the bar drops into its place.
  outsideTabsProgress: SharedValue<number>;
};

type Area = {
  width: number;
  height: number;
};

// The player: ONE sheet that is the mini player at its small size and Now Playing at full size.
// Dragging it, or tapping the bar, grows one into the other under the finger.
//
// The outer view measures the area the sheet moves in (the whole screen), and moves the bar down
// where there is no tab bar and up above an open keyboard. The sheet waits for the area and for
// the tab bar, whose height places the bar.
export function NowPlayingPanel({ sheetIndex, tabBarHeight, outsideTabsProgress }: NowPlayingPanelProps) {
  const [area, setArea] = useState<Area | null>(null);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const placementStyle = usePlayerPlacementStyle({
    sheetIndex,
    outsideTabsProgress,
    keyboardHeight,
    tabBarHeight,
    bottomInset: insets.bottom,
  });

  function handleAreaLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setArea({ width, height });
  }

  const canShow = area !== null && tabBarHeight > 0;

  // box-none: the screens and the tab bar stay touchable around the sheet.
  return (
    <Animated.View
      testID="now-playing-area"
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, placementStyle]}
      onLayout={handleAreaLayout}
    >
      {canShow ? <PlayerSheet area={area} tabBarHeight={tabBarHeight} sheetIndex={sheetIndex} /> : null}
    </Animated.View>
  );
}

// Where the sheet should be: gone (below the screen), the bar, or the full player.
type SheetTarget = 'gone' | 'bar' | 'full';

const sheetIndexByTarget: Record<SheetTarget, number> = {
  gone: -1,
  bar: 0,
  full: 1,
};

function pickSheetTarget(isNowPlayingOpen: boolean, hasActiveLecture: boolean): SheetTarget {
  // Open wins: when the queue ends while Now Playing is open, it stays open.
  if (isNowPlayingOpen) {
    return 'full';
  }
  if (hasActiveLecture) {
    return 'bar';
  }
  return 'gone';
}

// The screens' content column is at most 600 wide and centred. The bar sits in the same column,
// minus its side inset on each side, so on a wide window (web, tablets) it lines up with the
// content instead of stretching from edge to edge.
const BAR_MAX_WIDTH = 600 - barInset * 2;

type PlayerSheetProps = {
  area: Area;
  tabBarHeight: number;
  sheetIndex: SharedValue<number>;
};

function PlayerSheet({ area, tabBarHeight, sheetIndex }: PlayerSheetProps) {
  const isOpen = usePlayerStore((state) => state.nowPlayingPresentation === 'open');
  const hasActiveLecture = usePlayerStore((state) => selectActiveLectureSlug(state) !== null);
  const target = pickSheetTarget(isOpen, hasActiveLecture);

  const sheetRef = useRef<BottomSheet>(null);
  // The sheet's top edge, written by the sheet every frame. The card's height follows it.
  const sheetTop = useSharedValue(area.height);
  // Whether a finger is dragging the sheet, written by useDragTrackingHandlers.
  const isDraggingSheet = useSharedValue(false);

  const [barHeight, setBarHeight] = useState(ESTIMATED_BAR_HEIGHT);
  const [thumbnailSlot, setThumbnailSlot] = useState<ThumbnailSlot | null>(null);
  const [artworkSlot, setArtworkSlot] = useState<ArtworkSlot | null>(null);

  // The bar's size: the card sits at the top of the sheet, just above the tab bar. The rest of the
  // sheet is behind the tab bar, which is drawn over it.
  const barDetent = tabBarHeight + MINI_PLAYER_GAP_ABOVE_TAB_BAR + barHeight;
  const snapPoints = useMemo(() => [barDetent, '100%'], [barDetent]);

  // Where the sheet starts, read once.
  const [initialIndex] = useState(sheetIndexByTarget[target]);

  // Where the sheet is heading or resting. Set before the store hears about a drag, so the effect
  // below doesn't restart a spring the drag already finished.
  const headingTo = useRef<SheetTarget>(target);
  // A row opened Now Playing with nothing loaded: the sheet has jumped to the bar's place, and
  // grows into the full player once it is there.
  const isWaitingAtBarToOpen = useRef(false);

  // Follow the store.
  useEffect(() => {
    const comingFrom = headingTo.current;
    if (comingFrom === target) {
      return;
    }
    headingTo.current = target;
    isWaitingAtBarToOpen.current = false;

    const sheet = sheetRef.current;
    if (sheet === null) {
      return;
    }
    if (target === 'gone') {
      sheet.close();
      return;
    }
    if (target === 'bar') {
      sheet.snapToIndex(sheetIndexByTarget.bar);
      return;
    }
    // Full. From gone (nothing was loaded), the full player grows out of the bar's place: jump
    // there without animating; the resting check below starts the growth once it has landed.
    if (comingFrom === 'gone') {
      isWaitingAtBarToOpen.current = true;
      sheet.snapToIndex(sheetIndexByTarget.bar, SHEET_JUMP);
      return;
    }
    sheet.snapToIndex(sheetIndexByTarget.full);
  }, [target]);

  // The sheet came to rest at one of its ends.
  const handleSheetRested = useCallback((restingAt: SheetTarget) => {
    if (restingAt === 'bar' && isWaitingAtBarToOpen.current) {
      isWaitingAtBarToOpen.current = false;
      sheetRef.current?.snapToIndex(sheetIndexByTarget.full);
      return;
    }
    if (restingAt === 'gone') {
      // If the store sent the sheet below the screen (the session was cleared, the queue ended),
      // there is nothing to do.
      if (headingTo.current === 'gone') {
        return;
      }
      // Otherwise the user swiped the bar down: the store stops the session. (A drag from Now
      // Playing can't get below the bar, see enablePanDownToClose, but if the store still says
      // open, it only closes Now Playing.)
      headingTo.current = 'gone';
      handleSheetSettled('gone');

      // When the session was stopped, the sheet is already where it should be. Otherwise it goes
      // back to the bar.
      const isStillActive = selectActiveLectureSlug(usePlayerStore.getState()) !== null;
      if (isStillActive) {
        headingTo.current = 'bar';
        sheetRef.current?.snapToIndex(sheetIndexByTarget.bar);
      }
      return;
    }
    headingTo.current = restingAt;
    handleSheetSettled(restingAt);
  }, []);

  // The resting check: crosses to React only when the sheet comes to rest at an end, and only at
  // a different end from the last one. Never per frame, and never from gorhom's callbacks
  // (onAnimate / onChange are skipped or late).
  //
  // Never while a finger drags the sheet: a drag from Now Playing passes through the bar's
  // position on its way down, and reporting the bar there would record Now Playing as closed
  // mid-drag. (Springs need no such check: from Now Playing the bar is the lowest point, see
  // enablePanDownToClose, so a spring only reaches the bar by ending there.)
  useAnimatedReaction(
    (): SheetTarget | 'moving' => {
      if (isDraggingSheet.get()) {
        return 'moving';
      }
      const index = sheetIndex.get();
      if (index >= RESTING_AT_FULL_INDEX) {
        return 'full';
      }
      if (index <= RESTING_AT_BAR_INDEX && index >= -RESTING_AT_BAR_INDEX) {
        return 'bar';
      }
      if (index <= RESTING_GONE_INDEX) {
        return 'gone';
      }
      return 'moving';
    },
    (restingAt, previousRestingAt) => {
      if (restingAt === previousRestingAt || restingAt === 'moving') {
        return;
      }
      scheduleOnRN(handleSheetRested, restingAt);
    },
  );

  // Now Playing covers the whole screen, so a keyboard left open by Search would cover its
  // controls.
  useEffect(() => {
    if (isOpen) {
      Keyboard.dismiss();
    }
  }, [isOpen]);

  // Android back shrinks Now Playing into the bar instead of leaving the screen. (Web has no back
  // handler.)
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeNowPlaying();
      return true;
    });
    return () => {
      subscription.remove();
    };
  }, [isOpen]);

  // The same spring on iOS and Android (gorhom's Android default is a timing curve).
  const animationConfigs = useBottomSheetSpringConfigs(SHEET_SPRING);

  let barSideInset = barInset;
  const wideWindowInset = (area.width - BAR_MAX_WIDTH) / 2;
  if (wideWindowInset > barInset) {
    barSideInset = wideWindowInset;
  }
  const barWidth = area.width - barSideInset * 2;

  const morph = usePlayerMorph({
    sheetIndex,
    sheetTop,
    areaHeight: area.height,
    barHeight,
    barSideInset,
    thumbnailSlot,
    artworkSlot,
  });

  // While closed, screen readers skip Now Playing and it takes no touches (it is invisible under
  // the bar). While open it is modal: screen readers stay inside it.
  return (
    <SheetDragContext.Provider value={isDraggingSheet}>
      <BottomSheet
        ref={sheetRef}
        index={initialIndex}
        snapPoints={snapPoints}
        animatedIndex={sheetIndex}
        animatedPosition={sheetTop}
        // Otherwise gorhom adds a content-sized snap point and the indexes shift.
        enableDynamicSizing={false}
        // Swiping the bar down below the screen stops and closes the player (the store decides).
        // While Now Playing is open, the bar is the lowest the sheet goes: a drag or a hard flick
        // from Now Playing stops there, so nothing started on Now Playing can stop playback.
        enablePanDownToClose={!isOpen}
        // Never past either end.
        enableOverDrag={false}
        handleComponent={null}
        // The card draws the colours.
        backgroundComponent={null}
        // Never change this: gorhom swaps the view around its content when it changes, which
        // remounts the whole player and makes the artwork blink.
        enableContentPanningGesture={true}
        // gorhom's drag, plus a note of when a finger is dragging (read by the resting check).
        gestureEventsHandlersHook={useDragTrackingHandlers}
        animationConfigs={animationConfigs}
        activeOffsetY={PANEL_ACTIVE_OFFSET_Y}
        failOffsetX={PANEL_FAIL_OFFSET_X}
        // Gorhom makes its content one accessible element by default ("Bottom Sheet", adjustable),
        // which groups everything inside: screen readers couldn't reach the chevron or the controls.
        // The views below set the screen-reader behaviour instead.
        accessible={false}
      >
        {/* Plain styles on the Animated.Views: NativeWind classes don't reach them. */}
        <Animated.View style={[styles.card, morph.cardStyle]}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, morph.outlineStyle]}>
            <View className={`flex-1 rounded-mini ${miniPlayer.outline}`} />
          </Animated.View>

          {/* Laid out once at full-screen size and clipped by the card, so nothing in it is laid out
              again while the card grows. */}
          <Animated.View
            testID="now-playing-panel"
            pointerEvents={isOpen ? 'auto' : 'none'}
            accessibilityViewIsModal={isOpen}
            accessibilityElementsHidden={!isOpen}
            importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
            style={[styles.fullContent, { width: area.width, height: area.height }, morph.fullContentStyle]}
          >
            <NowPlayingView onArtworkSlotChange={setArtworkSlot} />
          </Animated.View>

          {/* box-none: the row itself decides (it takes no touches while Now Playing is open, where it
              would cover the chevron). */}
          <Animated.View pointerEvents="box-none" style={[styles.barRow, { width: barWidth }, morph.barRowStyle]}>
            <MiniPlayerBar onHeightChange={setBarHeight} onThumbnailSlotChange={setThumbnailSlot} />
          </Animated.View>

          {/* The one artwork, flying between the bar's thumbnail and Now Playing's slot. */}
          <Animated.View pointerEvents="none" style={[styles.artwork, morph.artworkStyle]}>
            <View className={`flex-1 ${miniPlayer.thumbBg}`}>
              <CoverArt />
            </View>
          </Animated.View>
        </Animated.View>
      </BottomSheet>
    </SheetDragContext.Provider>
  );
}

// Whether a finger is dragging the sheet. PlayerSheet creates it and hands it to
// useDragTrackingHandlers through this context, because gorhom calls that hook itself, with no
// arguments.
const SheetDragContext = createContext<SharedValue<boolean> | null>(null);

// gorhom's own drag handlers, plus a note of when a drag starts and ends. Passed to the sheet as
// gestureEventsHandlersHook (gorhom's public way to extend its drag). Each handler sets the flag,
// then calls gorhom's handler unchanged, so the drag itself behaves exactly as before.
function useDragTrackingHandlers() {
  const defaultHandlers = useGestureEventsHandlersDefault();
  const isDraggingSheet = useContext(SheetDragContext);
  if (isDraggingSheet === null) {
    throw new Error('useDragTrackingHandlers needs a SheetDragContext provider around the sheet');
  }

  const defaultOnStart = defaultHandlers.handleOnStart;
  const defaultOnEnd = defaultHandlers.handleOnEnd;
  const defaultOnFinalize = defaultHandlers.handleOnFinalize;

  // Runs once the drag has started (after PANEL_ACTIVE_OFFSET_Y). A touch that never becomes a
  // drag doesn't move the sheet, so it doesn't count.
  const handleOnStart = useCallback<GestureEventHandlerCallbackType>(
    (source, payload) => {
      'worklet';
      isDraggingSheet.set(true);
      defaultOnStart(source, payload);
    },
    [isDraggingSheet, defaultOnStart],
  );

  // The finger lifted. gorhom picks where the sheet goes and starts its spring.
  const handleOnEnd = useCallback<GestureEventHandlerCallbackType>(
    (source, payload) => {
      'worklet';
      isDraggingSheet.set(false);
      defaultOnEnd(source, payload);
    },
    [isDraggingSheet, defaultOnEnd],
  );

  // Always runs last, also when the drag was cancelled without an end.
  const handleOnFinalize = useCallback<GestureEventHandlerCallbackType>(
    (source, payload) => {
      'worklet';
      isDraggingSheet.set(false);
      defaultOnFinalize(source, payload);
    },
    [isDraggingSheet, defaultOnFinalize],
  );

  return {
    handleOnStart,
    handleOnChange: defaultHandlers.handleOnChange,
    handleOnEnd,
    handleOnFinalize,
  };
}

const styles = StyleSheet.create({
  card: {
    // Clips the fixed-size children to the card while it grows and shrinks.
    overflow: 'hidden',
  },
  fullContent: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  barRow: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  artwork: {
    position: 'absolute',
    width: ARTWORK_LAYOUT_SIZE,
    height: ARTWORK_LAYOUT_SIZE,
    top: 0,
    left: 0,
    overflow: 'hidden',
    transformOrigin: 'top left',
  },
});
