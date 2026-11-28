import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Suspense, type ReactNode } from 'react';
import { LogBox } from 'react-native';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { ApiError } from '@/features/api/api-client';

// React Native reports every error a boundary catches to LogBox, which in development covers
// the screen with a "Render Error" for a failed load that the screen already shows as its error
// card. These two are load failures: no connection (fetch's TypeError) and an
// API error status (ApiError's "API <status>:" message). Other errors still show.
LogBox.ignoreLogs([/^Network request failed/, /^API \d+: /]);

type QueryBoundaryProps = {
  // Shown while a suspense query inside hasn't loaded yet (the screen's skeleton).
  loading: ReactNode;
  // Shown when that first load failed. `retry` loads again; `loading` shows meanwhile.
  renderError: (retry: () => void) => ReactNode;
  // A change in any of these clears a shown error and loads again (Home's selected series).
  resetKeys?: unknown[];
  children: ReactNode;
};

// A failed request: the API answered with an error (ApiError), or there was no answer at all
// (fetch throws a TypeError for no connection or a server that's down).
function isLoadError(error: unknown): boolean {
  return error instanceof ApiError || error instanceof TypeError;
}

// Wraps the part of a screen that reads a suspense query (useSuspenseQuery,
// useSuspenseInfiniteQuery). While it loads for the first time, `loading` shows; if that load
// fails, `renderError`. Loading a later page of a list never suspends: the list shows that itself.
export function QueryBoundary({ loading, renderError, resetKeys, children }: QueryBoundaryProps) {
  function renderFallback({ error, resetErrorBoundary }: FallbackProps) {
    // Anything else is a bug, not a lost connection: let it reach the app's own error screen
    // instead of showing "didn't load".
    if (!isLoadError(error)) {
      throw error;
    }
    return renderError(resetErrorBoundary);
  }

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        // `reset` lets the failed query fetch again when the boundary is reset.
        <ErrorBoundary onReset={reset} resetKeys={resetKeys} fallbackRender={renderFallback}>
          <Suspense fallback={loading}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
