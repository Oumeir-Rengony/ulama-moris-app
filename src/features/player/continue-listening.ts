import type { ContinueListeningContent } from '@/components/HomeListHeader';
import type { LectureSummary } from '@/data/sample';
import { clockLabel, clockToSeconds, minutesLeftLabel } from '@/utils/format-time';

type ContinueListeningInput = {
  // The last played lecture (from listening history), or undefined until it has been looked up.
  lecture: LectureSummary | null | undefined;
  // Its saved resume point, in seconds.
  savedPositionSec: number;
  // Whether it's the lecture loaded in the player right now, and playing.
  isActive: boolean;
  isPlaying: boolean;
};

// The Continue listening card's strings, or undefined when there is nothing to continue (a first
// launch, or the lecture can't be found). The progress comes from the saved resume point, which
// is updated at checkpoints (about every 10 s while playing), not four times a second.
export function buildContinueListeningContent({
  lecture,
  savedPositionSec,
  isActive,
  isPlaying,
}: ContinueListeningInput): ContinueListeningContent | undefined {
  if (!lecture) {
    return undefined;
  }

  let state: 'playing' | 'paused' = 'paused';
  if (isActive && isPlaying) {
    state = 'playing';
  }

  // TODO(design): a lecture without a known duration shows no progress and no time left.
  const durationSec = clockToSeconds(lecture.duration);
  let progress = 0;
  let minutesLeft = '';
  if (durationSec !== null && durationSec > 0) {
    progress = savedPositionSec / durationSec;
    minutesLeft = minutesLeftLabel(durationSec - savedPositionSec);
  }

  return {
    title: lecture.title,
    author: lecture.author,
    state,
    progress,
    elapsedLabel: clockLabel(savedPositionSec),
    minutesLeftLabel: minutesLeft,
  };
}
