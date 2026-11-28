import { View } from 'react-native';

import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';

import { skeleton } from './tokens';

type SkeletonRowProps = {
  // lecture: Home row shape (bars + a round play-button placeholder).
  // event: Events row shape (date tile + bars, no right-hand placeholder).
  // numbered: Event detail row shape (number tile + bars + a round play-button placeholder).
  variant: 'lecture' | 'event' | 'numbered';
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

  if (variant === 'numbered') {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={`flex-row items-center gap-3.5 rounded-row p-3 ${skeleton.row}`}
      >
        <View className={`h-touch w-touch rounded-tile ${skeleton.bg}`} />
        <View className="flex-1 gap-2">
          <View className={`h-3 w-[80%] rounded-full ${skeleton.bg}`} />
          <View className={`h-2.5 w-[45%] rounded-full ${skeleton.bg}`} />
          <View className={`h-2.5 w-[60%] rounded-full ${skeleton.bg}`} />
        </View>
        <View className={`h-touch w-touch rounded-full ${skeleton.bg}`} />
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

function NumberedSkeletonRows() {
  return (
    <View className="gap-2.5">
      <SkeletonRow variant="numbered" />
      <SkeletonRow variant="numbered" />
      <SkeletonRow variant="numbered" />
    </View>
  );
}

// Event detail when the hero card is already drawn (from the Events list) and only the lectures
// are loading: three numbered rows under the "Lectures from this event" heading.
export function EventLecturesSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading lectures"
      accessibilityLiveRegion="polite"
      className="px-gutter"
    >
      <NumberedSkeletonRows />
    </View>
  );
}

// Event detail when nothing about the event is known yet (opened from a link): the hero card,
// the "Lectures from this event" heading and three numbered rows, in the same places and spacing
// as the loaded screen (hero 14 below the top bar, heading 30 below the hero, 12 before the
// first row). The screen draws the real top bar above it, so Back works while loading.
export function EventDetailSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading event"
      accessibilityLiveRegion="polite"
      className="mt-3.5 px-gutter"
    >
      <View className={`gap-3.5 rounded-card p-[22px] ${skeleton.emphasisCard}`}>
        <View className={`h-6 w-16 rounded-full ${skeleton.emphasisBar}`} />
        <View className="gap-2.5">
          <View className={`h-6 w-[85%] rounded-full ${skeleton.emphasisBar}`} />
          <View className={`h-6 w-[60%] rounded-full ${skeleton.emphasisBar}`} />
          <View className={`h-3 w-[50%] rounded-full ${skeleton.emphasisBar}`} />
        </View>
        <View className="flex-row gap-2">
          <View className={`h-8 w-28 rounded-full ${skeleton.emphasisBar}`} />
          <View className={`h-8 w-20 rounded-full ${skeleton.emphasisBar}`} />
        </View>
      </View>

      <View className="mb-3 mt-[30px] flex-row items-center justify-between">
        <View className={`h-4 w-[55%] rounded-full ${skeleton.bg}`} />
        <View className={`h-6 w-8 rounded-full ${skeleton.bg}`} />
      </View>

      <NumberedSkeletonRows />
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
