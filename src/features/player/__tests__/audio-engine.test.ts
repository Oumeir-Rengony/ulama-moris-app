import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  finishPendingResumeIfReady,
  playLecture,
  playNext,
  reloadFailedLecture,
  seek,
  skip,
  stopAndClear,
  toggle,
} from '@/features/player/audio-engine';
import { useForcedFailuresStore } from '@/features/dev/forced-failures.store';
import { initialListeningHistoryState, useListeningHistoryStore } from '@/features/player/listening-history.store';
import { LOCK_SCREEN_ARTWORK_URL } from '@/features/player/lock-screen-artwork';
import {
  initialPlayerState,
  selectCurrentLecture,
  selectHasAudioFailed,
  usePlayerStore,
} from '@/features/player/player.store';
import { setupAudio } from '@/features/player/setup-audio';
import * as fakeAudio from '@/test-utils/fake-expo-audio';
import { eventSource, latestSource, queueOfThree } from '@/test-utils/fixtures';

// jest.mock factories run before imports, so they load the fake with require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-audio', () => require('@/test-utils/fake-expo-audio'));

const { fakePlayer } = fakeAudio;
const [first, second, third] = queueOfThree;

const expectedLockScreenOptions = {
  showSeekBackward: true,
  showSeekForward: true,
  showNextTrack: false,
  showPreviousTrack: false,
  seekBackwardIntervalSeconds: 15,
  seekForwardIntervalSeconds: 15,
};

beforeEach(async () => {
  // Ends any session (and any pending resume) left by the previous test, then starts clean.
  stopAndClear();
  usePlayerStore.setState(initialPlayerState);
  useListeningHistoryStore.setState(initialListeningHistoryState);
  fakeAudio.resetFakeAudio();
  useForcedFailuresStore.setState({ active: [] });
  await AsyncStorage.clear();
});

function loadedAt(currentTime: number, duration: number) {
  fakePlayer.isLoaded = true;
  fakePlayer.currentTime = currentTime;
  fakePlayer.duration = duration;
}

