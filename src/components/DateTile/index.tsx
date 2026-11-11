import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { catClasses, type Category } from '@/theme/tokens';

type DateTileProps = {
  day: string;
  month: string;
  // Chosen by whoever renders the tile (by position for events: catAt(index)).
  category: Category;
  // row: 60 × 64, day 22 ExtraBold (Events list). result: 48 square (event search results).
  size: 'row' | 'result';
};

// The tile has a fixed size, so its text is capped at 1.2× to stay inside it at large text sizes.
export function DateTile({ day, month, category, size }: DateTileProps) {
  const classes = catClasses[category];

  // TODO(design): the events-scope search tile isn't drawn. Smaller type than the row tile.
  if (size === 'result') {
    return (
      <View className={`h-12 w-12 items-center justify-center rounded-tile ${classes.bg}`}>
        <Text variant="title" maxFontSizeMultiplier={1.2} className={`font-manrope-extrabold ${classes.fg}`}>
          {day}
        </Text>
        <Text variant="caption" maxFontSizeMultiplier={1.2} className={`font-manrope-bold ${classes.fg}`}>
          {month}
        </Text>
      </View>
    );
  }

  return (
    <View className={`h-16 w-[60px] items-center justify-center rounded-thumb ${classes.bg}`}>
      <Text variant="h2" maxFontSizeMultiplier={1.2} className={classes.fg}>
        {day}
      </Text>
      <Text variant="caption" maxFontSizeMultiplier={1.2} className={`font-manrope-bold ${classes.fg}`}>
        {month}
      </Text>
    </View>
  );
}
