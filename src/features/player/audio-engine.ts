import {
  createAudioPlayer,
  requestNotificationPermissionsAsync,
  type AudioLockScreenOptions,
  type AudioMetadata,
  type AudioPlayer,
} from 'expo-audio';
import { Platform } from 'react-native';

import type { Lecture } from '@/features/lectures/lecture.types';

import { useListeningHistoryStore } from './listening-history.store';
import { LOCK_SCREEN_ARTWORK_URL } from './lock-screen-artwork';
import { selectCurrentLecture, selectSourceLabel, usePlayerStore, type QueueSource } from './player.store';

// The audio engine: the only file that controls expo-audio's player.
//
// Buttons call these commands. A command controls the player and updates the queue in the
// store. It never sets isPlaying or positionSec: PlayerStatusBridge copies those from the
// player's status, so the UI is also right when the OS pauses the audio (a call, the lock screen,
// headphones unplugged).

// The one player for the whole app. Never released. updateInterval 250 ms keeps the progress bar
// smooth. Created on first use rather than when this file loads: the web build also renders on
// the server, where expo-audio's web player can't be created (it needs the browser's `Audio`).
let sharedPlayer: AudioPlayer | null = null;

export function getPlayer(): AudioPlayer {
  if (sharedPlayer === null) {
    sharedPlayer = createAudioPlayer(null, { updateInterval: 250 });
  }
  return sharedPlayer;
}

const SKIP_SECONDS = 15;

// Play/pause, a seek bar, and back / forward 15 seconds. No next/previous track.
const lockScreenOptions: AudioLockScreenOptions = {
  showSeekBackward: true,
  showSeekForward: true,
  showNextTrack: false,
  showPreviousTrack: false,
  seekBackwardIntervalSeconds: SKIP_SECONDS,
  seekForwardIntervalSeconds: SKIP_SECONDS,
};

// Android 13+ asks for notification permission on the first play, when the user can see why.
let hasAskedForNotificationPermission = false;

// A resume point waiting for the new lecture to load. Seeking an audio item that hasn't loaded
// yet isn't safe on iOS, so loadCurrent stores the position here, and PlayerStatusBridge calls
// finishPendingResumeIfReady() on each status update until the player reports it's loaded.
type PendingResume = {
  positionSec: number;
  shouldPlay: boolean;
};
let pendingResume: PendingResume | null = null;

export function buildLockScreenMetadata(lecture: Lecture, sourceLabel: string): AudioMetadata {
  return {
    title: lecture.title,
    artist: lecture.author,
    albumTitle: sourceLabel,
    artworkUrl: LOCK_SCREEN_ARTWORK_URL,
  };
}

function askForNotificationPermissionOnce(): void {
  // iOS has no such permission, and the call throws there.
  if (Platform.OS !== 'android') {
    return;
  }
  if (hasAskedForNotificationPermission) {
    return;
  }
  hasAskedForNotificationPermission = true;

  // Denied is fine: playback still works, only the notification controls are missing.
  requestNotificationPermissionsAsync().catch((error: unknown) => {
    console.error('Could not ask for notification permission. The notification controls may be missing.', error);
  });
}

function findLectureIndex(queue: Lecture[], slug: string): number {
  for (let index = 0; index < queue.length; index++) {
    if (queue[index].slug === slug) {
      return index;
    }
  }
  return -1;
}

// Saves where the loaded lecture is, as its resume point. Called at checkpoints only (start,
// pause, seek, track change, every ~10 s, app background, stop), because each save rewrites storage.
export function saveCurrentProgress(): void {
  const player = getPlayer();
  const lecture = selectCurrentLecture(usePlayerStore.getState());
  if (lecture === null) {
    return;
  }
  // The saved position hasn't been restored yet. Saving now would overwrite it with 0.
  if (pendingResume !== null) {
    return;
  }
  useListeningHistoryStore.getState().saveProgress(lecture, player.currentTime);
}

// A finished lecture starts from the beginning next time, not at its last second, and leaves
// Continue listening.
export function saveCurrentLectureAsFinished(): void {
  const lecture = selectCurrentLecture(usePlayerStore.getState());
  if (lecture === null) {
    return;
  }
  useListeningHistoryStore.getState().markFinished(lecture.slug);
}

// Loads the store's current lecture into the player and registers it with the lock screen.
function loadCurrent(shouldPlay: boolean): void {
  const player = getPlayer();
  const state = usePlayerStore.getState();
  const lecture = selectCurrentLecture(state);
  if (lecture === null) {
    return;
  }

  state.setHasQueueEnded(false);
  player.replace({ uri: lecture.url, name: lecture.title });
  // Required, not cosmetic: on Android, without it the OS kills background playback after about
  // 3 minutes. Called again on every track change, so the notification never shows the previous title.
  player.setActiveForLockScreen(true, buildLockScreenMetadata(lecture, selectSourceLabel(state)), lockScreenOptions);

  const savedPositionSec = useListeningHistoryStore.getState().progressById[lecture.slug] ?? 0;
  if (savedPositionSec > 0) {
    pendingResume = { positionSec: savedPositionSec, shouldPlay };
    return;
  }

  pendingResume = null;
  if (shouldPlay) {
    player.play();
  }
}

