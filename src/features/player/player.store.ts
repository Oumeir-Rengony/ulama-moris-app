import { create } from 'zustand';

import type { Lecture } from '@/features/lectures/lecture.types';

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
  // copied: it's a snapshot the user picked, not a cache.
  queue: Lecture[];
  // null when nothing is loaded.
  currentIndex: number | null;
  source: QueueSource | null;
  // True once the last lecture of the queue has finished. The mini player leaves, but Now
  // Playing keeps showing the lecture.
  hasQueueEnded: boolean;
  // The lecture whose audio didn't load (no connection, a bad file), or null. expo-audio reports
  // a failure in one status update only (the next one says "no error" again), so it's kept here.
  // It names the lecture, not just "failed", so a failure can never show on another lecture:
  // read it through selectHasAudioFailed. Written by PlayerStatusBridge (a failure, a recovery)
  // and cleared by the engine every time it loads a lecture.
  failedLectureSlug: string | null;
};

type PlayerSetters = {
  startQueue: (queue: Lecture[], startIndex: number, source: QueueSource) => void;
  setCurrentIndex: (index: number | null) => void;
  applyStatus: (status: MirroredStatus) => void;
  setHasQueueEnded: (hasQueueEnded: boolean) => void;
  // Marks the loaded lecture as failed.
  reportAudioFailure: () => void;
  clearAudioFailure: () => void;
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
  failedLectureSlug: null,
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

  reportAudioFailure: () => {
    set((state) => {
      const lecture = selectCurrentLecture(state);
      if (lecture === null) {
        return {};
      }
      return { failedLectureSlug: lecture.slug };
    });
  },

  clearAudioFailure: () => {
    set({ failedLectureSlug: null });
  },
}));

// ---------- Selectors: values calculated from the state, never stored ----------

// The loaded lecture, or null when nothing is loaded.
export function selectCurrentLecture(state: PlayerState): Lecture | null {
  if (state.currentIndex === null) {
    return null;
  }
  const lecture = state.queue[state.currentIndex];
  if (lecture === undefined) {
    return null;
  }
  return lecture;
}

// The loaded lecture's audio didn't load. Now Playing and the mini player say so and disable
// their controls; opening the lecture again loads it again.
export function selectHasAudioFailed(state: PlayerState): boolean {
  const lecture = selectCurrentLecture(state);
  if (lecture === null) {
    return false;
  }
  return state.failedLectureSlug === lecture.slug;
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

// The mini player shows while a lecture is active. While Now Playing is open, its screen simply
// covers the bar. Visibility follows "a lecture is active", not "audio is playing", so the bar
// doesn't flicker on pause, buffering or between two lectures of a queue.
export function selectIsMiniPlayerVisible(state: PlayerState): boolean {
  return selectActiveLectureSlug(state) !== null;
}
