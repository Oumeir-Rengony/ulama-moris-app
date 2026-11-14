import type { ReactNode } from 'react';
import { View } from 'react-native';

import { HomeHeader } from '@/components/HomeHeader';
import { SearchFieldButton } from '@/components/Search/search-field-button';
import { Chip } from '@/components/ui/chip';
import { SectionHeader, SectionHeaderCount } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';

type HomeListHeaderProps = {
  // The Continue listening card, with its own top spacing. Left out (or rendering nothing) when
  // there is nothing to continue.
  // TODO(design): no empty state is designed for Continue listening.
  continueListening?: ReactNode;
  // "81 lectures". Left out until the first page has arrived.
  lectureCountLabel?: string;
  seriesLabels: string[];
  selectedSeriesLabel: string;
  onSearchPress?: () => void;
};

// Everything on Home above the lecture rows: the FlatList's ListHeaderComponent.
// Spacing between sections, from the design: 24, 18, 24, 34, 8, then 14 before the rows.
export function HomeListHeader({
  continueListening,
  lectureCountLabel,
  seriesLabels,
  selectedSeriesLabel,
  onSearchPress,
}: HomeListHeaderProps) {
  let countTrailing = null;
  if (lectureCountLabel !== undefined) {
    countTrailing = <SectionHeaderCount label={lectureCountLabel} />;
  }

  return (
    <View className="pb-3.5">
      <HomeHeader />

      <View className="mt-6 gap-1.5 px-gutter">
        <Text variant="bodySm" className="font-manrope-bold text-primary">
          Assalāmu ’alaykum
        </Text>
        <Text variant="h1" accessibilityRole="header">
          Nurture your heart with today’s reminders
        </Text>
      </View>

      <View className="mt-[18px] px-gutter">
        <SearchFieldButton label="Search by topic" onPress={onSearchPress} />
      </View>

      {continueListening}

      <View className="mt-[34px] px-gutter">
        <SectionHeader title="Latest lectures" trailing={countTrailing} />
      </View>

      <View className="mt-2 flex-row flex-wrap gap-2 px-gutter">
        {seriesLabels.map((label) => (
          <Chip key={label} label={label} selected={label === selectedSeriesLabel} />
        ))}
      </View>
    </View>
  );
}