describe('the player', () => {
  it('is created once, with a 250 ms status interval, however many lectures play', () => {
    playLecture(first, queueOfThree, latestSource);
    playLecture(second, queueOfThree, latestSource);
    playLecture(third, queueOfThree, latestSource);

    expect(fakeAudio.createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(fakeAudio.createAudioPlayer).toHaveBeenCalledWith(null, { updateInterval: 250 });
  });
});

describe('playLecture', () => {
  it('loads the lecture, registers the lock screen, then plays, in that order', () => {
    playLecture(second, queueOfThree, eventSource);

    expect(fakePlayer.replace).toHaveBeenCalledWith({ uri: second.url, name: second.title });
    expect(fakePlayer.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      {
        title: second.title,
        artist: second.author,
        albumTitle: eventSource.eventTitle,
        artworkUrl: LOCK_SCREEN_ARTWORK_URL,
      },
      expectedLockScreenOptions,
    );
    expect(fakePlayer.play).toHaveBeenCalledTimes(1);

    const replaceOrder = fakePlayer.replace.mock.invocationCallOrder[0];
    const lockScreenOrder = fakePlayer.setActiveForLockScreen.mock.invocationCallOrder[0];
    const playOrder = fakePlayer.play.mock.invocationCallOrder[0];
    expect(replaceOrder).toBeLessThan(lockScreenOrder);
    expect(lockScreenOrder).toBeLessThan(playOrder);
  });

  it('with autoplay off, loads and registers the lock screen but never plays', () => {
    playLecture(second, queueOfThree, eventSource, { autoplay: false });

    expect(fakePlayer.replace).toHaveBeenCalledTimes(1);
    expect(fakePlayer.setActiveForLockScreen).toHaveBeenCalledTimes(1);
    expect(fakePlayer.play).not.toHaveBeenCalled();
  });

  it('puts the queue, the start index and the source in the store', () => {
    playLecture(second, queueOfThree, eventSource);

    const state = usePlayerStore.getState();
    expect(state.queue).toEqual(queueOfThree);
    expect(state.currentIndex).toBe(1);
    expect(state.source).toEqual(eventSource);
  });

  it('plays the lecture on its own when the queue does not contain it', () => {
    playLecture(first, [second, third], latestSource);

    expect(usePlayerStore.getState().queue).toEqual([first]);
    expect(selectCurrentLecture(usePlayerStore.getState())).toBe(first);
  });

  it('never reloads the lecture that is already loaded, and keeps its queue', () => {
    playLecture(second, queueOfThree, eventSource);
    fakePlayer.pause();
    fakePlayer.replace.mockClear();
    fakePlayer.play.mockClear();

    playLecture(second, [second], latestSource);

    expect(fakePlayer.replace).not.toHaveBeenCalled();
    expect(fakePlayer.play).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().queue).toEqual(queueOfThree);
  });

  it('resumes from the saved point once the lecture has loaded, then plays', async () => {
    useListeningHistoryStore.getState().saveProgress(second, 300);

    playLecture(second, queueOfThree, eventSource);
    // Not loaded yet: no seek, and no sound from 0:00.
    expect(fakePlayer.seekTo).not.toHaveBeenCalled();
    expect(fakePlayer.play).not.toHaveBeenCalled();

    fakePlayer.isLoaded = true;
    await finishPendingResumeIfReady();

    expect(fakePlayer.seekTo).toHaveBeenCalledWith(300);
    expect(fakePlayer.play).toHaveBeenCalledTimes(1);
    expect(fakePlayer.seekTo.mock.invocationCallOrder[0]).toBeLessThan(fakePlayer.play.mock.invocationCallOrder[0]);
  });

  it('does not overwrite the resume point with 0 while it is still being restored', () => {
    useListeningHistoryStore.getState().saveProgress(second, 300);
    playLecture(second, queueOfThree, eventSource);

    // A checkpoint before the lecture has loaded (for example the app going to the background).
    stopAndClear();

    expect(useListeningHistoryStore.getState().progressById[second.slug]).toBe(300);
  });

  it('saves where the outgoing lecture was when another one starts', () => {
    playLecture(first, queueOfThree, latestSource);
    loadedAt(42, 2781);

    playLecture(third, queueOfThree, latestSource);

    expect(useListeningHistoryStore.getState().progressById[first.slug]).toBe(42);
  });
});

describe('toggle', () => {
  it('pauses while playing, and plays while paused', () => {
    playLecture(first, queueOfThree, latestSource);
    fakePlayer.play.mockClear();

    toggle();
    expect(fakePlayer.pause).toHaveBeenCalledTimes(1);

    toggle();
    expect(fakePlayer.play).toHaveBeenCalledTimes(1);
  });

  it('never sets isPlaying in the store itself: that comes from the status', () => {
    playLecture(first, queueOfThree, latestSource);
    toggle();
    toggle();

    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });
});

describe('seek and skip', () => {
  beforeEach(() => {
    playLecture(first, queueOfThree, latestSource);
  });

  it('skip(15) moves forward 15 seconds', async () => {
    loadedAt(100, 2781);
    await skip(15);
    expect(fakePlayer.seekTo).toHaveBeenCalledWith(115);
  });

  it('skip(15) near the end stops at the end', async () => {
    loadedAt(2770, 2781);
    await skip(15);
    expect(fakePlayer.seekTo).toHaveBeenCalledWith(2781);
  });

  it('skip(-15) near the start stops at 0', async () => {
    loadedAt(5, 2781);
    await skip(-15);
    expect(fakePlayer.seekTo).toHaveBeenCalledWith(0);
  });

  it('seek keeps the position inside the lecture', async () => {
    loadedAt(100, 2781);
    await seek(-10);
    expect(fakePlayer.seekTo).toHaveBeenLastCalledWith(0);
    await seek(2781 + 50);
    expect(fakePlayer.seekTo).toHaveBeenLastCalledWith(2781);
  });

  it('saves the new position as a checkpoint after the seek has finished', async () => {
    loadedAt(100, 2781);
    await seek(600);
    expect(useListeningHistoryStore.getState().progressById[first.slug]).toBe(600);
  });

  it('does nothing before the lecture has loaded', async () => {
    await seek(600);
    expect(fakePlayer.seekTo).not.toHaveBeenCalled();
  });
});

