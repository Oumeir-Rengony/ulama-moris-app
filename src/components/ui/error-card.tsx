import CloudAlert from 'lucide-react-native/icons/cloud-alert';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Text } from '@/components/ui/text';
import { TryAgainButton } from '@/components/ui/try-again-button';

type ErrorCardProps = {
  // "Lectures didn’t load", "Events didn’t load", "Results didn’t load".
  title: string;
  // "Check your internet connection, then try again."
  message: string;
  isRetrying: boolean;
  onRetryPress?: () => void;
};

// A list's first page (or the search results) didn't load: shown where the rows would be.
// Centred, on surface-1, radius 22, padding 28/24.
export function ErrorCard({ title, message, isRetrying, onRetryPress }: ErrorCardProps) {
  return (
    <SurfaceCard padding="roomy">
      {/* Android reads a changed message aloud. iOS is told by the screen (useAnnouncement). */}
      <View className="items-center" accessibilityLiveRegion="polite">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-danger-subtle">
          <Icon icon={CloudAlert} size={26} color="dangerSubtleFg" />
        </View>
        {/* 17 in the design; headingSm (16) is the nearest text variant. */}
        <Text variant="headingSm" accessibilityRole="header" className="mt-4 text-center font-manrope-extrabold">
          {title}
        </Text>
        <Text variant="bodySm" className="mt-2 text-center text-fg-muted">
          {message}
        </Text>
        <View className="mt-5">
          <TryAgainButton variant="primary" isRetrying={isRetrying} onPress={onRetryPress} />
        </View>
      </View>
    </SurfaceCard>
  );
}
