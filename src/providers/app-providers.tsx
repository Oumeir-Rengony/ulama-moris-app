import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Lectures and events change only when an editor publishes, and the website answers from its own
// cache, so a minute before refetching is fresh enough. Data no screen uses is kept a few
// minutes, so going back to a list (or a chip) shows it at once while it refreshes.
const oneMinute = 60 * 1000;
const fiveMinutes = 5 * oneMinute;

// One client for the whole app, created once at module scope.
// retry: 1 shows a failed load after one more attempt, not three: the screens offer "Try again".
// networkMode 'always': a request made offline fails (and the screen shows its "didn’t load"
// state with "Try again") instead of waiting silently behind a skeleton. The default, 'online',
// pauses it until the connection is back, which looks like loading that never ends.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: oneMinute,
      gcTime: fiveMinutes,
      retry: 1,
      networkMode: 'always',
    },
  },
});

// React Native doesn't tell TanStack Query when the connection comes and goes. With this, a
// query that failed while offline is fetched again once, by itself, when the connection is back
// (refetchOnReconnect). NetInfo reports null while it doesn't know yet; that counts as online.
onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false);
  });
  return unsubscribe;
});

function handleAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}

// Returning to the app counts as focus, so stale lists refetch. The browser already reports
// focus to TanStack Query, so the web build doesn't need this.
if (Platform.OS !== 'web') {
  focusManager.setEventListener(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  });
}

// GestureHandlerRootView: the mini player's swipe-down and the Now Playing seek bar use gestures,
// which need this root once, around the whole app.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </GestureHandlerRootView>
  );
}
