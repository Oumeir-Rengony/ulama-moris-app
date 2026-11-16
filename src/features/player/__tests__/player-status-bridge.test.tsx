import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { playLecture, stopAndClear } from '@/features/player/audio-engine';
import { initialListeningHistoryState, useListeningHistoryStore } from '@/features/player/listening-history.store';
import { initialPlayerState, usePlayerStore } from '@/features/player/player.store';
import { PlayerStatusBridge } from '@/features/player/player-status-bridge';
import * as fakeAudio from '@/test-utils/fake-expo-audio';
import { latestSource, queueOfThree } from '@/test-utils/fixtures';
import { renderWithProviders } from '@/test-utils/render-with-providers';

// jest.mock factories run before imports, so they load the fake with require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-audio', () => require('@/test-utils/fake-expo-audio'));

const { fakePlayer, setFakeStatus } = fakeAudio;
const [first, second, third] = queueOfThree;

const loadedStatus = { isLoaded: true, duration: 2781, isBuffering: false };

let appStateListener: ((state: AppStateStatus) => void) | null = null;

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-13T10:00:00Z'));
  stopAndClear();
  usePlayerStore.setState(initialPlayerState);
  useListeningHistoryStore.setState(initialListeningHistoryState);
  fakeAudio.resetFakeAudio();
  await AsyncStorage.clear();

  appStateListener = null;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener;
    return { remove: jest.fn() };
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function renderBridge() {
  await renderWithProviders(<PlayerStatusBridge />);
}

async function sendStatus(changes: Partial<fakeAudio.FakeStatus>) {
  await act(async () => {
    setFakeStatus(changes);
  });
}

function lastPlayedSlug(): string | null {
  return useListeningHistoryStore.getState().lastPlayedSlug;
}

function savedPositionOf(slug: string): number | undefined {
  return useListeningHistoryStore.getState().progressById[slug];
}

