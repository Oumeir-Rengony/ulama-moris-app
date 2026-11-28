import BottomSheet, { useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';
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
import { ARTWORK_LAYOUT_SIZE, usePlayerMorph } from './use-player-morph';

type NowPlayingPanelProps = {
  // The sheet's live index (0 = the bar, 1 = the full player, −1 = gone). Written by the sheet,
  // read by the tab bar too, so it slides away in step with the morph.
  sheetIndex: SharedValue<number>;
  // The tab bar's measured height. The bar sits just above it. 0 until measured.
  tabBarHeight: number;
};

type Area = {
  width: number;
  height: number;
};

// The player: ONE sheet that is the mini player at its small size and Now Playing at full size.
// Dragging it, or tapping the bar, grows one into the other under the finger.
//
// The outer view only measures the area the sheet moves in (the whole screen). The sheet waits
// for that and for the tab bar, whose height places the bar.
export function NowPlayingPanel({ sheetIndex, tabBarHeight }: NowPlayingPanelProps) {
  const [area, setArea] = useState<Area | null>(null);

  function handleAreaLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setArea({ width, height });
  }

  const canShow = area !== null && tabBarHeight > 0;

  // box-none: the screens and the tab bar stay touchable around the sheet.
  return (
    <View
      testID="now-playing-area"
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      onLayout={handleAreaLayout}
    >
      {canShow ? <PlayerSheet area={area} tabBarHeight={tabBarHeight} sheetIndex={sheetIndex} /> : null}
    </View>
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
      // Otherwise the user swiped the bar down: the store stops the session, or, if the drag
      // started on Now Playing, only closes it.
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
  useAnimatedReaction(
    () => {
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
    <BottomSheet
      ref={sheetRef}
      index={initialIndex}
      snapPoints={snapPoints}
      animatedIndex={sheetIndex}
      animatedPosition={sheetTop}
      // Otherwise gorhom adds a content-sized snap point and the indexes shift.
      enableDynamicSizing={false}
      // Swiping the bar down below the screen stops and closes the player (the store decides).
      enablePanDownToClose={true}
      // Never past either end.
      enableOverDrag={false}
      handleComponent={null}
      // The card draws the colours.
      backgroundComponent={null}
      // Never change this: gorhom swaps the view around its content when it changes, which
      // remounts the whole player and makes the artwork blink.
      enableContentPanningGesture={true}
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
  );
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
