import AudioLines from 'lucide-react-native/icons/audio-lines';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, View } from 'react-native';

import { DateTile } from '@/components/DateTile';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { catClasses, catFgColorKey, type Category } from '@/theme/tokens';

import { HighlightedText, type TextPart } from './highlighted-text';

type SharedResultProps = {
  titleParts: TextPart[];
  // Display-ready: "31 Oct · Masjid Muswalla, Highlands".
  metaLabel: string;
  // Lectures: by topic (catForTopic). Events: by position (catAt).
  category: Category;
  accessibilityLabel: string;
  onPress?: () => void;
};

type LectureResultProps = SharedResultProps & {
  kind: 'lecture';
  author: string;
};

type EventResultProps = SharedResultProps & {
  kind: 'event';
  day: string;
  month: string;
};

type SearchResultRowProps = LectureResultProps | EventResultProps;

function LectureTile({ category }: { category: Category }) {
  return (
    <View className={`h-12 w-12 items-center justify-center rounded-tile ${catClasses[category].bg}`}>
      <Icon icon={AudioLines} size={22} color={catFgColorKey[category]} strokeWidth={2.2} />
    </View>
  );
}

export function SearchResultRow(props: SearchResultRowProps) {
  let tile = <LectureTile category={props.category} />;
  let authorLine = null;
  if (props.kind === 'lecture') {
    authorLine = (
      <Text variant="meta" numberOfLines={1} className="text-primary">
        {props.author}
      </Text>
    );
  } else {
    tile = <DateTile day={props.day} month={props.month} category={props.category} size="result" />;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel}
      onPress={props.onPress}
      className="flex-row items-center gap-3.5 rounded-row bg-surface-1 py-2.5 pl-2.5 pr-3 active:opacity-80"
    >
      {tile}
      <View className="flex-1 gap-[3px]">
        <HighlightedText parts={props.titleParts} />
        {authorLine}
        <Text variant="caption" numberOfLines={1} className="text-fg-muted">
          {props.metaLabel}
        </Text>
      </View>
      <Icon icon={ChevronRight} size={18} color="fgMuted" />
    </Pressable>
  );
}
