import { router } from 'expo-router';

import type { Lecture } from '@/features/lectures/lecture.types';

import { playLecture, reloadFailedLecture, resume, stopAndClear } from './audio-engine';
import {
  selectCurrentLecture,
  selectHasAudioFailed,
  selectIsMiniPlayerVisible,
  usePlayerStore,
  type QueueSource,
} from './player.store';

// Every way into and out of Now Playing goes through this file: Home rows, Continue listening,
// Event detail rows, Search results, the mini player's tap, the chevron, Android back, the event
// pill, the /player deep link, and the player sheet reporting where a drag left it. One place
// decides the order of the steps, because the bugs come from callers each mixing "load" and
// "show" their own way.
//
// The order is store → engine. The intent is recorded first, then the audio is asked to change.
// Nothing here moves anything: the player sheet (NowPlayingPanel) animates to whatever the store
// says. Its spring can be grabbed or turned around at any time, so there are no in-between
// presentations: the store holds where the player is heading, `open` or `closed`.
//
// Now Playing is a panel in PlayerShell (around every screen), not a screen, so nothing here navigates to /player.
// That route is only for deep links and reminder taps.
//
// This is the only file that calls setNowPlayingPresentation.

export type OpenNowPlayingRequest = {
  lecture: Lecture;
  // What plays after it, in data order.
  queue: Lecture[];
  source: QueueSource;
  // Play buttons resume the lecture if it's the loaded one and paused. Row bodies only show it.
  resumeIfPaused: boolean;
  // From Search: Search closes first, so Now Playing rises over the tab Search was opened from,
  // and minimising it returns there. (The panel is drawn over Search too, so this is a choice.)
  leaveSearchFirst?: boolean;
};

// The loaded lecture is opened again. If its audio didn't load, that is the way to load it
// again (the players have no "Try again"). Otherwise resume it when asked.
function resumeOrReloadLoadedLecture(resumeIfPaused: boolean): void {
  if (selectHasAudioFailed(usePlayerStore.getState())) {
    reloadFailedLecture();
    return;
  }
  if (resumeIfPaused) {
    resume();
  }
}

// A row, a search result or Continue listening. The bar grows into Now Playing; with nothing
// loaded, Now Playing grows out of the bar's place. Switching to another lecture loads it and
// opens straight away.
export function openNowPlaying(request: OpenNowPlayingRequest): void {
  const stateAtTap = usePlayerStore.getState();

  // Already open: a double tap opens one Now Playing.
  if (stateAtTap.nowPlayingPresentation !== 'closed') {
    return;
  }

  const currentLecture = selectCurrentLecture(stateAtTap);
  const isAlreadyLoaded = currentLecture !== null && currentLecture.slug === request.lecture.slug;

  if (request.leaveSearchFirst) {
    router.back();
  }

  try {
    stateAtTap.setNowPlayingPresentation('open');
    if (isAlreadyLoaded) {
      // The loaded lecture: never reloads, unless its audio didn't load.
      resumeOrReloadLoadedLecture(request.resumeIfPaused);
    } else {
      // Another lecture (or nothing loaded): playLecture saves the outgoing one's position and
      // switches.
      playLecture(request.lecture, request.queue, request.source);
    }
  } catch (error) {
    // Don't leave the app unable to open anything. Let the error surface.
    usePlayerStore.getState().setNowPlayingPresentation('closed');
    throw error;
  }
}

// The bar's tap: Now Playing for the loaded lecture, same position, no reload, unless its audio
// didn't load: then this is the way to load it again. (A drag up reaches the store through
// handleSheetSettled instead.)
export function openNowPlayingForLoadedLecture(): void {
  const state = usePlayerStore.getState();
  if (selectCurrentLecture(state) === null) {
    return;
  }
  if (state.nowPlayingPresentation !== 'closed') {
    return;
  }

  state.setNowPlayingPresentation('open');
  if (selectHasAudioFailed(state)) {
    reloadFailedLecture();
  }
}

// The chevron, Android back and the event pill. Now Playing shrinks back into the bar.
// Minimising never stops playback. If the queue has ended there is no bar: the sheet slides away.
export function closeNowPlaying(): void {
  const state = usePlayerStore.getState();
  if (state.nowPlayingPresentation !== 'open') {
    return;
  }
  state.setNowPlayingPresentation('closed');
}

// Where the player sheet can come to rest: below the screen (gone), the bar, or the full player.
export type SheetRestingSize = 'gone' | 'bar' | 'full';

// The player sheet came to rest at one of its sizes. After a tap, a row, the chevron or Android
// back, the store already says so (they wrote it first) and nothing changes. After the user's own
// drag, this is how the store hears where the sheet ended up.
export function handleSheetSettled(restingSize: SheetRestingSize): void {
  if (restingSize === 'gone') {
    handleSheetDraggedAway();
    return;
  }

  const state = usePlayerStore.getState();
  if (restingSize === 'bar') {
    if (state.nowPlayingPresentation === 'closed') {
      return;
    }
    state.setNowPlayingPresentation('closed');
    return;
  }
  if (state.nowPlayingPresentation === 'open') {
    return;
  }
  if (selectCurrentLecture(state) === null) {
    return;
  }
  state.setNowPlayingPresentation('open');
}

// The bar was swiped down below the screen: stop and close, like the screen-reader action.
// A hard flick down on Now Playing can carry the sheet past the bar too, but nothing on Now
// Playing stops playback, so that only closes Now Playing (the sheet comes back to the bar).
function handleSheetDraggedAway(): void {
  const state = usePlayerStore.getState();
  if (state.nowPlayingPresentation === 'open') {
    closeNowPlaying();
    return;
  }
  dismissMiniPlayer();
}

// The bar's swipe down and its screen-reader action "Stop and close player". Stops and clears the
// session; the bar goes with it. Only while Now Playing is closed and the bar is showing, so
// nothing on Now Playing can ever reach this.
export function dismissMiniPlayer(): void {
  const state = usePlayerStore.getState();
  if (state.nowPlayingPresentation !== 'closed') {
    return;
  }
  if (!selectIsMiniPlayerVisible(state)) {
    return;
  }
  stopAndClear();
}

// Now Playing's event pill: Now Playing shrinks into the bar while the event opens underneath it, in the
// Events tab. navigate, not push, so opening the event that is already showing doesn't stack it
// twice.
export function openEventFromNowPlaying(eventSlug: string): void {
  if (usePlayerStore.getState().nowPlayingPresentation !== 'open') {
    return;
  }
  closeNowPlaying();
  router.navigate({ pathname: '/events/[slug]', params: { slug: eventSlug } });
}

// The /player deep link (and a reminder tap): Now Playing opens, like every other open.
export function showNowPlayingFromDeepLink(): void {
  const state = usePlayerStore.getState();
  if (state.nowPlayingPresentation !== 'closed') {
    return;
  }
  if (selectCurrentLecture(state) === null) {
    return;
  }
  state.setNowPlayingPresentation('open');
}
