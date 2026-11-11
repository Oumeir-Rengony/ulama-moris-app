import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// One client for the whole app, created once at module scope.
// No caching while the fetchers read static data (AGENTS.md "TanStack Query rules"):
// staleTime 0 and gcTime 0 drop query data as soon as no screen uses it, so every mount reads
// the stub again. Choose real caching settings when the API replaces the stubs.
// TODO(error-states stage): connect onlineManager to NetInfo and focusManager to AppState.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