// Seeks to the stored resume point once the new lecture has loaded, then starts it if asked.
// Called by PlayerStatusBridge on every status update; does nothing most of the time.
export async function finishPendingResumeIfReady(): Promise<void> {
  const player = getPlayer();
  if (pendingResume === null) {
    return;
  }
  if (!player.isLoaded) {
    return;
  }

  const resume = pendingResume;
  pendingResume = null;
  await player.seekTo(resume.positionSec);
  if (resume.shouldPlay) {
    player.play();
  }
}

type PlayLectureOptions = {
  // false loads the lecture paused. A deep link to /player uses it, so a link never starts
  // sound by surprise.
  autoplay: boolean;
};

// Plays `lecture`, with `queue` as what comes after it (auto-advance).
export function playLecture(
  lecture: Lecture,
  queue: Lecture[],
  source: QueueSource,
  options: PlayLectureOptions = { autoplay: true },
): void {
  askForNotificationPermissionOnce();

  // Already loaded (perhaps from another list): never reload it, and keep its queue.
  const currentLecture = selectCurrentLecture(usePlayerStore.getState());
  const isAlreadyLoaded = currentLecture !== null && currentLecture.slug === lecture.slug;
  if (isAlreadyLoaded) {
    if (options.autoplay) {
      resume();
    }
    return;
  }

  // Track change checkpoint: remember where the outgoing lecture was.
  saveCurrentProgress();

  let queueToPlay = queue;
  let startIndex = findLectureIndex(queue, lecture.slug);
  if (startIndex === -1) {
    queueToPlay = [lecture];
    startIndex = 0;
  }

  usePlayerStore.getState().startQueue(queueToPlay, startIndex, source);
  loadCurrent(options.autoplay);
}

export function pause(): void {
  const player = getPlayer();
  // Still loading: just don't start once it's ready.
  if (pendingResume !== null) {
    pendingResume = { ...pendingResume, shouldPlay: false };
  }
  player.pause();
}

export function resume(): void {
  const player = getPlayer();
  // Still loading: start once it's ready.
  if (pendingResume !== null) {
    pendingResume = { ...pendingResume, shouldPlay: true };
    return;
  }
  if (!player.playing) {
    player.play();
  }
}

// The play/pause buttons. The bridge saves the checkpoint when playback turns to paused.
export function toggle(): void {
  const player = getPlayer();
  if (player.playing) {
    pause();
    return;
  }
  resume();
}

// Moves to `positionSec`, kept between 0 and the lecture's length.
export async function seek(positionSec: number): Promise<void> {
  const player = getPlayer();
  if (!player.isLoaded) {
    return;
  }

  let targetSec = positionSec;
  if (targetSec < 0) {
    targetSec = 0;
  }
  if (targetSec > player.duration) {
    targetSec = player.duration;
  }

  await player.seekTo(targetSec);
  saveCurrentProgress();
}

// Back or forward by `deltaSec` (−15 / +15). Works while playing or paused.
export async function skip(deltaSec: number): Promise<void> {
  const player = getPlayer();
  await seek(player.currentTime + deltaSec);
}

export async function skipForward15(): Promise<void> {
  await skip(SKIP_SECONDS);
}

export async function skipBack15(): Promise<void> {
  await skip(-SKIP_SECONDS);
}

// Called by PlayerStatusBridge when a lecture ends. Plays the next one in the queue. At the end
// of the queue it stops at the start of the last lecture and keeps the lock-screen card, so the
// user can play it again from there.
export function playNext(): void {
  const player = getPlayer();
  const state = usePlayerStore.getState();
  if (state.currentIndex === null) {
    return;
  }

  const nextIndex = state.currentIndex + 1;
  const isEndOfQueue = nextIndex >= state.queue.length;
  if (isEndOfQueue) {
    player.pause();
    player.seekTo(0).catch((error: unknown) => {
      console.error('Could not rewind the last lecture after the queue ended.', error);
    });
    state.setHasQueueEnded(true);
    return;
  }

  state.setCurrentIndex(nextIndex);
  loadCurrent(true);
}

// Ends the session: the mini player's dismiss. Saves where the lecture was, stops the audio and
// removes the lock-screen card. Clearing the current lecture hides the mini player in the same
// update, so its fade-out still shows the old lecture.
export function stopAndClear(): void {
  const player = getPlayer();
  saveCurrentProgress();
  pendingResume = null;
  player.pause();
  player.clearLockScreenControls();
  usePlayerStore.getState().setCurrentIndex(null);
}
