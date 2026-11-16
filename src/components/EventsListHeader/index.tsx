import Radio from 'lucide-react-native/icons/radio';
import Search from 'lucide-react-native/icons/search';
import { View } from 'react-native';

import { LatestEventCard } from '@/components/LatestEventCard';
import { ScreenTitle } from '@/components/ScreenTitle';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Pill } from '@/components/ui/pill';
import { SectionHeader } from '@/components/ui/section-header';

export type LatestEventContent = {
  title: string;
  metaLabel: string;
  lectureCountLabel: string;
  durationLabel?: string;
};

type EventsListHeaderProps = {
  // "11 events". Left out until the first page has arrived.
  eventCountLabel?: string;
  // The newest event. Left out until the first page has arrived.
  latestEvent?: LatestEventContent;
  onLatestEventPress?: () => void;
  onSearchPress?: () => void;
};

// Everything on Events above the year sections: the SectionList's ListHeaderComponent.
// Spacing from the design: count chip 14 below the title, card 20, "All events" 34.
export function EventsListHeader({
  eventCountLabel,
  latestEvent,
  onLatestEventPress,
  onSearchPress,
}: EventsListHeaderProps) {
  return (
    <View>
      <ScreenTitle
        title="Events"
        subtitle="Conferences, programmes and gatherings we have recorded."
        trailing={
          <IconButton accessibilityLabel="Search events" tone="surface" onPress={onSearchPress}>
            <Icon icon={Search} size={20} />
          </IconButton>
        }
      />

      {eventCountLabel !== undefined ? (
        <View className="mt-3.5 px-gutter">
          <Pill label={eventCountLabel} variant="category" size="md" category={1} icon={Radio} />
        </View>
      ) : null}

      {latestEvent !== undefined ? (
        <View className="mt-5 px-gutter">
          <LatestEventCard
            title={latestEvent.title}
            metaLabel={latestEvent.metaLabel}
            lectureCountLabel={latestEvent.lectureCountLabel}
            durationLabel={latestEvent.durationLabel}
            onPress={onLatestEventPress}
          />
        </View>
      ) : null}

      <View className="mt-[34px] px-gutter">
        <SectionHeader title="All events" />
      </View>
    </View>
  );
}
