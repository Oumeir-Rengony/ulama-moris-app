import type { EventSummary } from '@/features/events/event.types';
import { fetchEventPage } from '@/features/events/events.api';
import type { Lecture } from '@/features/lectures/lecture.types';
import { fetchLecturePage } from '@/features/lectures/lectures.api';

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

// What the Search screen shows: the results loaded so far, and how many match in all.
export type SearchResults = {
  items: SearchResult[];
  // The number of matches, as the API reports it. The screen only displays it.
  total: number;
};

export type SearchResultsPage = SearchResults & {
  page: number;
  hasMore: boolean;
};

// The API matches the title the same way (case- and accent-insensitive), so the match is
// usually found again here for the highlight. If it isn't, the title shows unhighlighted.
function highlightTitle(title: string, query: string): TextPart[] {
  return splitForHighlight(title, findMatch(title, query));
}

// Every series is searched: Search has no series chips.
async function searchLectures(query: string, page: number): Promise<SearchResultsPage> {
  const lecturePage = await fetchLecturePage({ page, search: query });

  const items: SearchResult[] = [];
  for (const lecture of lecturePage.items) {
    items.push({ kind: 'lecture', lecture, titleParts: highlightTitle(lecture.title, query) });
  }

  return { items, total: lecturePage.total, page: lecturePage.page, hasMore: lecturePage.hasMore };
}

async function searchEvents(query: string, page: number): Promise<SearchResultsPage> {
  const eventPage = await fetchEventPage({ page, search: query });

  const items: SearchResult[] = [];
  for (const event of eventPage.items) {
    items.push({ kind: 'event', event, titleParts: highlightTitle(event.title, query) });
  }

  return { items, total: eventPage.total, page: eventPage.page, hasMore: eventPage.hasMore };
}

// One page of the lectures or events whose title contains the query.
export async function fetchSearchResultsPage(
  scope: SearchScope,
  query: string,
  page: number,
): Promise<SearchResultsPage> {
  if (scope === 'events') {
    return searchEvents(query, page);
  }
  return searchLectures(query, page);
}

function resultKey(result: SearchResult): string {
  if (result.kind === 'lecture') {
    return result.lecture.id;
  }
  return result.event.slug;
}

// Joins the loaded pages, dropping a result a later page repeats (see joinLecturePages). The
// total is the first page's: past the last page the API can report 0.
export function joinSearchPages(pages: SearchResultsPage[]): SearchResults {
  const items: SearchResult[] = [];
  const seenKeys = new Set<string>();

  for (const page of pages) {
    for (const result of page.items) {
      const key = resultKey(result);
      if (seenKeys.has(key)) {
        continue;
      }
      seenKeys.add(key);
      items.push(result);
    }
  }

  let total = 0;
  if (pages.length > 0) {
    total = pages[0].total;
  }

  return { items, total };
}
