import { events, eventsTotal, type EventSummary } from '@/data/sample';

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
