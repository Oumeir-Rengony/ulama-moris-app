import type { Lecture } from '@/features/lectures/lecture.types';
import { formatVenue } from '@/utils/format-venue';
import { clockToSeconds, minutesLabel, shortDateLabel } from '@/utils/format-time';

// The Home row meta line: "31 Oct · 36 min · Masjid Muswalla, Highlands".
// A part is left out when the data has no value for it.
export function lectureRowMetaLabel(lecture: Lecture): string {
  const parts: string[] = [];

  if (lecture.date !== undefined) {
    parts.push(shortDateLabel(lecture.date));
  }

  const durationSeconds = clockToSeconds(lecture.duration);
  if (durationSeconds !== null) {
    parts.push(minutesLabel(durationSeconds));
  }

  if (lecture.masjid) {
    parts.push(formatVenue(lecture.masjid));
  }

  return parts.join(' · ');
}
