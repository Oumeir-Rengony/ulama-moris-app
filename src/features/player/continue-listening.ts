import type { LectureSummary } from '@/data/sample';
import { clockLabel, clockToSeconds, minutesLeftLabel } from '@/utils/format-time';

export type ContinueListeningContent = {
  title: string;
  author: string;
  state: 'playing' | 'paused';
  progress: number;
  elapsedLabel: string;
  minutesLeftLabel: string;
};

type ContinueListeningInput = {
  // The last played lecture (from listening history), or undefined until it has been looked up.
  lecture: LectureSummary | null | undefined;
  // Where it is, in seconds: the live position while it plays, otherwise its saved resume point.
  positionSec: number;
  // Whether it's the lecture loaded in the player right now, and playing.
  isActive: boolean;
  isPlaying: boolean;
};

// The Continue listening card's strings, or undefined when there is nothing to continue (nothing
// played yet, the last one was finished, or the lecture can't be found).
export function buildContinueListeningContent({
  lecture,
  positionSec,
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
    progress = positionSec / durationSec;
    minutesLeft = minutesLeftLabel(durationSec - positionSec);
  }

  return {
    title: lecture.title,
    author: lecture.author,
    state,
    progress,
    elapsedLabel: clockLabel(positionSec),
    minutesLeftLabel: minutesLeft,
  };
}
