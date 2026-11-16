import { getJson, isNotFound, nullToUndefined } from '@/features/api/api-client';
import type { Lecture } from '@/features/lectures/lecture.types';
import { toLecture, type ApiLecture, type ApiPage } from '@/features/lectures/lectures.api';

import type { EventSummary } from './event.types';

export const EVENT_PAGE_SIZE = 10;

// An event as the API sends it. A missing value is null.
type ApiEvent = {
  slug: string;
  title: string;
  total: number;
  duration: string | null;
  location: string | null;
  dateRange: string | null;
  dateRangeLong: string | null;
  year: string | null;
  day: string | null;
  month: string | null;
  latestTime: number;
};

type ApiEventDetail = {
  event: ApiEvent;
  lectures: ApiLecture[];
};

export type EventPage = ApiPage<EventSummary>;

export type EventDetail = {
  event: EventSummary;
  // The event's lectures, newest first, in the order the API returns them (don't sort).
  lectures: Lecture[];
};

function toEventSummary(apiEvent: ApiEvent): EventSummary {
  return {
    slug: apiEvent.slug,
    title: apiEvent.title,
    total: apiEvent.total,
    duration: nullToUndefined(apiEvent.duration),
    location: nullToUndefined(apiEvent.location),
    dateRange: nullToUndefined(apiEvent.dateRange),
    dateRangeLong: nullToUndefined(apiEvent.dateRangeLong),
    year: nullToUndefined(apiEvent.year),
    day: nullToUndefined(apiEvent.day),
    month: nullToUndefined(apiEvent.month),
    latestTime: apiEvent.latestTime,
  };
}

type EventPageRequest = {
  // 1-based, as the API counts pages.
  page: number;
  // Matches the title, ignoring case and accents. Left out for no filter.
  search?: string;
};

// One page of events, ordered by their most recent lecture, newest first (don't sort).
export async function fetchEventPage({ page, search }: EventPageRequest): Promise<EventPage> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(EVENT_PAGE_SIZE));
  if (search !== undefined && search.trim() !== '') {
    params.set('search', search.trim());
  }

  const body = (await getJson(`/events?${params.toString()}`)) as ApiPage<ApiEvent>;

  const items: EventSummary[] = [];
  for (const apiEvent of body.items) {
    items.push(toEventSummary(apiEvent));
  }

  return { items, total: body.total, page: body.page, hasMore: body.hasMore };
}

// One event with all its lectures, or null when the API has no event with that slug.
// Any other failure throws, so the query reports an error the screen can retry.
export async function fetchEventBySlug(slug: string): Promise<EventDetail | null> {
  let body: ApiEventDetail;
  try {
    body = (await getJson(`/events/${encodeURIComponent(slug)}`)) as ApiEventDetail;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }

  const lectures: Lecture[] = [];
  for (const apiLecture of body.lectures) {
    lectures.push(toLecture(apiLecture));
  }

  return { event: toEventSummary(body.event), lectures };
}

// Joins the loaded pages into one list, dropping an event a later page repeats (by slug). See
// joinLecturePages for why a page can repeat an item.
export function joinEventPages(pages: EventPage[]): EventSummary[] {
  const events: EventSummary[] = [];
  const seenSlugs = new Set<string>();

  for (const page of pages) {
    for (const event of page.items) {
      if (seenSlugs.has(event.slug)) {
        continue;
      }
      seenSlugs.add(event.slug);
      events.push(event);
    }
  }

  return events;
}
