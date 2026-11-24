import { router } from 'expo-router';

import type { Lecture } from '@/features/lectures/lecture.types';

import { playLecture, reloadFailedLecture, resume, stopAndClear } from './audio-engine';
import { selectCurrentLecture, selectHasAudioFailed, usePlayerStore, type QueueSource } from './player.store';

// Every way into and out of Now Playing goes through this file: Home rows, Continue listening,
// Event detail rows, Search results, the mini player, the chevron and the event pill.
// One place decides the order of the steps: the audio first, then the navigation.
//
// Now Playing is the /player screen, so only the navigation stack knows whether it is open.
// Nothing here waits for an animation, and nothing is stored about the screen being open.
// Android back is handled by the stack itself.

export type OpenNowPlayingRequest = {
  lecture: Lecture;
  // What plays after it, in data order.
  queue: Lecture[];
  source: QueueSource;
  // Play buttons resume the lecture if it's the loaded one and paused. Row bodies only show it.
  resumeIfPaused: boolean;
  // From Search: Now Playing takes Search's place, so closing it returns to the tab Search was
  // opened from.
  replacesSearch?: boolean;
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

// The /player screen is a singular route, so pushing it while it is already open doesn't stack a
// second copy. A double tap is harmless.
function showNowPlayingScreen(replacesSearch: boolean): void {
  if (replacesSearch) {
    router.replace('/player');
    return;
  }
  router.push('/player');
}

export function openNowPlaying(request: OpenNowPlayingRequest): void {
  const currentLecture = selectCurrentLecture(usePlayerStore.getState());
  const isAlreadyLoaded = currentLecture !== null && currentLecture.slug === request.lecture.slug;

  // The loaded lecture is never reloaded. Another lecture replaces it: playLecture saves the
  // outgoing lecture's position before loading the new one.
  if (isAlreadyLoaded) {
    resumeOrReloadLoadedLecture(request.resumeIfPaused);
  } else {
    playLecture(request.lecture, request.queue, request.source);
  }

  let replacesSearch = false;
  if (request.replacesSearch === true) {
    replacesSearch = true;
  }
  showNowPlayingScreen(replacesSearch);
}

// The mini player's text area: Now Playing for the loaded lecture, same position, no reload,
// unless the audio didn't load: then this is the way to load it again.
export function openNowPlayingForLoadedLecture(): void {
  const state = usePlayerStore.getState();
  if (selectCurrentLecture(state) === null) {
    return;
  }
  if (selectHasAudioFailed(state)) {
    reloadFailedLecture();
  }
  showNowPlayingScreen(false);
}

// The chevron. Minimising never stops playback. Opened by a deep link on a cold start, there is
// no screen to go back to, so it goes to the tabs.
export function closeNowPlaying(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}

// Now Playing's event pill: Now Playing closes and the event opens in the Events tab. navigate,
// not push, so opening the event that is already showing doesn't stack it twice.
export function openEventFromNowPlaying(eventSlug: string): void {
  closeNowPlaying();
  router.navigate({ pathname: '/events/[slug]', params: { slug: eventSlug } });
}

// The screen-reader "Stop and close player" action on the mini player.
export function dismissMiniPlayer(): void {
  stopAndClear();
}
