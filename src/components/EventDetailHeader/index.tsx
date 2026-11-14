import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Share from 'lucide-react-native/icons/share';
import { View } from 'react-native';

import { EventHeroCard } from '@/components/EventHeroCard';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { SectionHeader, SectionHeaderCount } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';

export type EventHeroContent = {
  title: string;
  // "24 – 31 October 2026"
  dateLabel: string;
  // "4 recorded lectures"
  lectureCountLabel: string;
  durationLabel: string;
  venue?: string;
};

type EventDetailHeaderProps = {
  hero: EventHeroContent;
  // The number of lectures, as a number only: "4".
  lectureCount: string;
  onBackPress?: () => void;
  onSharePress?: () => void;
};

// Everything on Event detail above the numbered rows: the FlatList's ListHeaderComponent.
// Spacing from the design: hero 14 below the top bar, the heading 30 below the hero,
// 12 before the first row.
export function EventDetailHeader({ hero, lectureCount, onBackPress, onSharePress }: EventDetailHeaderProps) {
  return (
    <View className="pb-3">
      <ScreenTopBar
        left={
          <IconButton accessibilityLabel="Back" tone="surface" onPress={onBackPress}>
            <Icon icon={ChevronLeft} size={22} strokeWidth={2.2} />
          </IconButton>
        }
        center={
          <Text variant="title" accessibilityRole="header">
            Event
          </Text>
        }
        right={
          <IconButton accessibilityLabel="Share event" tone="surface" onPress={onSharePress}>
            <Icon icon={Share} size={20} />
          </IconButton>
        }
      />

      <View className="mt-3.5 px-gutter">
        <EventHeroCard
          title={hero.title}
          dateLabel={hero.dateLabel}
          lectureCountLabel={hero.lectureCountLabel}
          durationLabel={hero.durationLabel}
          venue={hero.venue}
        />
      </View>

      <View className="mt-[30px] px-gutter">
        <SectionHeader title="Lectures from this event" trailing={<SectionHeaderCount label={lectureCount} />} />
      </View>
    </View>
  );
}
