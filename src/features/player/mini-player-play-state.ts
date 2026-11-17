export type MiniPlayerPlayState = 'playing' | 'paused' | 'loading' | 'failed';

type PlaybackFlags = {
  isLoaded: boolean;
  isBuffering: boolean;
  isPlaying: boolean;
  hasAudioFailed: boolean;
};

// Which control the mini player shows: a disabled play button when the audio didn't load, a
// spinner while the audio loads or buffers, otherwise pause (playing) or play (everything else).
export function pickMiniPlayerPlayState({
  isLoaded,
  isBuffering,
  isPlaying,
  hasAudioFailed,
}: PlaybackFlags): MiniPlayerPlayState {
  if (hasAudioFailed) {
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
