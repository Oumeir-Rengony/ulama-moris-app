import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SearchScope } from '@/features/search/scope';

// The searches the user actually used, per scope, newest first. Persisted, so they survive a
// restart and still show offline. Search runs while the user types, so a query is only saved
// when the user commits to it (the keyboard's Search key, or a tap on a result). Saving every
// debounced query would fill the list with half-typed words.

export const maxRecentSearches = 5;

type RecentSearchesData = {
  queriesByScope: Record<SearchScope, string[]>;
};

type RecentSearchesSetters = {
  addRecentSearch: (scope: SearchScope, query: string) => void;
  removeRecentSearch: (scope: SearchScope, query: string) => void;
  clearRecentSearches: (scope: SearchScope) => void;
};

export type RecentSearchesState = RecentSearchesData & RecentSearchesSetters;

// Exported so tests can reset the store to exactly this.
export const initialRecentSearchesState: RecentSearchesData = {
  queriesByScope: {
    lectures: [],
    events: [],
  },
};

// "Fire" and "fire" are the same search: only the newest spelling is kept.
function isSameQuery(first: string, second: string): boolean {
  return first.toLocaleLowerCase() === second.toLocaleLowerCase();
}

// The query goes first, any older copy of it is dropped, and the list stops at the maximum.
function putQueryFirst(queries: string[], query: string): string[] {
  const updatedQueries = [query];

  for (const existingQuery of queries) {
    if (updatedQueries.length === maxRecentSearches) {
      break;
    }
    if (isSameQuery(existingQuery, query)) {
      continue;
    }
    updatedQueries.push(existingQuery);
  }

  return updatedQueries;
}

function withoutQuery(queries: string[], query: string): string[] {
  const remainingQueries: string[] = [];

  for (const existingQuery of queries) {
    if (existingQuery !== query) {
      remainingQueries.push(existingQuery);
    }
  }

  return remainingQueries;
}

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      ...initialRecentSearchesState,

      addRecentSearch: (scope, query) => {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length === 0) {
          return;
        }

        set((state) => {
          const updatedQueries = putQueryFirst(state.queriesByScope[scope], trimmedQuery);
          return { queriesByScope: { ...state.queriesByScope, [scope]: updatedQueries } };
        });
      },

      removeRecentSearch: (scope, query) => {
        set((state) => {
          const remainingQueries = withoutQuery(state.queriesByScope[scope], query);
          return { queriesByScope: { ...state.queriesByScope, [scope]: remainingQueries } };
        });
      },

      clearRecentSearches: (scope) => {
        set((state) => {
          return { queriesByScope: { ...state.queriesByScope, [scope]: [] } };
        });
      },
    }),
    {
      name: 'recent-searches',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
