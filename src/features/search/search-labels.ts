import type { Lecture } from '@/data/sample';
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

// A lecture result's meta line: "31 Oct · Masjid Muswalla, Highlands", or just the date when the
// lecture has no venue.
export function lectureResultMetaLabel(lecture: Lecture): string {
  const dateLabel = shortDateLabel(lecture.date);
  if (lecture.masjid) {
    return `${dateLabel} · ${formatVenue(lecture.masjid)}`;
  }
  return dateLabel;
}
