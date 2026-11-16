import type { Lecture } from '@/features/lectures/lecture.types';
import { formatVenue } from '@/utils/format-venue';
import { shortDateLabel } from '@/utils/format-time';

import type { SearchScope } from './scope';

// The input's placeholder.
export function searchPlaceholder(scope: SearchScope): string {
  if (scope === 'events') {
    return 'Search events by name';
  }
  return 'Search by topic';
}

// "3 lectures found", "1 lecture found", "2 events found".
export function resultsHeadingLabel(scope: SearchScope, total: number): string {
  if (scope === 'events') {
    if (total === 1) {
      return '1 event found';
    }
    return `${total} events found`;
  }

  if (total === 1) {
    return '1 lecture found';
  }
  return `${total} lectures found`;
}

// The no-results card's title: No results for “zzz”.
export function noResultsTitle(query: string): string {
  return `No results for “${query}”`;
}

// The no-results card's message. Search matches titles only, so there are no topic examples.
export function noResultsMessage(scope: SearchScope): string {
  if (scope === 'events') {
    return 'Try another event title.';
  }
  return 'Try another lecture title.';
}

// A lecture result's meta line: "31 Oct · Masjid Muswalla, Highlands". The date or the venue is
// left out when the lecture has none.
export function lectureResultMetaLabel(lecture: Lecture): string {
  const parts: string[] = [];

  if (lecture.date !== undefined) {
    parts.push(shortDateLabel(lecture.date));
  }

  if (lecture.masjid) {
    parts.push(formatVenue(lecture.masjid));
  }

  return parts.join(' · ');
}
