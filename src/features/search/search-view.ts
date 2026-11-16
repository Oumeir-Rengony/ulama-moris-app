import type { SearchResults } from './search.api';

// What the Search screen's body shows.
export type SearchView =
  | { kind: 'recent' }
  | { kind: 'waiting' }
  | { kind: 'results'; results: SearchResults }
  | { kind: 'no-results'; query: string };

type PickSearchViewInput = {
  // What is in the input right now.
  query: string;
  // The input text once typing has paused: the query the results belong to.
  debouncedQuery: string;
  // The results for debouncedQuery, or undefined while they haven't arrived.
  results: SearchResults | undefined;
};

export function pickSearchView({ query, debouncedQuery, results }: PickSearchViewInput): SearchView {
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

  // A new query was sent and its results aren't back yet: the screen shows "Searching".
  if (results === undefined) {
    return { kind: 'waiting' };
  }

  if (results.total === 0) {
    return { kind: 'no-results', query: debouncedQuery.trim() };
  }

  return { kind: 'results', results };
}
