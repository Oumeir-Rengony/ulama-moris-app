import { pickMiniPlayerPlayState } from '@/features/player/mini-player-play-state';

describe('pickMiniPlayerPlayState', () => {
  it('shows loading until the audio has loaded', () => {
    expect(pickMiniPlayerPlayState({ isLoaded: false, isBuffering: false, isPlaying: false })).toBe('loading');
  });

  it('shows loading while buffering, even if playing', () => {
    expect(pickMiniPlayerPlayState({ isLoaded: true, isBuffering: true, isPlaying: true })).toBe('loading');
  });

  it('shows playing while playing', () => {
    expect(pickMiniPlayerPlayState({ isLoaded: true, isBuffering: false, isPlaying: true })).toBe('playing');
  });

  it('shows paused otherwise', () => {
    expect(pickMiniPlayerPlayState({ isLoaded: true, isBuffering: false, isPlaying: false })).toBe('paused');
  });
});
