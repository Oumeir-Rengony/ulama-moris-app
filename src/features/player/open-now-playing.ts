import { router } from 'expo-router';

import type { Lecture } from '@/features/lectures/lecture.types';

import { pause, playLecture, resume, stopAndClear } from './audio-engine';
import { MINI_EXIT_MS } from './player-motion-config';
import { collapseToMini, dropMini, enterFresh, expandFromMini, showNowPlayingWithoutMotion } from './player-surface-motion';
import {
  selectCurrentLecture,
  selectIsMiniPlayerVisible,
  usePlayerStore,
  type QueueSource,
} from './player.store';

// Every way into and out of Now Playing goes through this file: Home rows, Continue listening,
// Event detail rows, Search results, the mini player, the chevron, Android back and the swipes.
// One place decides the order of the steps, because the bugs come from callers each mixing
// "load" and "show" their own way.
//
// The order is store → engine → motion. The intent is recorded first (it hides the mini player
// in the same update), then the audio is asked to change, then the motion starts. The motion
// reports back through onFinished, which moves the presentation to its resting value.
//
// Now Playing is an overlay in the tabs layout (PlayerSurface), not a route, so nothing here
// navigates to /player.
//
// This is the only file that calls setNowPlayingPresentation.

export type OpenNowPlayingRequest = {
  lecture: Lecture;
  // What plays after it, in data order.
  queue: Lecture[];
  source: QueueSource;
  // Play buttons resume the lecture if it's the loaded one and paused. Row bodies only show it.
  resumeIfPaused: boolean;
  // From Search: Search slides away while the sheet rises behind it, over the tab Search was
  // opened from.
  leaveSearchFirst?: boolean;
};

function waitForMiniExit(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MINI_EXIT_MS);
  });
}

// An animation that was replaced by a newer one (finished false) must not overwrite the newer
// presentation. Checking the presentation as well covers an entrance spring that finishes after
// a collapse has already started.
function markNowPlayingOpen(finished: boolean): void {
  if (!finished) {
    return;
  }
  const state = usePlayerStore.getState();
  if (state.nowPlayingPresentation !== 'opening') {
    return;
  }
  state.setNowPlayingPresentation('open');
}

function markNowPlayingClosed(finished: boolean): void {
  if (!finished) {
    return;
  }
  const state = usePlayerStore.getState();
  if (state.nowPlayingPresentation !== 'closing') {
    return;
  }
  state.setNowPlayingPresentation('closed');
}

export async function openNowPlaying(request: OpenNowPlayingRequest): Promise<void> {
  const stateAtTap = usePlayerStore.getState();

  // One action at a time: this also ignores double taps, and taps while the bar drops or Now
  // Playing opens, is open or closes.
  if (stateAtTap.nowPlayingPresentation !== 'closed') {
    return;
  }

  const currentLecture = selectCurrentLecture(stateAtTap);
  const isAlreadyLoaded = currentLecture !== null && currentLecture.slug === request.lecture.slug;
  const isBarShowing = selectIsMiniPlayerVisible(stateAtTap);

  if (request.leaveSearchFirst) {
    router.back();
  }

  try {
    // The loaded lecture, with the bar showing: the bar grows into Now Playing. Never reloads.
    if (isAlreadyLoaded && isBarShowing) {
      stateAtTap.setNowPlayingPresentation('opening');
      expandFromMini({ onFinished: markNowPlayingOpen });
      if (request.resumeIfPaused) {
        resume();
      }
      return;
    }

    // A different lecture while the bar shows: the old lecture pauses and the bar finishes
    // dropping away before Now Playing introduces the new one. The bar never shows the new one.
    if (isBarShowing) {
      stateAtTap.setNowPlayingPresentation('miniLeaving');
      pause();
      dropMini();
      await waitForMiniExit();
    }

    // Intent before audio, audio before motion. The bar stays hidden: the presentation isn't closed.
    usePlayerStore.getState().setNowPlayingPresentation('opening');
    if (isAlreadyLoaded) {
      // Loaded but the bar wasn't showing (the queue had ended): show it, never reload it.
      if (request.resumeIfPaused) {
        resume();
      }
    } else {
      playLecture(request.lecture, request.queue, request.source);
    }
    enterFresh({ onFinished: markNowPlayingOpen });
  } catch (error) {
    // Don't leave the app unable to open anything. Let the error surface.
    usePlayerStore.getState().setNowPlayingPresentation('closed');
    throw error;
  }
}

// The mini player's text area: the bar grows into Now Playing, same position, no reload.
// Also allowed while Now Playing is still shrinking into the bar: it grows back from where it is.
export function openNowPlayingForLoadedLecture(): void {
  const state = usePlayerStore.getState();
  if (selectCurrentLecture(state) === null) {
    return;
  }

  const presentation = state.nowPlayingPresentation;
  const isBarShowing = presentation === 'closed' && selectIsMiniPlayerVisible(state);
  const isClosing = presentation === 'closing';
  if (!isBarShowing && !isClosing) {
    return;
  }

  state.setNowPlayingPresentation('opening');
  expandFromMini({ onFinished: markNowPlayingOpen });
}

// The chevron and Android back. Also allowed while Now Playing is still opening: it shrinks back
// from where it is. Minimising never stops playback.
export function closeNowPlaying(): void {
  const state = usePlayerStore.getState();
  const presentation = state.nowPlayingPresentation;
  if (presentation !== 'open' && presentation !== 'opening') {
    return;
  }

  state.setNowPlayingPresentation('closing');
  collapseToMini({ onFinished: markNowPlayingClosed });
}

// A swipe down on Now Playing released past the threshold. The gesture has already started the
// collapse spring on the UI thread (with the finger's speed), so this only records the intent.
// finishCloseAfterSwipe is that spring's completion.
export function beginCloseAfterSwipe(): void {
  const state = usePlayerStore.getState();
  const presentation = state.nowPlayingPresentation;
  if (presentation !== 'open' && presentation !== 'opening') {
    return;
  }
  state.setNowPlayingPresentation('closing');
}

export function finishCloseAfterSwipe(finished: boolean): void {
  markNowPlayingClosed(finished);
}

// The bar's swipe down, or the screen-reader "Stop and close player" action. The bar drops
// away first; the lecture is cleared after, so the surface stays mounted while it falls.
export async function dismissMiniPlayer(): Promise<void> {
  const state = usePlayerStore.getState();
  if (state.nowPlayingPresentation !== 'closed') {
    return;
  }
  if (!selectIsMiniPlayerVisible(state)) {
    return;
  }

  state.setNowPlayingPresentation('miniLeaving');
  dropMini();
  await waitForMiniExit();
  stopAndClear();
  usePlayerStore.getState().setNowPlayingPresentation('closed');
}

// Now Playing's event pill: Now Playing collapses into the bar while the event opens underneath
// it, in the Events tab. navigate, not push, so opening the event that is already showing doesn't
// stack it twice.
export function openEventFromNowPlaying(eventSlug: string): void {
  const presentation = usePlayerStore.getState().nowPlayingPresentation;
  if (presentation !== 'open' && presentation !== 'opening') {
    return;
  }
  closeNowPlaying();
  router.navigate({ pathname: '/events/[slug]', params: { slug: eventSlug } });
}

// The /player deep link: Now Playing is shown at once, with no entrance (a cold start).
export function showNowPlayingFromDeepLink(): void {
  const state = usePlayerStore.getState();
  if (state.nowPlayingPresentation !== 'closed') {
    return;
  }
  if (selectCurrentLecture(state) === null) {
    return;
  }
  state.setNowPlayingPresentation('open');
  showNowPlayingWithoutMotion();
}
