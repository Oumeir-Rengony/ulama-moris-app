import { router } from 'expo-router';

import * as engine from '@/features/player/audio-engine';
import { MINI_PLAYER_EXIT_MS } from '@/features/player/mini-player-motion';
import { openNowPlaying, openNowPlayingForLoadedLecture } from '@/features/player/open-now-playing';
import {
  initialPlayerState,
  selectCurrentLecture,
  selectIsMiniPlayerVisible,
  usePlayerStore,
} from '@/features/player/player.store';
import { eventSource, latestSource, queueOfThree, searchSource } from '@/test-utils/fixtures';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), replace: jest.fn(), push: jest.fn() },
}));
jest.mock('@/features/player/audio-engine', () => ({
  playLecture: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
}));

const [first, second] = queueOfThree;
const navigate = jest.mocked(router.navigate);
const replace = jest.mocked(router.replace);
const playLecture = jest.mocked(engine.playLecture);
const pause = jest.mocked(engine.pause);
const resume = jest.mocked(engine.resume);

// A session with `first` loaded and paused, the mini player showing.
function loadFirstWithMiniPlayerShowing() {
  usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
  usePlayerStore.getState().applyStatus({
    isPlaying: false,
    isBuffering: false,
    isLoaded: true,
    positionSec: 965,
    durationSec: 2781,
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  usePlayerStore.setState(initialPlayerState);
  navigate.mockReset();
  replace.mockReset();
  playLecture.mockReset();
  pause.mockReset();
  resume.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('openNowPlaying', () => {
  it('with nothing loaded: records the intent, then navigates, then loads, with no wait', async () => {
    let wasOnScreenWhenNavigating = false;
    navigate.mockImplementation(() => {
      wasOnScreenWhenNavigating = usePlayerStore.getState().isNowPlayingOnScreen;
    });

    await openNowPlaying({ lecture: second, queue: queueOfThree, source: eventSource, resumeIfPaused: false });

    expect(wasOnScreenWhenNavigating).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/player');
    expect(playLecture).toHaveBeenCalledWith(second, queueOfThree, eventSource);
    expect(navigate.mock.invocationCallOrder[0]).toBeLessThan(playLecture.mock.invocationCallOrder[0]);
    expect(pause).not.toHaveBeenCalled();
  });

  it('records the intent before any audio, so the mini player is already hidden', async () => {
    loadFirstWithMiniPlayerShowing();
    let wasMiniPlayerVisibleAtLoad = true;
    playLecture.mockImplementation(() => {
      wasMiniPlayerVisibleAtLoad = selectIsMiniPlayerVisible(usePlayerStore.getState());
    });

    const opening = openNowPlaying({ lecture: second, queue: queueOfThree, source: latestSource, resumeIfPaused: false });
    await jest.advanceTimersByTimeAsync(MINI_PLAYER_EXIT_MS);
    await opening;

    expect(playLecture).toHaveBeenCalledTimes(1);
    expect(wasMiniPlayerVisibleAtLoad).toBe(false);
  });

  it('for the loaded lecture: shows it without reloading, and resumes only from a play button', async () => {
    loadFirstWithMiniPlayerShowing();
    await openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: false });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(playLecture).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();

    usePlayerStore.getState().setIsNowPlayingOnScreen(false);
    await openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: true });
    expect(resume).toHaveBeenCalledTimes(1);
    expect(playLecture).not.toHaveBeenCalled();
  });

  it('for a different lecture while the bar shows: hides the bar, pauses, waits for it to leave, then opens', async () => {
    loadFirstWithMiniPlayerShowing();

    const opening = openNowPlaying({ lecture: second, queue: queueOfThree, source: latestSource, resumeIfPaused: false });

    // At once: the bar is hidden and the old lecture stops.
    expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(false);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(playLecture).not.toHaveBeenCalled();

    // During the wait, the bar would still show the OLD lecture, but it's hidden.
    await jest.advanceTimersByTimeAsync(MINI_PLAYER_EXIT_MS - 1);
    expect(selectCurrentLecture(usePlayerStore.getState())).toBe(first);
    expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(false);
    expect(playLecture).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    await opening;
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(playLecture).toHaveBeenCalledWith(second, queueOfThree, latestSource);
    expect(navigate.mock.invocationCallOrder[0]).toBeLessThan(playLecture.mock.invocationCallOrder[0]);
  });

  it('ignores a double tap', async () => {
    const request = { lecture: second, queue: queueOfThree, source: latestSource, resumeIfPaused: false };
    await openNowPlaying(request);
    await openNowPlaying(request);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(playLecture).toHaveBeenCalledTimes(1);
  });

  it('ignores a tap while Now Playing is still on screen (for example closing)', async () => {
    usePlayerStore.getState().setIsNowPlayingOnScreen(true);
    await openNowPlaying({ lecture: second, queue: queueOfThree, source: latestSource, resumeIfPaused: false });

    expect(navigate).not.toHaveBeenCalled();
    expect(playLecture).not.toHaveBeenCalled();
  });

  it('a failure does not leave the app unable to open anything', async () => {
    const failure = new Error('navigation failed');
    navigate.mockImplementation(() => {
      throw failure;
    });

    await expect(
      openNowPlaying({ lecture: second, queue: queueOfThree, source: latestSource, resumeIfPaused: false }),
    ).rejects.toBe(failure);
    expect(usePlayerStore.getState().isNowPlayingOnScreen).toBe(false);
  });

  it('from Search, replaces the Search screen instead of stacking on it', async () => {
    await openNowPlaying({
      lecture: second,
      queue: [second],
      source: searchSource,
      resumeIfPaused: true,
      replaceCurrentScreen: true,
    });

    expect(replace).toHaveBeenCalledWith('/player');
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('openNowPlayingForLoadedLecture', () => {
  it('opens Now Playing without loading or playing anything', () => {
    loadFirstWithMiniPlayerShowing();
    openNowPlayingForLoadedLecture();

    expect(navigate).toHaveBeenCalledWith('/player');
    expect(usePlayerStore.getState().isNowPlayingOnScreen).toBe(true);
    expect(playLecture).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it('does nothing when nothing is loaded', () => {
    openNowPlayingForLoadedLecture();
    expect(navigate).not.toHaveBeenCalled();
  });
});
