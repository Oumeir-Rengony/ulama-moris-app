import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

type ScreenTitleProps = {
  title: string;
  subtitle?: string;
  // e.g. the 44px search IconButton on Events.
  trailing?: ReactNode;
};

// Large screen title (Events). 24 left so the text lines up with content; 12 right so a 44px
// button lines up optically.
export function ScreenTitle({ title, subtitle, trailing }: ScreenTitleProps) {
  return (
    <View className="flex-row items-start justify-between gap-3 pl-gutter pr-bar pt-2">
      <View className="flex-1 gap-1.5">
        <Text variant="display" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" className="text-fg-muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
