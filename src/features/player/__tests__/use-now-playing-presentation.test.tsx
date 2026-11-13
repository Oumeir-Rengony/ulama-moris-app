import { renderHook } from '@testing-library/react-native';
import { useNavigation } from 'expo-router';

import { initialPlayerState, usePlayerStore } from '@/features/player/player.store';
import {
  NOW_PLAYING_CLOSE_ANIMATION_MS,
  useNowPlayingPresentation,
} from '@/features/player/use-now-playing-presentation';

jest.mock('expo-router', () => ({ useNavigation: jest.fn() }));

type TransitionEndHandler = (event: { data: { closing: boolean } }) => void;

let transitionEndHandler: TransitionEndHandler | null = null;
const removeListener = jest.fn();

// A navigation object that records the screen's transitionEnd listener.
const fakeNavigation = {
  addListener: jest.fn((eventName: string, handler: TransitionEndHandler) => {
    if (eventName === 'transitionEnd') {
      transitionEndHandler = handler;
    }
    return removeListener;
  }),
};

beforeEach(() => {
  jest.useFakeTimers();
  usePlayerStore.setState(initialPlayerState);
  transitionEndHandler = null;
  removeListener.mockClear();
  jest.mocked(useNavigation).mockReturnValue(fakeNavigation);
});

afterEach(() => {
  jest.useRealTimers();
});

function isNowPlayingOnScreen() {
  return usePlayerStore.getState().isNowPlayingOnScreen;
}

describe('useNowPlayingPresentation', () => {
  it('is on screen from mount until the closing animation has ended', async () => {
    await renderHook(() => useNowPlayingPresentation());
    expect(isNowPlayingOnScreen()).toBe(true);

    // The opening animation ending changes nothing.
    transitionEndHandler?.({ data: { closing: false } });
    expect(isNowPlayingOnScreen()).toBe(true);

    transitionEndHandler?.({ data: { closing: true } });
    expect(isNowPlayingOnScreen()).toBe(false);
  });

  it('after a native dismissal, does not wait again when the screen unmounts', async () => {
    const { unmount } = await renderHook(() => useNowPlayingPresentation());
    transitionEndHandler?.({ data: { closing: true } });
    await unmount();

    expect(isNowPlayingOnScreen()).toBe(false);
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it('closed without a closing event (the chevron, web): stays on screen until the slide-down ends', async () => {
    const { unmount } = await renderHook(() => useNowPlayingPresentation());
    await unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);

    // Still sliding away: the mini player must not show yet.
    jest.advanceTimersByTime(NOW_PLAYING_CLOSE_ANIMATION_MS - 1);
    expect(isNowPlayingOnScreen()).toBe(true);

    jest.advanceTimersByTime(1);
    expect(isNowPlayingOnScreen()).toBe(false);
  });

  it('opening again before the last close finished cancels that close', async () => {
    const first = await renderHook(() => useNowPlayingPresentation());
    await first.unmount();

    await renderHook(() => useNowPlayingPresentation());
    jest.advanceTimersByTime(NOW_PLAYING_CLOSE_ANIMATION_MS * 2);

    expect(isNowPlayingOnScreen()).toBe(true);
  });
});
