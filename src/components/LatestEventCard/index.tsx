import ArrowRight from 'lucide-react-native/icons/arrow-right';
import { Pressable, View } from 'react-native';

import { HeroCard } from '@/components/HeroCard';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';

type LatestEventCardProps = {
  title: string;
  // Display-ready: "24 – 31 Oct 2026 · Masjid Muswalla, Highlands".
  metaLabel: string;
  lectureCountLabel: string;
  durationLabel: string;
  onPress?: () => void;
};

// The whole card is one button that opens the event.
export function LatestEventCard({ title, metaLabel, lectureCountLabel, durationLabel, onPress }: LatestEventCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open event: ${title}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <HeroCard preset="latestEvent" overline="Latest event" title={title} subtitle={metaLabel}>
        <View className="mt-1 flex-row items-center justify-between gap-3">
          <View className="shrink flex-row flex-wrap gap-2">
            <Pill label={lectureCountLabel} variant="onEmphasis" />
            <Pill label={durationLabel} variant="onEmphasis" />
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Icon icon={ArrowRight} size={20} color="secondaryFg" strokeWidth={2.4} />
          </View>
        </View>
      </HeroCard>
    </Pressable>
  );
}
