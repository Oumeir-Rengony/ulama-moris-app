import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// One client for the whole app, created once at module scope.
// No caching while the fetchers read static data:
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

// GestureHandlerRootView: the mini player's swipe-down and the Now Playing seek bar use gestures,
// which need this root once, around the whole app.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </GestureHandlerRootView>
  );
}
