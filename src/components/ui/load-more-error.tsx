import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { TryAgainButton } from '@/components/ui/try-again-button';

type LoadMoreErrorProps = {
  // "More lectures didn’t load", "More events didn’t load".
  title: string;
  // "Check your connection."
  message: string;
  isRetrying: boolean;
  onRetryPress?: () => void;
};

// The next page of an infinite list didn't load. Replaces the "Loading more" footer under the
// rows already loaded, which stay. One footer for Home and Events.
export function LoadMoreError({ title, message, isRetrying, onRetryPress }: LoadMoreErrorProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="flex-row items-center gap-3 rounded-row bg-danger-subtle py-3.5 pl-4 pr-3.5"
    >
      <View className="flex-1 gap-0.5">
        <Text variant="bodySm" className="font-manrope-extrabold text-danger-subtle-fg">
          {title}
        </Text>
        <Text variant="meta" className="font-manrope text-danger-subtle-fg">
          {message}
        </Text>
      </View>
      <TryAgainButton variant="onDanger" isRetrying={isRetrying} onPress={onRetryPress} />
    </View>
  );
}
