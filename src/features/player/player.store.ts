import { create } from 'zustand';

import type { LectureSummary } from '@/data/sample';

// The live playback session: what's loaded and what the audio is doing right now.
// Not persisted, so every launch starts with nothing loaded (and no mini player).
// Resume points that must survive a restart live in listening-history.store.ts instead.
//
// This store holds data and plain setters only. It never imports expo-audio: the engine
// (audio-engine.ts) controls the player, and PlayerStatusBridge copies the player's status in.

// Where the queue came from. Shown as "Playing from …" and on the lock screen.
export type QueueSource =
  | { kind: 'latest' }
  | { kind: 'event'; eventSlug: string; eventTitle: string }
  | { kind: 'search'; query: string };

// The part of expo-audio's status the UI needs. Written by PlayerStatusBridge only.
export type MirroredStatus = {
  isPlaying: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  positionSec: number;
  durationSec: number;
};

type PlayerData = MirroredStatus & {
  // The lectures the user chose to play, in data order. The one place where query data is
  // copied (AGENTS.md): it's a snapshot the user picked, not a cache.
  queue: LectureSummary[];
  // null when nothing is loaded.
  currentIndex: number | null;
  source: QueueSource | null;
  // True once the last lecture of the queue has finished. The mini player leaves, but Now
  // Playing keeps showing the lecture.
  hasQueueEnded: boolean;
  // True from the moment Now Playing is asked to open until its closing animation has ended.
  // While it's true the mini player is hidden and new open requests are ignored.
  isNowPlayingOnScreen: boolean;
};

type PlayerSetters = {
  startQueue: (queue: LectureSummary[], startIndex: number, source: QueueSource) => void;
  setCurrentIndex: (index: number | null) => void;
  applyStatus: (status: MirroredStatus) => void;
  setHasQueueEnded: (hasQueueEnded: boolean) => void;
  setIsNowPlayingOnScreen: (isOnScreen: boolean) => void;
};

export type PlayerState = PlayerData & PlayerSetters;

// Exported so tests can reset the store to exactly this.
export const initialPlayerState: PlayerData = {
  queue: [],
  currentIndex: null,
  source: null,
  isPlaying: false,
  isBuffering: false,
  isLoaded: false,
  positionSec: 0,
  durationSec: 0,
  hasQueueEnded: false,
  isNowPlayingOnScreen: false,
};

export const usePlayerStore = create<PlayerState>()((set) => ({
  ...initialPlayerState,

  startQueue: (queue, startIndex, source) => {
    set({ queue, currentIndex: startIndex, source });
  },

  setCurrentIndex: (index) => {
    set({ currentIndex: index });
  },

  applyStatus: (status) => {
    set({
      isPlaying: status.isPlaying,
      isBuffering: status.isBuffering,
      isLoaded: status.isLoaded,
      positionSec: status.positionSec,
      durationSec: status.durationSec,
    });
  },

  setHasQueueEnded: (hasQueueEnded) => {
    set({ hasQueueEnded });
  },

  setIsNowPlayingOnScreen: (isOnScreen) => {
    set({ isNowPlayingOnScreen: isOnScreen });
  },
}));

// ---------- Selectors: values calculated from the state, never stored ----------

// The loaded lecture, or null when nothing is loaded.
export function selectCurrentLecture(state: PlayerState): LectureSummary | null {
  if (state.currentIndex === null) {
    return null;
  }
  const lecture = state.queue[state.currentIndex];
  if (lecture === undefined) {
    return null;
  }
  return lecture;
}

// "Latest lectures", the event title, or the search query in curly quotes.
export function selectSourceLabel(state: PlayerState): string {
  const source = state.source;
  if (source === null || source.kind === 'latest') {
    return 'Latest lectures';
  }
  if (source.kind === 'event') {
    return source.eventTitle;
  }
  return `“${source.query}”`;
}

// The loaded lecture's slug while the session is still going (playing, paused, loading,
// buffering or failed). Null when nothing is loaded or the queue has ended.
// List rows and Continue listening use it to show the active look.
export function selectActiveLectureSlug(state: PlayerState): string | null {
  const lecture = selectCurrentLecture(state);
  if (lecture === null) {
    return null;
  }
  if (state.hasQueueEnded) {
    return null;
  }
  return lecture.slug;
}

// The mini player shows the active lecture, but never while Now Playing is opening, open or
// closing. Visibility follows "a lecture is active", not "audio is playing", so the bar doesn't
// flicker on pause, buffering or between two lectures of a queue.
export function selectIsMiniPlayerVisible(state: PlayerState): boolean {
  const hasActiveLecture = selectActiveLectureSlug(state) !== null;
  return hasActiveLecture && !state.isNowPlayingOnScreen;
}
