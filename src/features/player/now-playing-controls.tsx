import { PlayerControls } from '@/components/NowPlaying/player-controls';

import { skipBack15, skipForward15, toggle } from './audio-engine';
import { usePlayerStore } from './player.store';

function handleBackPress() {
  skipBack15();
}

function handleForwardPress() {
  skipForward15();
}

// Now Playing's back 15 / play-pause / forward 15, connected to the player.
// The button shows what the player reports (isPlaying), never what was last pressed: pressing
// asks the engine, and the next status update changes the label.
export function NowPlayingControls() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  let state: 'playing' | 'paused' = 'paused';
  if (isPlaying) {
    state = 'playing';
  }

  return (
    <PlayerControls
      state={state}
      onBackPress={handleBackPress}
      onTogglePress={toggle}
      onForwardPress={handleForwardPress}
    />
  );
}
