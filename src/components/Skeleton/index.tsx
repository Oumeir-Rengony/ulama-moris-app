import { View } from 'react-native';

import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';

import { skeleton } from './tokens';

type SkeletonRowProps = {
  // lecture: Home row shape (bars + a round play-button placeholder).
  // event: Events row shape (date tile + bars, no right-hand placeholder).
  variant: 'lecture' | 'event';
};

// A placeholder row in the same shape as a real one. Decorative, so screen readers skip it;
// the LoadingFooter announces the loading instead.
export function SkeletonRow({ variant }: SkeletonRowProps) {
  if (variant === 'event') {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={`flex-row items-center gap-3.5 rounded-row p-3 ${skeleton.row}`}
      >
        <View className={`h-16 w-[60px] rounded-thumb ${skeleton.bg}`} />
        <View className="flex-1 gap-2">
          <View className={`h-3 w-[80%] rounded-full ${skeleton.bg}`} />
          <View className={`h-2.5 w-[50%] rounded-full ${skeleton.bg}`} />
          <View className={`h-2.5 w-[65%] rounded-full ${skeleton.bg}`} />
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`flex-row items-center gap-3.5 rounded-row py-3.5 pl-[18px] pr-3 ${skeleton.row}`}
    >
      <View className="flex-1 gap-2">
        <View className={`h-3 w-[85%] rounded-full ${skeleton.bg}`} />
        <View className={`h-2.5 w-[55%] rounded-full ${skeleton.bg}`} />
        <View className={`h-2.5 w-[70%] rounded-full ${skeleton.bg}`} />
      </View>
      <View className={`h-touch w-touch rounded-full ${skeleton.bg}`} />
    </View>
  );
}

// "Loading more lectures" / "Loading more events", under the last skeleton row.
export function LoadingFooter({ label }: { label: string }) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      className="min-h-touch flex-row items-center justify-center gap-2.5"
    >
      <Spinner size={18} />
      <Text variant="meta" className="text-fg-muted">
        {label}
      </Text>
    </View>
  );
}
