export type MiniPlayerPlayState = 'playing' | 'paused' | 'loading';

type PlaybackFlags = {
  isLoaded: boolean;
  isBuffering: boolean;
  isPlaying: boolean;
};

// Which control the mini player shows: a spinner while the audio loads or buffers, otherwise
// pause (playing) or play (everything else, including a failed load).
export function pickMiniPlayerPlayState({ isLoaded, isBuffering, isPlaying }: PlaybackFlags): MiniPlayerPlayState {
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
