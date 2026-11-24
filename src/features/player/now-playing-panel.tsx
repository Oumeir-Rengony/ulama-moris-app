import BottomSheet, { useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { useThemeColors } from '@/theme/tokens';

import { NowPlayingView } from './now-playing-view';
import { closeNowPlaying, handlePanelReleased } from './open-now-playing';
import type { PanelDecision } from './panel-rules';
import { PanelReleaseContext, usePanelSheetGestures } from './panel-sheet-gestures';
import { PANEL_ACTIVE_OFFSET_Y, PANEL_BLEED, PANEL_FAIL_OFFSET_X, PANEL_SPRING } from './player-motion-config';
import { selectCurrentLecture, usePlayerStore } from './player.store';

// Now Playing: a full-screen panel that slides up from the bottom over everything in the tabs
// layout (tab bar included), and slides away again to reveal the mini player underneath.
//
// The store is the only source of truth. The panel animates to whatever
// `nowPlayingPresentation` says, and nothing reads the store's state back from where the panel
// is. The one exception is the panel's own drag: when the finger lets go, the release decides
// open or closed and hands that decision to the flow file (handlePanelReleased).
//
// The sliding itself is a @gorhom/bottom-sheet with one snap point (the whole area): index 0 =
// open, −1 = closed below the bottom edge. Its release is ours (panel-sheet-gestures.ts), and none
// of its callbacks (onAnimate, onChange, onClose) are used.
//
// The outer view only measures the area (the panel's travel is its height). The panel itself is
// mounted while a lecture is loaded.
export function NowPlayingPanel() {
  const hasLecture = usePlayerStore((state) => selectCurrentLecture(state) !== null);
  const [height, setHeight] = useState<number | null>(null);

  function handleAreaLayout(event: LayoutChangeEvent) {
    setHeight(event.nativeEvent.layout.height);
  }

  const canShow = hasLecture && height !== null;

  // box-none: the screens, the bar and the tab bar stay touchable while the panel is off-screen.
  return (
    <View testID="now-playing-area" pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={handleAreaLayout}>
      {canShow ? <SlidingPanel height={height} /> : null}
    </View>
  );
}

type SlidingPanelProps = {
  // The area's height: the sheet covers all of it when open.
  height: number;
};

// The sheet's only snap point: the whole area. At module scope, so it is always the same array.
const SNAP_POINTS = ['100%'];

function SlidingPanel({ height }: SlidingPanelProps) {
  const isOpen = usePlayerStore((state) => state.nowPlayingPresentation === 'open');
  const colors = useThemeColors();
  const { colorScheme } = useColorScheme();
  const sheetRef = useRef<BottomSheet>(null);

  // Where the sheet starts, read once: straight into Now Playing if a row opened it with nothing
  // loaded (it slides up from the bottom on mount), otherwise closed below the bottom edge.
  const [initialIndex] = useState(isOpen ? 0 : -1);

  // Where the sheet is heading. The release sets it before the store hears the decision, so the
  // effect below doesn't restart a spring the gesture already started.
  const headingTo = useRef<PanelDecision>(isOpen ? 'open' : 'closed');

  // Follow the store.
  useEffect(() => {
    let target: PanelDecision = 'closed';
    if (isOpen) {
      target = 'open';
    }
    const isAlreadyHeadingThere = headingTo.current === target;
    if (isAlreadyHeadingThere) {
      return;
    }
    headingTo.current = target;
    if (target === 'open') {
      sheetRef.current?.snapToIndex(0);
      return;
    }
    sheetRef.current?.close();
  }, [isOpen]);

  // The sheet's drag was let go (panel-sheet-gestures.ts): its spring has already started.
  const handleSheetReleased = useCallback((decision: PanelDecision) => {
    headingTo.current = decision;
    handlePanelReleased(decision);
  }, []);

  // Android back closes Now Playing instead of leaving the screen. (Web has no back handler.)
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

  // Every spring is the same on iOS and Android (gorhom's Android default is a timing curve).
  const animationConfigs = useBottomSheetSpringConfigs(PANEL_SPRING);

  // bg in light; in dark one step lighter (surface1), so while it slides it stands apart from the
  // dark screens behind it.
  let cardColor = colors.bg;
  if (colorScheme === 'dark') {
    cardColor = colors.surface1;
  }

  // While closed (or closing), screen readers skip the panel. While open, it is modal: screen
  // readers stay inside it. Touches aren't switched off while closing, so a closing panel can be
  // grabbed and pushed back up; once closed it is off-screen and can't be touched anyway.
  return (
    <PanelReleaseContext value={handleSheetReleased}>
      <BottomSheet
        ref={sheetRef}
        index={initialIndex}
        animateOnMount
        snapPoints={SNAP_POINTS}
        // Otherwise gorhom adds a content-sized snap point and the indexes shift.
        enableDynamicSizing={false}
        // Lets the drag travel all the way down to closed. The release decides (ours).
        enablePanDownToClose
        // Never past fully open.
        enableOverDrag={false}
        handleComponent={null}
        // The card colour is on the content below, with its bleed strip.
        backgroundComponent={null}
        animationConfigs={animationConfigs}
        gestureEventsHandlersHook={usePanelSheetGestures}
        activeOffsetY={PANEL_ACTIVE_OFFSET_Y}
        failOffsetX={PANEL_FAIL_OFFSET_X}
        // Gorhom makes its content one accessible element by default ("Bottom Sheet",
        // adjustable), which groups everything inside: screen readers couldn't reach the chevron
        // or the controls. The content view below sets the screen-reader behaviour instead.
        accessible={false}
      >
        <View
          testID="now-playing-panel"
          accessibilityViewIsModal={isOpen}
          accessibilityElementsHidden={!isOpen}
          importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
          style={{ height, backgroundColor: cardColor }}
        >
          <NowPlayingView />
          {/* The opening spring overshoots upwards a little: this strip below the bottom edge keeps
              the screen's bottom covered meanwhile. */}
          <View pointerEvents="none" style={[styles.bleed, { backgroundColor: cardColor }]} />
        </View>
      </BottomSheet>
    </PanelReleaseContext>
  );
}

const styles = StyleSheet.create({
  bleed: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    height: PANEL_BLEED,
  },
});