describe('PlayerStatusBridge', () => {
  it('copies the status into the store', async () => {
    await renderBridge();
    await sendStatus({ ...loadedStatus, playing: true, currentTime: 12 });

    const state = usePlayerStore.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.positionSec).toBe(12);
    expect(state.durationSec).toBe(2781);
    expect(state.isLoaded).toBe(true);
  });

  it('a pause from outside the app shows in the store and saves a checkpoint', async () => {
    playLecture(first, queueOfThree, latestSource);
    await renderBridge();
    await sendStatus({ ...loadedStatus, playing: true, currentTime: 100 });

    // The lock screen or a phone call pauses: no button was pressed.
    fakePlayer.currentTime = 130;
    await sendStatus({ playing: false, currentTime: 130 });

    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(savedPositionOf(first.slug)).toBe(130);
  });

  it('advances once when a lecture finishes, and the finished one restarts from 0 next time', async () => {
    playLecture(first, queueOfThree, latestSource);
    useListeningHistoryStore.getState().saveProgress(first, 2700);
    await renderBridge();
    fakePlayer.replace.mockClear();

    await sendStatus({ ...loadedStatus, playing: false, didJustFinish: true, currentTime: 2781 });
    // The same finished status arriving again doesn't advance twice.
    await sendStatus({ ...loadedStatus, playing: false, didJustFinish: true, currentTime: 2781 });

    expect(fakePlayer.replace).toHaveBeenCalledTimes(1);
    expect(fakePlayer.replace).toHaveBeenCalledWith({ uri: second.url, name: second.title });
    expect(usePlayerStore.getState().currentIndex).toBe(1);
    // No resume point left: it starts from 0 next time.
    expect(savedPositionOf(first.slug)).toBeUndefined();
  });

  it('shows the lecture in Continue listening as soon as it starts playing', async () => {
    playLecture(first, queueOfThree, latestSource);
    await renderBridge();
    expect(lastPlayedSlug()).toBeNull();

    fakePlayer.currentTime = 0;
    await sendStatus({ ...loadedStatus, playing: true, currentTime: 0 });

    expect(lastPlayedSlug()).toBe(first.slug);
  });

  it('a finished lecture hides Continue listening when the queue ends', async () => {
    useListeningHistoryStore.getState().saveProgress(second, 300);
    playLecture(third, queueOfThree, latestSource);
    await renderBridge();
    await sendStatus({ ...loadedStatus, playing: true, currentTime: 0 });
    expect(lastPlayedSlug()).toBe(third.slug);

    await sendStatus({ ...loadedStatus, playing: false, didJustFinish: true });

    expect(lastPlayedSlug()).toBeNull();
    // The older unfinished lecture keeps its resume point.
    expect(savedPositionOf(second.slug)).toBe(300);
  });

  it('when the last lecture finishes, loads nothing new and ends the queue', async () => {
    playLecture(third, queueOfThree, latestSource);
    await renderBridge();
    fakePlayer.replace.mockClear();

    await sendStatus({ ...loadedStatus, playing: false, didJustFinish: true });

    expect(fakePlayer.replace).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().hasQueueEnded).toBe(true);
  });

  it('playing again after the queue ended brings the session back', async () => {
    playLecture(third, queueOfThree, latestSource);
    await renderBridge();
    await sendStatus({ ...loadedStatus, playing: false, didJustFinish: true });
    expect(usePlayerStore.getState().hasQueueEnded).toBe(true);

    // For example, play pressed on the lock screen.
    await sendStatus({ didJustFinish: false, playing: true });

    expect(usePlayerStore.getState().hasQueueEnded).toBe(false);
  });

  it('saves a checkpoint about every 10 s while playing, not on every update', async () => {
    playLecture(first, queueOfThree, latestSource);
    await renderBridge();
    await sendStatus({ ...loadedStatus, playing: true, currentTime: 0 });
    // Each checkpoint is one write to storage.
    const storageWrites = jest.mocked(AsyncStorage.setItem);
    storageWrites.mockClear();

    // 36 updates over 9 seconds: no save.
    for (let update = 1; update <= 36; update++) {
      jest.advanceTimersByTime(250);
      fakePlayer.currentTime = update * 0.25;
      await sendStatus({ currentTime: update * 0.25 });
    }
    expect(storageWrites).not.toHaveBeenCalled();

    // Crossing 10 seconds: one save.
    for (let update = 37; update <= 44; update++) {
      jest.advanceTimersByTime(250);
      fakePlayer.currentTime = update * 0.25;
      await sendStatus({ currentTime: update * 0.25 });
    }
    expect(storageWrites).toHaveBeenCalledTimes(1);
  });

  it('saves a checkpoint when the app goes to the background', async () => {
    playLecture(first, queueOfThree, latestSource);
    await renderBridge();
    fakePlayer.isLoaded = true;
    fakePlayer.currentTime = 444;

    await act(async () => {
      appStateListener?.('background');
    });

    expect(savedPositionOf(first.slug)).toBe(444);
  });

  it('shows the real player state as soon as the app is back in front', async () => {
    await renderBridge();
    fakePlayer.playing = true;
    fakePlayer.isLoaded = true;
    fakePlayer.currentTime = 999;
    fakePlayer.duration = 2781;

    await act(async () => {
      appStateListener?.('active');
    });

    const state = usePlayerStore.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.positionSec).toBe(999);
    expect(state.durationSec).toBe(2781);
  });

  it('does not play again when iOS media services reset', async () => {
    playLecture(first, queueOfThree, latestSource);
    await renderBridge();
    fakePlayer.play.mockClear();

    await sendStatus({ ...loadedStatus, playing: false, mediaServicesDidReset: true });

    expect(fakePlayer.play).not.toHaveBeenCalled();
  });

  it('finishes a pending resume once the new lecture has loaded', async () => {
    useListeningHistoryStore.getState().saveProgress(second, 300);
    playLecture(second, queueOfThree, latestSource);
    await renderBridge();

    fakePlayer.isLoaded = true;
    await sendStatus({ ...loadedStatus });

    expect(fakePlayer.seekTo).toHaveBeenCalledWith(300);
    expect(fakePlayer.play).toHaveBeenCalled();
  });
});
