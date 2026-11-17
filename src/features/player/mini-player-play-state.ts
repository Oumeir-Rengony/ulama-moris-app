import type { AudioLoadState } from './player.store';

export type MiniPlayerPlayState = 'playing' | 'paused' | 'loading' | 'failed';

type PlaybackFlags = {
  isLoaded: boolean;
  isBuffering: boolean;
  isPlaying: boolean;
  audioLoadState: AudioLoadState;
};

// Which control the mini player shows: a disabled play button when the audio didn't load, a
// spinner while the audio loads or buffers, otherwise pause (playing) or play (everything else).
export function pickMiniPlayerPlayState({
  isLoaded,
  isBuffering,
  isPlaying,
  audioLoadState,
}: PlaybackFlags): MiniPlayerPlayState {
  if (audioLoadState === 'failed') {
    return 'failed';
  }
  if (!isLoaded) {
    return 'loading';
  }
  if (isBuffering) {
    return 'loading';
  }
  if (isPlaying) {
    return 'playing';
  }
  return 'paused';
}
