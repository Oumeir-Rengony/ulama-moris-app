import Calendar from 'lucide-react-native/icons/calendar';
import Layers from 'lucide-react-native/icons/layers';
import MapPin from 'lucide-react-native/icons/map-pin';
import { View } from 'react-native';

import { IconLabel } from '@/components/ui/icon-label';
import { Pill } from '@/components/ui/pill';
import { Text } from '@/components/ui/text';
import type { Category } from '@/theme/tokens';

type TrackInfoProps = {
  title: string;
  author: string;
  // Each optional line or pill is left out when its value is missing.
  venue?: string;
  // Display-ready, weekday included: "Saturday, 31 October 2026".
  dateLabel?: string;
  // "Ṣaḥābā r.a" and its colour (catForTopic). Leave out for a lecture without a topic.
  topicLabel?: string;
  topicCategory?: Category;
  eventTitle?: string;
  onEventPress?: () => void;
};

// Now Playing: the lecture information between the artwork and the slider.
export function TrackInfo({
  title,
  author,
  venue,
  dateLabel,
  topicLabel,
  topicCategory = 1,
  eventTitle,
  onEventPress,
}: TrackInfoProps) {
  const hasInfoLines = venue !== undefined || dateLabel !== undefined;
  const hasTags = topicLabel !== undefined || eventTitle !== undefined;

  return (
    <View>
      <Text variant="h2" numberOfLines={2} accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" numberOfLines={1} className="mt-1.5 font-manrope-bold text-primary">
        {author}
      </Text>

      {hasInfoLines ? (
        <View className="mt-3 gap-1.5">
          {venue ? <IconLabel icon={MapPin} label={venue} /> : null}
          {dateLabel ? <IconLabel icon={Calendar} label={dateLabel} /> : null}
        </View>
      ) : null}

      {hasTags ? (
        <View className="mt-3.5 flex-row gap-2">
          {topicLabel ? <Pill label={topicLabel} variant="category" size="lg" category={topicCategory} /> : null}
          {eventTitle ? (
            <Pill
              label={eventTitle}
              variant="outline"
              size="lg"
              icon={Layers}
              accessibilityLabel={`Open event: ${eventTitle}`}
              onPress={onEventPress}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
