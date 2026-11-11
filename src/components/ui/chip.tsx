import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress?: () => void;
};

// Home series filter chip. 40 high in the design; minHeight so large text can grow it.
export function Chip({ label, selected, onPress }: ChipProps) {
  let chipClass = 'bg-surface-2';
  let labelClass = 'font-manrope-bold text-fg';
  if (selected) {
    chipClass = 'bg-primary';
    labelClass = 'font-manrope-bold text-primary-fg';
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-10 justify-center rounded-full px-4 py-2 active:opacity-80 ${chipClass}`}
    >
      <Text variant="bodySm" numberOfLines={1} className={labelClass}>
        {label}
      </Text>
    </Pressable>
  );
}
