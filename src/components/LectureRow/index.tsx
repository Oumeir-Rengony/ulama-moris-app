import { View } from 'react-native';

import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { Text } from '@/components/ui/text';

export type LectureRowState = 'idle' | 'active-paused' | 'active-playing';

type LectureRowProps = {
  title: string;
  author: string;
  // Display-ready: "31 Oct · 36 min · Masjid Muswalla, Highlands".
  metaLabel: string;
  state: LectureRowState;
  onPlayPress?: () => void;
};

// Home list row: text block + play button. The play button is the control; the row itself is
// not pressable, so screen readers don't find a button nested inside another button.
export function LectureRow({ title, author, metaLabel, state, onPlayPress }: LectureRowProps) {
  const isActive = state !== 'idle';
  const isPlaying = state === 'active-playing';

  let rowClass = 'bg-surface-1';
  let buttonVariant: 'row' | 'rowActive' = 'row';
  if (isActive) {
    rowClass = 'bg-surface-2';
    buttonVariant = 'rowActive';
  }

  let buttonState: 'play' | 'pause' = 'play';
  let buttonLabel = `Play ${title}`;
  if (isPlaying) {
    buttonState = 'pause';
    buttonLabel = `Pause ${title}`;
  }

  return (
    <View className={`flex-row items-center gap-3.5 rounded-row py-3.5 pl-[18px] pr-3 ${rowClass}`}>
      <View className="flex-1 gap-1">
        <Text variant="title" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="meta" numberOfLines={1} className="text-primary">
          {author}
        </Text>
        <Text variant="caption" numberOfLines={1} className="text-fg-muted">
          {metaLabel}
        </Text>
      </View>
      <PlayPauseButton
        state={buttonState}
        variant={buttonVariant}
        accessibilityLabel={buttonLabel}
        onPress={onPlayPress}
      />
    </View>
  );
}
