import { View } from 'react-native';

import { SurfaceCard } from '@/components/ui/surface-card';
import { Text } from '@/components/ui/text';

type EmptyStateProps = {
  // "No Guest lectures yet", "No results for “fire”". Leave out for a one-line message.
  title?: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  if (title === undefined) {
    return (
      <SurfaceCard padding="compact">
        <Text variant="bodySm" className="text-fg-muted">
          {message}
        </Text>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard padding="roomy">
      <View className="items-center gap-2">
        <Text variant="title" className="text-center">
          {title}
        </Text>
        <Text variant="meta" className="text-center font-manrope text-fg-muted">
          {message}
        </Text>
      </View>
    </SurfaceCard>
  );
}
