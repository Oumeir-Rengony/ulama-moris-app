import { Link, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { Text } from '@/components/ui/text';

const contentSpacing = 24;

// Shown for a URL that matches no route (a mistyped or outdated deep link). It is a root-stack
// screen with no header and no tab bar, so it owns both insets.
export default function NotFoundScreen() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 justify-center gap-4 bg-bg px-gutter"
      style={{ paddingTop: insets.top + contentSpacing, paddingBottom: insets.bottom + contentSpacing }}
    >
      <EmptyState title="Page not found" message={`Nothing is at ${pathname}.`} />
      <Link href="/" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Home"
          className="min-h-touch items-center justify-center rounded-row bg-surface-1 px-[18px] py-3 active:opacity-80"
        >
          <Text variant="title">Go to Home</Text>
        </Pressable>
      </Link>
    </View>
  );
}
