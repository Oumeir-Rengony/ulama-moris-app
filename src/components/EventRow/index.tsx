import ChevronRight from 'lucide-react-native/icons/chevron-right';
import MapPin from 'lucide-react-native/icons/map-pin';
import { Pressable, View } from 'react-native';

import { DateTile } from '@/components/DateTile';
import { Icon } from '@/components/ui/icon';
import { IconLabel } from '@/components/ui/icon-label';
import { Text } from '@/components/ui/text';
import type { Category } from '@/theme/tokens';

type EventRowProps = {
  title: string;
  // Display-ready: "4 lectures · 2h 34m · 24 – 31 Oct".
  statsLabel: string;
  // Display-ready venue, shown with a pin. When the event has no venue, the date range
  // ("17 Nov 2023 – 22 Aug 2025") is shown on that line instead, without a pin.
  venue?: string;
  dateRangeLabel?: string;
  day: string;
  month: string;
  category: Category;
  onPress?: () => void;
};

export function EventRow({ title, statsLabel, venue, dateRangeLabel, day, month, category, onPress }: EventRowProps) {
  let lastLine = null;
  if (venue) {
    lastLine = <IconLabel icon={MapPin} label={venue} size="sm" />;
  } else if (dateRangeLabel) {
    lastLine = (
      <Text variant="caption" numberOfLines={1} className="text-fg-muted">
        {dateRangeLabel}
      </Text>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open event: ${title}`}
      onPress={onPress}
      className="flex-row items-center gap-3.5 rounded-row bg-surface-1 py-3 pl-3 pr-2 active:opacity-80"
    >
      <DateTile day={day} month={month} category={category} size="row" />
      <View className="flex-1 gap-[5px]">
        <Text variant="title">{title}</Text>
        {/* Two lines: the data's date range ("24 Oct – 31 Oct 2026") is longer than the design's
            "24 – 31 Oct", and one line would cut off the year. */}
        <Text variant="caption" numberOfLines={2} className="font-manrope-semibold text-primary">
          {statsLabel}
        </Text>
        {lastLine}
      </View>
      <Icon icon={ChevronRight} size={20} color="fgMuted" />
    </Pressable>
  );
}
