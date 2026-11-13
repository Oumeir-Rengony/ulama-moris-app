import type { AccessibilityValue } from 'react-native';

import { topicLabels, topicOrder, type Lecture } from '@/data/sample';
import { catForTopic, type Category } from '@/theme/tokens';
import { formatVenue } from '@/utils/format-venue';
import { clockLabel, clockToSeconds, longDateLabel } from '@/utils/format-time';

export type SeekBarContent = {
  progress: number;
  elapsed: string;
  remaining: string;
  accessibilityValue: AccessibilityValue;
};

type SeekBarInput = {
  // Live values from the player store.
  positionSec: number;
  durationSec: number;
  // The data's clock string ("46:21"). Shown until the audio has loaded and reports its own
  // length (the player reports 0 before that). Missing when unknown.
  dataDuration: string | undefined;
};

// The slider's values: progress 0–1, "16:05", "-30:16", and what screen readers announce.
export function nowPlayingSeekBar({ positionSec, durationSec, dataDuration }: SeekBarInput): SeekBarContent {
  let lengthSec = durationSec;
  if (lengthSec <= 0) {
    lengthSec = clockToSeconds(dataDuration) ?? 0;
  }

  let progress = 0;
  if (lengthSec > 0) {
    progress = positionSec / lengthSec;
  }

  const elapsed = clockLabel(positionSec);

  // TODO(design): a lecture without a known duration shows no remaining time.
  let remaining = '';
  let lengthText = 'unknown length';
  if (lengthSec > 0) {
    remaining = `-${clockLabel(lengthSec - positionSec)}`;
    lengthText = clockLabel(lengthSec);
  }

  return {
    progress,
    elapsed,
    remaining,
    accessibilityValue: {
      min: 0,
      max: Math.floor(lengthSec),
      now: Math.floor(positionSec),
      text: `${elapsed} of ${lengthText}`,
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
