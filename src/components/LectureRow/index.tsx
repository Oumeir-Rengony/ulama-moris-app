import { Pressable, View } from 'react-native';

import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { Text } from '@/components/ui/text';

export type LectureRowState = 'idle' | 'active-paused' | 'active-playing';

type LectureRowProps = {
  title: string;
  // Hidden when the lecture has no author.
  author?: string;
  // Display-ready: "31 Oct · 36 min · Masjid Muswalla, Highlands".
  metaLabel: string;
  state: LectureRowState;
  // A tap anywhere on the row. Usually the same action as the play button.
  onPress?: () => void;
  onPlayPress?: () => void;
};

// Home list row: text block + play button. The whole row is a touch target, but it is hidden
// from screen readers (accessible={false}), so VoiceOver finds the labelled play button instead
// of a button nested inside another button. The row and the play button do the same thing.
export function LectureRow({ title, author, metaLabel, state, onPress, onPlayPress }: LectureRowProps) {
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
    <Pressable
      accessible={false}
      onPress={onPress}
      className={`flex-row items-center gap-3.5 rounded-row py-3.5 pl-[18px] pr-3 active:opacity-80 ${rowClass}`}
    >
      <View className="flex-1 gap-1">
        <Text variant="title" numberOfLines={2}>
          {title}
        </Text>
        {author ? (
          <Text variant="meta" numberOfLines={1} className="text-primary">
            {author}
          </Text>
        ) : null}
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
    </Pressable>
  );
}