describe('playNext', () => {
  it('in the middle of the queue, loads the next lecture with its own lock-screen title', () => {
    playLecture(first, queueOfThree, latestSource);
    fakePlayer.replace.mockClear();
    fakePlayer.setActiveForLockScreen.mockClear();

    playNext();

    expect(usePlayerStore.getState().currentIndex).toBe(1);
    expect(fakePlayer.replace).toHaveBeenCalledWith({ uri: second.url, name: second.title });
    expect(fakePlayer.setActiveForLockScreen.mock.calls[0][1].title).toBe(second.title);
  });

  it('at the end of the queue, stops at the start and keeps the lock-screen card', () => {
    playLecture(third, queueOfThree, latestSource);
    loadedAt(2781, 2781);
    fakePlayer.replace.mockClear();

    playNext();

    expect(fakePlayer.replace).not.toHaveBeenCalled();
    expect(fakePlayer.pause).toHaveBeenCalled();
    expect(fakePlayer.seekTo).toHaveBeenCalledWith(0);
    expect(fakePlayer.clearLockScreenControls).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().hasQueueEnded).toBe(true);
  });

  it('loading a lecture clears the ended state', () => {
    playLecture(third, queueOfThree, latestSource);
    playNext();
    expect(usePlayerStore.getState().hasQueueEnded).toBe(true);

    playLecture(first, queueOfThree, latestSource);
    expect(usePlayerStore.getState().hasQueueEnded).toBe(false);
  });
});

describe('stopAndClear', () => {
  it('saves the position, pauses, removes the lock-screen card and unloads the lecture', () => {
    playLecture(second, queueOfThree, eventSource);
    loadedAt(700, 2781);

    stopAndClear();

    expect(useListeningHistoryStore.getState().progressById[second.slug]).toBe(700);
    expect(fakePlayer.pause).toHaveBeenCalled();
    expect(fakePlayer.clearLockScreenControls).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().currentIndex).toBeNull();
  });
});

