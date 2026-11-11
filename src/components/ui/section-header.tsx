import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

type SectionHeaderProps = {
  title: string;
  // section = 20 ExtraBold ("Latest lectures"); small = 16 ExtraBold ("Recent searches").
  size?: 'section' | 'small';
  // A <SectionHeaderCount> or <SectionHeaderAction>.
  trailing?: ReactNode;
};

// The space above a header differs per screen (34 on Home and Events, 30 on Event detail),
// so the screen sets it, not this component.
export function SectionHeader({ title, size = 'section', trailing }: SectionHeaderProps) {
  let titleVariant: 'section' | 'headingSm' = 'section';
  if (size === 'small') {
    titleVariant = 'headingSm';
  }

  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <Text variant={titleVariant} accessibilityRole="header" className="shrink">
        {title}
      </Text>
      {trailing}
    </View>
  );
}

// "81 lectures", "4".
export function SectionHeaderCount({ label }: { label: string }) {
  return (
    <Text variant="meta" className="text-fg-muted">
      {label}
    </Text>
  );
}

// "Clear all".
export function SectionHeaderAction({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-touch justify-center px-1 active:opacity-70"
    >
      <Text variant="bodySm" className="font-manrope-bold text-primary">
        {label}
      </Text>
    </Pressable>
  );
}
