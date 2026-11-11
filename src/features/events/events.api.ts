import { repeatSampleLectures } from '@/data/mock-repeat';
import { events, eventsTotal, lectures, type EventSummary, type Lecture } from '@/data/sample';

export const EVENT_PAGE_SIZE = 10;

export type EventPage = {
  items: EventSummary[];
  // The number of events, as the API reports it. The app never counts events.
  total: number;
  // null once the last page has been returned.
  nextPageIndex: number | null;
};

// Returns one page of events, newest first, in the order the API gives them (don't sort).
// Stub: reads the static data directly, with no network and no delay. When the real API arrives,
// only this function's body changes.
export async function fetchEventPage(pageIndex: number): Promise<EventPage> {
  const start = pageIndex * EVENT_PAGE_SIZE;
  const end = start + EVENT_PAGE_SIZE;
  const items = events.slice(start, end);

  let nextPageIndex: number | null = pageIndex + 1;
  const reachedTheEnd = end >= events.length;
  if (reachedTheEnd) {
    nextPageIndex = null;
  }

  return { items, total: eventsTotal, nextPageIndex };
}

export type EventDetail = {
  event: EventSummary;
  // The event's lectures, in the order the API returns them (don't sort).
  lectures: Lecture[];
};

// Returns one event with its lectures, or null when no event has that slug.
// Stub: the event's lectures are the sample lectures whose `event` is the event's title, in data
// order. MOCK ONLY: most mock events have no lectures of their own, so for those the sample
// lectures are repeated up to the event's `total` (with their own "--<event slug>-N" slugs), so
// every detail page has rows. The real API replaces this function's body.
export async function fetchEventBySlug(slug: string): Promise<EventDetail | null> {
  let foundEvent: EventSummary | null = null;
  for (const event of events) {
    if (event.slug === slug) {
      foundEvent = event;
    }
  }
  if (foundEvent === null) {
    return null;
  }

  const eventLectures: Lecture[] = [];
  for (const lecture of lectures) {
    if (lecture.event === foundEvent.title) {
      eventLectures.push(lecture);
    }
  }

  if (eventLectures.length > 0) {
    return { event: foundEvent, lectures: eventLectures };
  }

  const generatedLectures = repeatSampleLectures({
    count: foundEvent.total,
    copyTag: `${foundEvent.slug}-`,
    keepRealSlugsOnFirstPass: false,
  });
  return { event: foundEvent, lectures: generatedLectures };
}