describe('notification permission', () => {
  // Puts Platform.OS back after each test that replaced it.
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('on Android, is asked on the first play only', () => {
    jest.isolateModules(() => {
      jest.replaceProperty(Platform, 'OS', 'android');
      // A fresh copy of the engine (and its fake), so the "asked once" flag starts unset.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const isolatedEngine = require('@/features/player/audio-engine');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const isolatedAudio = require('expo-audio');
      isolatedAudio.requestNotificationPermissionsAsync.mockClear();

      isolatedEngine.playLecture(first, queueOfThree, latestSource);
      isolatedEngine.playLecture(second, queueOfThree, latestSource);

      expect(isolatedAudio.requestNotificationPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('on Android, playback still starts when permission is denied', () => {
    jest.isolateModules(() => {
      jest.replaceProperty(Platform, 'OS', 'android');
      // A fresh copy of the engine (and its fake), so the "asked once" flag starts unset.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const isolatedEngine = require('@/features/player/audio-engine');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const isolatedAudio = require('expo-audio');
      isolatedAudio.requestNotificationPermissionsAsync.mockResolvedValueOnce({ granted: false });
      isolatedAudio.fakePlayer.play.mockClear();

      isolatedEngine.playLecture(first, queueOfThree, latestSource);

      expect(isolatedAudio.fakePlayer.play).toHaveBeenCalledTimes(1);
    });
  });

  it('on iOS, is never asked (it throws there)', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    playLecture(first, queueOfThree, latestSource);
    expect(fakeAudio.requestNotificationPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('setupAudio', () => {
  it('sets the audio mode once, with the mode the lock screen needs', async () => {
    await setupAudio();
    expect(fakeAudio.setAudioModeAsync).toHaveBeenCalledTimes(1);
    expect(fakeAudio.setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  });

  it('logs a failure with its context instead of hiding it', async () => {
    const failure = new Error('audio session busy');
    fakeAudio.setAudioModeAsync.mockRejectedValueOnce(failure);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await setupAudio();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not set the audio mode'), failure);
    // This test expects the console.error; the shared check in jest.setup.ts would fail it otherwise.
    consoleErrorSpy.mockReset();
  });
});

describe('when the audio did not load', () => {
  function failLoading() {
    usePlayerStore.getState().reportAudioFailure();
  }

  it('reloading loads the same lecture again, in the normal loading state, and plays it', () => {
    playLecture(first, queueOfThree, latestSource);
    failLoading();
    fakePlayer.replace.mockClear();

    reloadFailedLecture();

    expect(selectHasAudioFailed(usePlayerStore.getState())).toBe(false);
    expect(fakePlayer.replace).toHaveBeenCalledTimes(1);
    expect(fakePlayer.replace).toHaveBeenCalledWith({ uri: first.url, name: first.title });
    expect(fakePlayer.play).toHaveBeenCalled();
  });

  it('does not load it a second time while the reload is still loading', () => {
    playLecture(first, queueOfThree, latestSource);
    failLoading();
    reloadFailedLecture();
    fakePlayer.replace.mockClear();

    reloadFailedLecture();

    expect(fakePlayer.replace).not.toHaveBeenCalled();
  });

  it('does nothing when the audio has not failed', () => {
    playLecture(first, queueOfThree, latestSource);
    fakePlayer.replace.mockClear();

    reloadFailedLecture();

    expect(fakePlayer.replace).not.toHaveBeenCalled();
    expect(selectHasAudioFailed(usePlayerStore.getState())).toBe(false);
  });

  it('never overwrites the saved point while failed', () => {
    useListeningHistoryStore.getState().saveProgress(first, 965);
    playLecture(first, queueOfThree, latestSource);
    failLoading();

    // A checkpoint while failed: the player's position (0) means nothing and isn't saved.
    stopAndClear();
    expect(useListeningHistoryStore.getState().progressById[first.slug]).toBe(965);
  });

  it('playing the failed lecture again loads it again', () => {
    playLecture(first, queueOfThree, latestSource);
    failLoading();
    fakePlayer.replace.mockClear();

    playLecture(first, queueOfThree, latestSource);

    expect(fakePlayer.replace).toHaveBeenCalledTimes(1);
    expect(selectHasAudioFailed(usePlayerStore.getState())).toBe(false);
  });

  it('starts clean when another lecture is played', () => {
    playLecture(first, queueOfThree, latestSource);
    failLoading();

    playLecture(second, queueOfThree, latestSource);

    expect(selectHasAudioFailed(usePlayerStore.getState())).toBe(false);
  });

  it('never shows the failure on another lecture, even before that lecture loads', () => {
    playLecture(first, queueOfThree, latestSource);
    failLoading();

    // The queue moves on without going through a load (as a future command might).
    usePlayerStore.getState().setCurrentIndex(1);

    expect(selectHasAudioFailed(usePlayerStore.getState())).toBe(false);
  });

  it('starts clean when the failed lecture is played again after another one', () => {
    playLecture(first, queueOfThree, latestSource);
    failLoading();
    playLecture(second, queueOfThree, latestSource);

    playLecture(first, queueOfThree, latestSource);

    expect(selectHasAudioFailed(usePlayerStore.getState())).toBe(false);
  });

  it('starts clean when the queue moves on to the next lecture', () => {
    playLecture(first, queueOfThree, latestSource);
    failLoading();

    playNext();

    expect(selectHasAudioFailed(usePlayerStore.getState())).toBe(false);
  });

  it('loads an address that can never resolve when the development switch is on', () => {
    useForcedFailuresStore.setState({ active: ['audio'] });

    playLecture(first, queueOfThree, latestSource);

    expect(fakePlayer.replace).toHaveBeenCalledWith({
      uri: 'https://forced-failure.invalid/lecture.m4a',
      name: first.title,
    });
  });
});
