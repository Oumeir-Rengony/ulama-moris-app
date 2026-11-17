import { pickMiniPlayerPlayState } from '@/features/player/mini-player-play-state';

describe('pickMiniPlayerPlayState', () => {
  it('shows loading until the audio has loaded', () => {
    expect(pickMiniPlayerPlayState({ isLoaded: false, isBuffering: false, isPlaying: false, hasAudioFailed: false })).toBe('loading');
  });

  it('shows loading while buffering, even if playing', () => {
    expect(pickMiniPlayerPlayState({ isLoaded: true, isBuffering: true, isPlaying: true, hasAudioFailed: false })).toBe('loading');
  });

  it('shows playing while playing', () => {
    expect(pickMiniPlayerPlayState({ isLoaded: true, isBuffering: false, isPlaying: true, hasAudioFailed: false })).toBe('playing');
  });

  it('shows paused otherwise', () => {
    expect(pickMiniPlayerPlayState({ isLoaded: true, isBuffering: false, isPlaying: false, hasAudioFailed: false })).toBe('paused');
  });

  it('shows the disabled play button when the audio did not load, whatever else the status says', () => {
    expect(pickMiniPlayerPlayState({ isLoaded: false, isBuffering: true, isPlaying: false, hasAudioFailed: true })).toBe(
      'failed',
    );
  });
});
