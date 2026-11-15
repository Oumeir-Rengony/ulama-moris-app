import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// What must survive a restart: where each unfinished lecture was left, and which lecture was
// played last.
//
// Kept apart from player.store.ts on purpose. Zustand's `persist` writes to storage after
// EVERY `set`; `partialize` only chooses what is written, not when. The player store changes
// four times a second while audio plays, so it must not be persisted. This store changes only
// at checkpoints (start, pause, seek, track change, every ~10 s, app background, stop, finish).

type ListeningHistoryData = {
  // Resume point in seconds, by lecture slug. Only unfinished lectures have one. The mock
  // library's generated "--N" slugs count as separate lectures; that's fine for mock data.
  progressById: Record<string, number>;
  // The lecture whose resume point was saved most recently, while it is unfinished. Feeds
  // Continue listening: null hides the card (nothing played yet, or the last one was finished).
  // A plain object can't say which key was written last, so it's stored.
  lastPlayedSlug: string | null;
  // When that lecture's resume point was saved (milliseconds since 1970), so the continue
  // listening reminder can be timed from the last listen. null whenever lastPlayedSlug is null.
  lastPlayedAt: number | null;
};

type ListeningHistorySetters = {
  saveProgress: (slug: string, positionSec: number) => void;
  markFinished: (slug: string) => void;
};

export type ListeningHistoryState = ListeningHistoryData & ListeningHistorySetters;

// Exported so tests can reset the store to exactly this.
export const initialListeningHistoryState: ListeningHistoryData = {
  progressById: {},
  lastPlayedSlug: null,
  lastPlayedAt: null,
};

export const useListeningHistoryStore = create<ListeningHistoryState>()(
  persist(
    (set) => ({
      ...initialListeningHistoryState,

      // The app also saves when it goes to the background, even while paused. Only a position
      // that moved (or another lecture) counts as listening, so leaving the app doesn't move
      // lastPlayedAt.
      saveProgress: (slug, positionSec) => {
        set((state) => {
          const isSameLecture = state.lastPlayedSlug === slug;
          const hasPositionMoved = state.progressById[slug] !== positionSec;

          let lastPlayedAt = state.lastPlayedAt;
          if (!isSameLecture || hasPositionMoved || lastPlayedAt === null) {
            lastPlayedAt = Date.now();
          }

          return {
            progressById: { ...state.progressById, [slug]: positionSec },
            lastPlayedSlug: slug,
            lastPlayedAt,
          };
        });
      },

      // A finished lecture starts from the beginning next time. If it was the last one played,
      // Continue listening hides until another lecture plays.
      markFinished: (slug) => {
        set((state) => {
          const progressById = { ...state.progressById };
          delete progressById[slug];

          let lastPlayedSlug = state.lastPlayedSlug;
          let lastPlayedAt = state.lastPlayedAt;
          if (lastPlayedSlug === slug) {
            lastPlayedSlug = null;
            lastPlayedAt = null;
          }

          return { progressById, lastPlayedSlug, lastPlayedAt };
        });
      },
    }),
    {
      name: 'listening-history',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
