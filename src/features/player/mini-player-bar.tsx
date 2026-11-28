import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler';

import { MiniPlayer } from '@/components/MiniPlayer';

import { toggle } from './audio-engine';
import { pickMiniPlayerPlayState } from './mini-player-play-state';
import { MiniPlayerProgressLine } from './mini-player-progress-line';
import { dismissMiniPlayer, openNowPlayingForLoadedLecture } from './open-now-playing';
import { BAR_TAP_MAX_DISTANCE } from './player-motion-config';
import { selectCurrentLecture, selectHasAudioFailed, selectIsMiniPlayerVisible, usePlayerStore } from './player.store';

// Where the 44 px thumbnail sits, relative to the bar's top-left corner (which is the card's).
export type ThumbnailSlot = {
  x: number;
  y: number;
  size: number;
};

type MiniPlayerBarProps = {
  // The bar's measured height. The sheet's bar size is worked out from it.
  onHeightChange: (height: number) => void;
  // Where the empty thumbnail slot is. The player draws the one artwork over it.
  onThumbnailSlotChange: (slot: ThumbnailSlot) => void;
};

// The mini player: the bar's row at the top of the player card. The card is what moves; this row
// only fades out as the card grows into Now Playing.
//
// Tap it to open Now Playing. Its tap is a Gesture Handler tap, drawn under the row, so a finger
// that moves (a drag up) is the sheet's, never the tap's. While Now Playing is open the row sits
// over the top of the full player (invisible), so it takes no touches and screen readers skip it.
// Swiping the bar down (the player sheet) stops playback; screen readers use the action "Stop and
// close player".
export function MiniPlayerBar({ onHeightChange, onThumbnailSlotChange }: MiniPlayerBarProps) {
  const lecture = usePlayerStore(selectCurrentLecture);
  const isVisible = usePlayerStore(selectIsMiniPlayerVisible);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const hasAudioFailed = usePlayerStore(selectHasAudioFailed);

  const tapGesture = useTapGesture({
    maxDistance: BAR_TAP_MAX_DISTANCE,
    runOnJS: true,
    onActivate: () => {
      openNowPlayingForLoadedLecture();
    },
  });

  function handleBarLayout(event: LayoutChangeEvent) {
    const measuredHeight = event.nativeEvent.layout.height;
    if (measuredHeight > 0) {
      onHeightChange(measuredHeight);
    }
  }

  function handleThumbnailLayout(event: LayoutChangeEvent) {
    const { x, y, width } = event.nativeEvent.layout;
    onThumbnailSlotChange({ x, y, size: width });
  }

  if (lecture === null) {
    return null;
  }

  // Empty: the player draws the artwork over it (the same artwork grows into Now Playing's).
  const thumbnailSlot = (
    <View
      testID="mini-player-thumbnail-slot"
      pointerEvents="none"
      className="h-11 w-11"
      onLayout={handleThumbnailLayout}
    />
  );

  return (
    <View
      testID="mini-player-bar"
      onLayout={handleBarLayout}
      pointerEvents={isVisible ? 'box-none' : 'none'}
      accessibilityElementsHidden={!isVisible}
      importantForAccessibility={isVisible ? 'auto' : 'no-hide-descendants'}
    >
      {/* The tap area, under the row: the row lets touches through everywhere but play/pause. */}
      <GestureDetector gesture={tapGesture}>
        <View testID="mini-player-tap-area" style={StyleSheet.absoluteFill} />
      </GestureDetector>
      <MiniPlayer
        title={lecture.title}
        author={lecture.author}
        playState={pickMiniPlayerPlayState({
          isLoaded,
          isBuffering,
          isPlaying,
          hasAudioFailed,
        })}
        progressLine={<MiniPlayerProgressLine />}
        onOpenPress={openNowPlayingForLoadedLecture}
        onTogglePress={toggle}
        onDismiss={dismissMiniPlayer}
        thumbnail={thumbnailSlot}
        background="transparent"
      />
    </View>
  );
}
