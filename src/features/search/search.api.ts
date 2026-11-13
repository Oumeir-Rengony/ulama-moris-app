import { events, lectures, type EventSummary, type Lecture } from '@/data/sample';

import { findMatch, splitForHighlight, type TextPart } from './match';
import type { SearchScope } from './scope';

export type LectureSearchResult = {
  kind: 'lecture';
  lecture: Lecture;
  // The title split for highlighting, with the matched part flagged.
  titleParts: TextPart[];
};

export type EventSearchResult = {
  kind: 'event';
  event: EventSummary;
  // The title split for highlighting, with the matched part flagged.
  titleParts: TextPart[];
};

export type SearchResult = LectureSearchResult | EventSearchResult;

export type SearchResults = {
  // The matches, in data order.
  items: SearchResult[];
  // The number of matches, as the API reports it. The screen only displays it.
  total: number;
};

// Lectures match on their title only: never the topic, scholar, venue or date.
// Loops over the unique sample lectures, not the repeated Home library, which would show
// the same lecture several times.
function searchLectures(query: string): SearchResults {
  const items: SearchResult[] = [];

  for (const lecture of lectures) {
    const match = findMatch(lecture.title, query);
    if (match === null) {
      continue;
    }
    items.push({ kind: 'lecture', lecture, titleParts: splitForHighlight(lecture.title, match) });
  }

  return { items, total: items.length };
}

// Events match on their title only.
function searchEvents(query: string): SearchResults {
  const items: SearchResult[] = [];

  for (const event of events) {
    const match = findMatch(event.title, query);
    if (match === null) {
      continue;
    }
    items.push({ kind: 'event', event, titleParts: splitForHighlight(event.title, match) });
  }

  return { items, total: items.length };
}

// Returns the lectures or events whose title contains the query (accent-insensitive).
// Stub: filters the static data directly, with no network and no delay. Counting here is fine
// because this stands in for the API, which will return `total` itself. When the real API
// arrives, only this function's body changes.
export async function fetchSearchResults(scope: SearchScope, query: string): Promise<SearchResults> {
  if (scope === 'events') {
    return searchEvents(query);
  }
  return searchLectures(query);
}
