import { View } from 'react-native';

import { LogoBadge } from '@/components/icons/logo-badge';
import { Text } from '@/components/ui/text';

// Home header: logo badge + app name and tagline. 20 left / 12 right.
export function HomeHeader() {
  return (
    <View className="flex-row items-center gap-2.5 pl-5 pr-bar">
      <LogoBadge size={40} />
      <View className="shrink gap-px">
        <Text variant="headingSm" accessibilityRole="header">
          Ulama Moris
        </Text>
        <Text variant="caption" className="text-fg-muted">
          Islamic Audio Library
        </Text>
      </View>
    </View>
  );
}
