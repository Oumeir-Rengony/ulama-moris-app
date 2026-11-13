// TEST ONLY. Never import this file from app code, so it stays out of the app bundle.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// A new client for every test, so no query data leaks from one test into the next.
// retry: false makes a failing query fail at once instead of retrying three times.
// gcTime: Infinity keeps data in the cache for the whole test, even while nothing reads it.
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

// Renders the UI inside the same providers the app puts around every screen.
export async function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();

  function TestProviders({ children }: { children: ReactNode }) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>{children}</SafeAreaProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    );
  }

  return render(ui, { wrapper: TestProviders });
}
