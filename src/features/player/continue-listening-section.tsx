import { View } from 'react-native';

import { ContinueListeningCard } from '@/components/ContinueListeningCard';
import type { LectureSummary } from '@/data/sample';
import { useLectureQuery } from '@/features/lectures/lectures.queries';

import { toggle } from './audio-engine';
import { buildContinueListeningContent } from './continue-listening';
import { useListeningHistoryStore } from './listening-history.store';
import { openNowPlaying } from './open-now-playing';
import { selectActiveLectureSlug, usePlayerStore } from './player.store';

type ContinueListeningSectionProps = {
  // What plays after the lecture when it isn't loaded yet: Home's loaded lectures.
  queue: LectureSummary[];
};

// Home's Continue listening card: the last played lecture that isn't finished, with its progress.
// Draws nothing until something has been played, or once that lecture has been finished.
//
// A component of its own because, while its lecture plays, it follows the live position (four
// updates a second). Only this card re-renders with it, not the whole Home list.
export function ContinueListeningSection({ queue }: ContinueListeningSectionProps) {
  const lastPlayedSlug = useListeningHistoryStore((state) => state.lastPlayedSlug);
  const savedPositionSec = useListeningHistoryStore((state) => {
    if (state.lastPlayedSlug === null) {
      return 0;
    }
    return state.progressById[state.lastPlayedSlug] ?? 0;
  });
  const { data: lecture } = useLectureQuery(lastPlayedSlug ?? undefined);

  const activeLectureSlug = usePlayerStore(selectActiveLectureSlug);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isActive = lastPlayedSlug !== null && lastPlayedSlug === activeLectureSlug;

  // The live position only while this card's lecture plays. Otherwise null, so the card doesn't
  // re-render four times a second while another lecture plays or nothing does.
  const livePositionSec = usePlayerStore((state) => {
    if (!isActive || !state.isPlaying) {
      return null;
    }
    return state.positionSec;
  });

  let positionSec = savedPositionSec;
  if (livePositionSec !== null) {
    positionSec = livePositionSec;
  }

  const content = buildContinueListeningContent({ lecture, positionSec, isActive, isPlaying });
  if (!content) {
    return null;
  }

  // If its lecture is the loaded one (the mini player already shows it), play/pause in place.
  // Otherwise open Now Playing like a row, which loads it and resumes from the saved point: the
  // mini player never introduces a lecture.
  function handleTogglePress() {
    if (isActive) {
      toggle();
      return;
    }
    if (!lecture) {
      return;
    }
    openNowPlaying({ lecture, queue, source: { kind: 'latest' }, resumeIfPaused: true });
  }

  // The card brings its own top spacing, so a hidden card leaves no gap on Home.
  return (
    <View className="mt-6 px-gutter">
      <ContinueListeningCard
        title={content.title}
        author={content.author}
        state={content.state}
        progress={content.progress}
        elapsedLabel={content.elapsedLabel}
        minutesLeftLabel={content.minutesLeftLabel}
        onTogglePress={handleTogglePress}
      />
    </View>
  );
}
