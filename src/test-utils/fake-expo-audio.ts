// TEST ONLY. A stand-in for the expo-audio module, for the player tests:
//   jest.mock('expo-audio', () => require('@/test-utils/fake-expo-audio'));
// It records what the engine asks the player to do, and lets a test set the player's fields and
// its status, so playback can be tested without audio hardware.
// Field and method names follow the installed expo-audio types (node_modules/expo-audio/build).
import { useSyncExternalStore } from 'react';

export type FakeStatus = {
  playing: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  didJustFinish: boolean;
  mediaServicesDidReset?: boolean;
  // Set (once) when the audio fails to load, as expo-audio does. null otherwise.
  error: string | null;
};

const initialStatus: FakeStatus = {
  playing: false,
  isBuffering: false,
  isLoaded: false,
  currentTime: 0,
  duration: 0,
  didJustFinish: false,
  error: null,
};

// The one player the engine creates.
export const fakePlayer = {
  playing: false,
  isLoaded: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  // The live status. Only timeControlStatus is read (the stall check); a test sets it to
  // 'waitingToPlayAtSpecifiedRate' to act out a connection that dropped mid-lecture.
  currentStatus: { timeControlStatus: 'paused' },
  replace: jest.fn(),
  play: jest.fn(() => {
    fakePlayer.playing = true;
  }),
  pause: jest.fn(() => {
    fakePlayer.playing = false;
  }),
  seekTo: jest.fn(async (seconds: number) => {
    fakePlayer.currentTime = seconds;
  }),
  setActiveForLockScreen: jest.fn(),
  updateLockScreenMetadata: jest.fn(),
  clearLockScreenControls: jest.fn(),
};

export const createAudioPlayer = jest.fn(() => fakePlayer);
export const setAudioModeAsync = jest.fn(async () => {});
export const requestNotificationPermissionsAsync = jest.fn(async () => ({ granted: true }));

// ---------- The status that useAudioPlayerStatus returns ----------

let currentStatus: FakeStatus = { ...initialStatus };
const statusListeners = new Set<() => void>();

function subscribeToStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

function readStatus() {
  return currentStatus;
}

export function useAudioPlayerStatus(): FakeStatus {
  return useSyncExternalStore(subscribeToStatus, readStatus);
}

// Sends a new status, as the real player does several times a second. Wrap in `act`.
export function setFakeStatus(changes: Partial<FakeStatus>): void {
  currentStatus = { ...currentStatus, ...changes };
  for (const listener of statusListeners) {
    listener();
  }
}

// Puts the fake back to a fresh player with no calls recorded. Call in beforeEach.
export function resetFakeAudio(): void {
  fakePlayer.playing = false;
  fakePlayer.isLoaded = false;
  fakePlayer.isBuffering = false;
  fakePlayer.currentTime = 0;
  fakePlayer.duration = 0;
  fakePlayer.currentStatus = { timeControlStatus: 'paused' };
  fakePlayer.replace.mockClear();
  fakePlayer.play.mockClear();
  fakePlayer.pause.mockClear();
  fakePlayer.seekTo.mockClear();
  fakePlayer.setActiveForLockScreen.mockClear();
  fakePlayer.updateLockScreenMetadata.mockClear();
  fakePlayer.clearLockScreenControls.mockClear();
  setAudioModeAsync.mockClear();
  requestNotificationPermissionsAsync.mockClear();
  currentStatus = { ...initialStatus };
}
