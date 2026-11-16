import Clock from 'lucide-react-native/icons/clock';
import Layers from 'lucide-react-native/icons/layers';
import MapPin from 'lucide-react-native/icons/map-pin';
import { View } from 'react-native';

import { HeroCard } from '@/components/HeroCard';
import { Pill } from '@/components/ui/pill';

type EventHeroCardProps = {
  title: string;
  // Display-ready, with the full month name: "24 – 31 October 2026".
  // Hidden when the event has no dated lecture.
  dateLabel?: string;
  // "4 recorded lectures", "2h 34m".
  lectureCountLabel: string;
  // Hidden when the event has no total duration.
  durationLabel?: string;
  // Display-ready venue. Leave out when the event has none; its chip is then hidden.
  venue?: string;
};

export function EventHeroCard({ title, dateLabel, lectureCountLabel, durationLabel, venue }: EventHeroCardProps) {
  return (
    <HeroCard preset="eventHero" overline="Event" title={title} subtitle={dateLabel}>
      <View className="flex-row flex-wrap gap-2">
        <Pill label={lectureCountLabel} variant="onEmphasis" icon={Layers} />
        {durationLabel ? <Pill label={durationLabel} variant="onEmphasis" icon={Clock} /> : null}
        {venue ? <Pill label={venue} variant="onEmphasis" icon={MapPin} /> : null}
      </View>
    </HeroCard>
  );
}
