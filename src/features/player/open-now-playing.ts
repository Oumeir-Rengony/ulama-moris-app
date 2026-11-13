import { router } from 'expo-router';

import type { LectureSummary } from '@/data/sample';

import { pause, playLecture, resume } from './audio-engine';
import { MINI_PLAYER_EXIT_MS } from './mini-player-motion';
import {
  selectCurrentLecture,
  selectIsMiniPlayerVisible,
  usePlayerStore,
  type QueueSource,
} from './player.store';

// Every way into Now Playing goes through this file: Home rows, Continue listening, Event detail
// rows, Search results and the mini player. One place decides the order of the steps, because
// the bugs come from callers each mixing "load" and "navigate" their own way (MINI-PLAYER.md).
//
// The order: record the intent (hides the mini player at once) → stop the old lecture and let
// the bar finish leaving → navigate → load the new lecture. The mini player never shows a
// lecture the user hasn't seen open in Now Playing.

export type OpenNowPlayingRequest = {
  lecture: LectureSummary;
  // What plays after it, in data order.
  queue: LectureSummary[];
  source: QueueSource;
  // Play buttons resume the lecture if it's the loaded one and paused. Row bodies only show it.
  resumeIfPaused: boolean;
  // Search replaces itself, so minimising Now Playing returns to the tab Search was opened from.
  replaceCurrentScreen?: boolean;
};

function navigateToNowPlaying(replaceCurrentScreen: boolean): void {
  // Search and Now Playing are both root-stack screens, so a replace swaps one for the other.
  if (replaceCurrentScreen) {
    router.replace('/player');
    return;
  }
  // navigate, not push: a second request can never stack a second Now Playing.
  router.navigate('/player');
}

function waitForMiniPlayerExit(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MINI_PLAYER_EXIT_MS);
  });
}

export async function openNowPlaying(request: OpenNowPlayingRequest): Promise<void> {
  const stateAtTap = usePlayerStore.getState();

  // One action at a time. Every open sets the flag first, so this also ignores double taps and
  // taps while Now Playing is still closing.
  if (stateAtTap.isNowPlayingOnScreen) {
    return;
  }

  const currentLecture = selectCurrentLecture(stateAtTap);
  const isAlreadyLoaded = currentLecture !== null && currentLecture.slug === request.lecture.slug;
  const wasMiniPlayerVisible = selectIsMiniPlayerVisible(stateAtTap);

  // Intent first. This hides the mini player in this same update, before any audio event.
  stateAtTap.setIsNowPlayingOnScreen(true);

  try {
    // The loaded lecture: show it, never reload it.
    if (isAlreadyLoaded) {
      navigateToNowPlaying(request.replaceCurrentScreen === true);
      if (request.resumeIfPaused) {
        resume();
      }
      return;
    }

    // A different lecture while the bar shows: the old lecture stops, and the bar finishes
    // leaving, before Now Playing introduces the new one. (From Search the bar is under the
    // Search screen, so this waits for an exit nobody sees. Harmless, and the rule stays simple.)
    if (wasMiniPlayerVisible) {
      pause();
      await waitForMiniPlayerExit();
    }

    navigateToNowPlaying(request.replaceCurrentScreen === true);
    playLecture(request.lecture, request.queue, request.source);
  } catch (error) {
    // Don't leave the app unable to open anything. Let the error surface.
    usePlayerStore.getState().setIsNowPlayingOnScreen(false);
    throw error;
  }
}

// The mini player's text area: opens Now Playing for the loaded lecture, same position, no reload.
export function openNowPlayingForLoadedLecture(): void {
  const state = usePlayerStore.getState();
  if (state.isNowPlayingOnScreen) {
    return;
  }
  if (selectCurrentLecture(state) === null) {
    return;
  }

  state.setIsNowPlayingOnScreen(true);
  try {
    navigateToNowPlaying(false);
  } catch (error) {
    usePlayerStore.getState().setIsNowPlayingOnScreen(false);
    throw error;
  }
}
