import { View } from 'react-native';

import { CoverArt } from '@/components/artwork/cover-art';
import { MiniPlayer } from '@/components/MiniPlayer';
import { miniPlayer } from '@/components/MiniPlayer/tokens';

import { skipForward15, toggle } from './audio-engine';
import { pickMiniPlayerPlayState } from './mini-player-play-state';
import { MiniPlayerProgressLine } from './mini-player-progress-line';
import { dismissMiniPlayer, openNowPlayingForLoadedLecture } from './open-now-playing';
import { selectCurrentLecture, selectHasAudioFailed, selectIsMiniPlayerVisible, usePlayerStore } from './player.store';

type MiniPlayerBarProps = {
  // Distance from the bottom of the tabs layout: the tab bar's measured height plus the gap.
  // 0 until the tab bar has been measured.
  bottomOffset: number;
};

// The screens' content column (Home, Events, Now Playing) is at most 600 wide and centred. The
// bar sits in the same column, minus its 12 px side inset on each side, so on a wide window (web,
// tablets) it lines up with the content instead of stretching from edge to edge.
const BAR_MAX_WIDTH = 600 - 12 * 2;

function handleSkipForwardPress() {
  skipForward15();
}

// The floating bar above the tab bar. A plain view: no animation and no gestures. It shows while
// a lecture is active; while Now Playing is open, that screen covers it.
export function MiniPlayerBar({ bottomOffset }: MiniPlayerBarProps) {
  const lecture = usePlayerStore(selectCurrentLecture);
  const isVisible = usePlayerStore(selectIsMiniPlayerVisible);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const hasAudioFailed = usePlayerStore(selectHasAudioFailed);

  const isTabBarMeasured = bottomOffset > 0;
  if (lecture === null || !isVisible || !isTabBarMeasured) {
    return null;
  }

  const thumbnail = (
    <View className={`h-11 w-11 overflow-hidden rounded-thumb-sm ${miniPlayer.thumbBg}`}>
      <CoverArt />
    </View>
  );

  // box-none: the screen underneath stays touchable on both sides of the bar.
  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 items-center px-bar" style={{ bottom: bottomOffset }}>
      <View className="w-full" style={{ maxWidth: BAR_MAX_WIDTH }}>
        <MiniPlayer
          title={lecture.title}
          author={lecture.author}
          playState={pickMiniPlayerPlayState({ isLoaded, isBuffering, isPlaying, hasAudioFailed })}
          progressLine={<MiniPlayerProgressLine />}
          onOpenPress={openNowPlayingForLoadedLecture}
          onTogglePress={toggle}
          onSkipForwardPress={handleSkipForwardPress}
          onDismiss={dismissMiniPlayer}
          thumbnail={thumbnail}
          background="filled"
        />
      </View>
    </View>
  );
}
