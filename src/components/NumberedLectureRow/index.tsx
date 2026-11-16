import { Pressable, View } from 'react-native';

import type { LectureRowState } from '@/components/LectureRow';
import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { Text } from '@/components/ui/text';

type NumberedLectureRowProps = {
  // "01", "02" …
  number: string;
  title: string;
  // Hidden when the lecture has no author.
  author?: string;
  // Display-ready. Idle: "31 Oct · 35:48". Paused: "Paused · 16:05 / 46:21".
  // Playing: "Now playing · 16:05 / 46:21".
  metaLabel: string;
  state: LectureRowState;
  // A tap anywhere on the row. Usually the same action as the play button.
  onPress?: () => void;
  onPlayPress?: () => void;
};

// Event detail row. The number tile is always cat-1, except on the active row.
// Like LectureRow, the whole row is a touch target hidden from screen readers (accessible={false}),
// so VoiceOver finds the labelled play button instead of a button nested in a button.
export function NumberedLectureRow({
  number,
  title,
  author,
  metaLabel,
  state,
  onPress,
  onPlayPress,
}: NumberedLectureRowProps) {
  const isActive = state !== 'idle';
  const isPlaying = state === 'active-playing';

  let rowClass = 'bg-surface-1';
  let tileClass = 'bg-cat-1-bg';
  let numberClass = 'font-manrope-extrabold text-cat-1-fg';
  let metaClass = 'text-fg-muted';
  let buttonVariant: 'row' | 'rowActive' = 'row';
  if (isActive) {
    rowClass = 'bg-surface-2';
    tileClass = 'bg-primary';
    numberClass = 'font-manrope-extrabold text-primary-fg';
    metaClass = 'text-primary';
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
      className={`flex-row items-center gap-3.5 rounded-row p-3 active:opacity-80 ${rowClass}`}
    >
      <View className={`h-touch w-touch items-center justify-center rounded-tile ${tileClass}`}>
        <Text variant="title" tabular maxFontSizeMultiplier={1.3} className={numberClass}>
          {number}
        </Text>
      </View>
      <View className="flex-1 gap-1">
        <Text variant="title" numberOfLines={3}>
          {title}
        </Text>
        {author ? (
          <Text variant="meta" numberOfLines={1} className="text-primary">
            {author}
          </Text>
        ) : null}
        <Text variant="caption" tabular numberOfLines={1} className={`font-manrope-semibold ${metaClass}`}>
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
