import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

// Title-only placeholder so the tabs can be switched. The Events screen stage replaces this file.
export default function EventsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-gutter pt-2">
        <Text variant="display" accessibilityRole="header">
          Events
        </Text>
      </View>
    </View>
  );
}
