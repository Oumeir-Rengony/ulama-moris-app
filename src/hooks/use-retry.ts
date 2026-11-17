import { useState } from 'react';

// The parts of a TanStack Query result this hook reads.
type QueryProgress = {
  isFetching: boolean;
  // How many times the query has failed so far, and when data last arrived (ms, 0 for never).
  errorUpdateCount: number;
  dataUpdatedAt: number;
};

type ProgressAtRetry = {
  errorUpdateCount: number;
  dataUpdatedAt: number;
};

export type RetryState = {
  // "Try again" was pressed and that attempt is still loading: show the spinner.
  isRetrying: boolean;
  // Call from the "Try again" button.
  retry: () => void;
};

// Tracks one "Try again" button for a query. TanStack Query can't say on its own whether a load
// is that retry: when a query with no data fetches again, it goes back to "pending" and forgets
// the error, which would swap the error card for the skeleton. So the error count and the data
// time are noted when the button is pressed: until either changes, the retry is still loading.
export function useRetry(query: QueryProgress, startRetry: () => void): RetryState {
  const [progressAtRetry, setProgressAtRetry] = useState<ProgressAtRetry | null>(null);

  let isRetrying = false;
  if (progressAtRetry !== null) {
    const hasFailedSinceRetry = query.errorUpdateCount > progressAtRetry.errorUpdateCount;
    const hasSucceededSinceRetry = query.dataUpdatedAt > progressAtRetry.dataUpdatedAt;
    isRetrying = query.isFetching && !hasFailedSinceRetry && !hasSucceededSinceRetry;
  }

  function retry() {
    setProgressAtRetry({ errorUpdateCount: query.errorUpdateCount, dataUpdatedAt: query.dataUpdatedAt });
    startRetry();
  }

  return { isRetrying, retry };
}
