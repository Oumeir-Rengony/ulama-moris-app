import type { AccessibilityValue } from 'react-native';

import { mockPlayback } from '@/data/mock-ui';
import { topicLabels, topicOrder, type Lecture } from '@/data/sample';
import { catForTopic, type Category } from '@/theme/tokens';
import { formatVenue } from '@/utils/format-venue';
import { clockToSeconds, longDateLabel } from '@/utils/format-time';

export type SeekBarContent = {
  progress: number;
  elapsed: string;
  remaining: string;
  accessibilityValue: AccessibilityValue;
};

// The slider's values. Until the player stage there is no live position: the mockPlayback
// lecture shows its mock progress, and every other lecture shows the start.
// TODO(player stage): read positionSec / durationSec from the player store.
export function nowPlayingSeekBar(lecture: Lecture): SeekBarContent {
  const durationSeconds = clockToSeconds(lecture.duration);

  if (lecture.slug === mockPlayback.lectureSlug) {
    return {
      progress: mockPlayback.progress,
      elapsed: mockPlayback.elapsed,
      remaining: mockPlayback.remaining,
      accessibilityValue: {
        min: 0,
        max: durationSeconds ?? 0,
        now: clockToSeconds(mockPlayback.elapsed) ?? 0,
        text: `${mockPlayback.elapsed} of ${lecture.duration ?? ''}`,
      },
    };
  }

  // TODO(design): a lecture without a known duration shows no remaining time.
  let remaining = '';
  if (lecture.duration) {
    remaining = `-${lecture.duration}`;
  }

  return {
    progress: 0,
    elapsed: '0:00',
    remaining,
    accessibilityValue: {
      min: 0,
      max: durationSeconds ?? 0,
      now: 0,
      text: `0:00 of ${lecture.duration ?? 'unknown length'}`,
    },
  };
}

// Below this the artwork stops shrinking and the screen scrolls instead (small phones, the
// largest text sizes).
const smallestArtworkSize = 200;

type ArtworkFit = {
  // The scroll area below the top bar.
  availableWidth: number;
  availableHeight: number;
  // Everything under the artwork: its top margin, track info, slider, controls and the space
  // below them.
  heightOfEverythingElse: number;
};

// The artwork is as wide as the content column, as designed, unless that would push the controls
// off the screen. Then it shrinks just enough for everything to fit, down to smallestArtworkSize.
export function fitArtworkSize({ availableWidth, availableHeight, heightOfEverythingElse }: ArtworkFit): number {
  const heightLeftForArtwork = availableHeight - heightOfEverythingElse;
  const fittingSize = Math.min(availableWidth, heightLeftForArtwork);
  const atLeastTheSmallest = Math.max(fittingSize, smallestArtworkSize);
  // Never wider than the column, even on a very narrow screen.
  return Math.min(atLeastTheSmallest, availableWidth);
}

export type TrackInfoContent = {
  venue?: string;
  dateLabel: string;
  topicLabel?: string;
  topicCategory?: Category;
  eventTitle?: string;
};

// The lines and pills under the title. Anything the data doesn't have is left out.
export function nowPlayingTrackInfo(lecture: Lecture): TrackInfoContent {
  let venue: string | undefined = undefined;
  if (lecture.masjid) {
    venue = formatVenue(lecture.masjid);
  }

  let topicLabel: string | undefined = undefined;
  let topicCategory: Category | undefined = undefined;
  if (lecture.category.length > 0) {
    const topic = lecture.category[0];
    // The display label from topicLabels ("Ṣaḥābā r.a"); the raw topic if it has none.
    topicLabel = topicLabels[topic] ?? topic;
    topicCategory = catForTopic(topic, topicOrder);
  }

  return {
    venue,
    dateLabel: longDateLabel(lecture.date),
    topicLabel,
    topicCategory,
    eventTitle: lecture.event,
  };
}
