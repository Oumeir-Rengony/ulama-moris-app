import type { SearchResults } from './search.api';

// What the Search screen's body shows.
export type SearchView =
  | { kind: 'recent' }
  | { kind: 'waiting' }
  // The results didn't load (or are loading again after "Try again").
  | { kind: 'failed' }
  | { kind: 'results'; results: SearchResults }
  | { kind: 'no-results'; query: string };

type PickSearchViewInput = {
  // What is in the input right now.
  query: string;
  // The input text once typing has paused: the query the results belong to.
  debouncedQuery: string;
  // The results for debouncedQuery, or undefined while they haven't arrived.
  results: SearchResults | undefined;
  // The results failed to load, or "Try again" is loading them again.
  hasFailed: boolean;
};

export function pickSearchView({ query, debouncedQuery, results, hasFailed }: PickSearchViewInput): SearchView {
  const inputIsEmpty = query.trim().length === 0;
  if (inputIsEmpty) {
    return { kind: 'recent' };
  }

  // The first letters are typed but the debounce hasn't fired yet: keep the recent searches on
  // screen rather than flashing an empty state.
  const searchHasNotStarted = debouncedQuery.trim().length === 0;
  if (searchHasNotStarted) {
    return { kind: 'recent' };
  }

  if (results === undefined && hasFailed) {
    return { kind: 'failed' };
  }

  // A new query was sent and its results aren't back yet: the screen shows "Searching".
  if (results === undefined) {
    return { kind: 'waiting' };
  }

  if (results.total === 0) {
    return { kind: 'no-results', query: debouncedQuery.trim() };
  }

  return { kind: 'results', results };
}
