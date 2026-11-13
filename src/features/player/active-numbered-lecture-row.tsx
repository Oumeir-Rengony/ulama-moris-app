import { NumberedLectureRow } from '@/components/NumberedLectureRow';
import type { LectureSummary } from '@/data/sample';
import { pausedLectureMetaLabel, playingLectureMetaLabel } from '@/features/events/event-labels';
import { clockLabel } from '@/utils/format-time';

import { usePlayerStore } from './player.store';

type ActiveNumberedLectureRowProps = {
  // "01", "02" …
  number: string;
  lecture: LectureSummary;
  onPress?: () => void;
  onPlayPress?: () => void;
};

// Whole seconds only, so this row re-renders once a second, not four times.
function selectElapsedWholeSeconds(state: { positionSec: number }): number {
  return Math.floor(state.positionSec);
}

// The Event detail row of the lecture loaded in the player, with its live meta line:
// "Now playing · 16:05 / 46:21" or "Paused · 16:05 / 46:21". The only row in the list that reads
// the position, so the other rows don't re-render with it.
export function ActiveNumberedLectureRow({ number, lecture, onPress, onPlayPress }: ActiveNumberedLectureRowProps) {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const elapsedSec = usePlayerStore(selectElapsedWholeSeconds);

  const elapsed = clockLabel(elapsedSec);
  let metaLabel = pausedLectureMetaLabel(lecture, elapsed);
  let state: 'active-playing' | 'active-paused' = 'active-paused';
  if (isPlaying) {
    metaLabel = playingLectureMetaLabel(lecture, elapsed);
    state = 'active-playing';
  }

  return (
    <NumberedLectureRow
      number={number}
      title={lecture.title}
      author={lecture.author}
      metaLabel={metaLabel}
      state={state}
      onPress={onPress}
      onPlayPress={onPlayPress}
    />
  );
}
