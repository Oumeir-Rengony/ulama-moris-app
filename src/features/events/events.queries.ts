import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery, type InfiniteData } from '@tanstack/react-query';

import type { EventSummary } from './event.types';
import { fetchEventBySlug, fetchEventPage, type EventPage } from './events.api';

const eventsListKey = ['events', 'list'];

// The API counts pages from 1. The next page is asked for only while the API says there is one.
function nextPageAfter(lastPage: EventPage): number | undefined {
  if (!lastPage.hasMore) {
    return undefined;
  }
  return lastPage.page + 1;
}

// The Events list: events one page at a time, newest first.
// Suspends until the first page has loaded: render it inside a QueryBoundary.
export function useEventsQuery() {
  return useSuspenseInfiniteQuery({
    queryKey: eventsListKey,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchEventPage({ page: pageParam }),
    getNextPageParam: nextPageAfter,
  });
}

// One event and its lectures (Event detail). The data is null when the API has no event with
// that slug. Suspends until it has loaded: render it inside a QueryBoundary.
export function useEventQuery(slug: string) {
  return useSuspenseQuery({
    queryKey: ['events', 'detail', slug],
    queryFn: () => fetchEventBySlug(slug),
  });
}

// The event as the Events list already has it in the cache, or undefined when the list hasn't
// loaded it (a deep link, a search result, an event past the loaded pages). Event detail draws
// its hero card from it at once, so only the lecture rows wait for the event's own request.
// Read from the cache on each render, not copied anywhere.
export function useEventSummaryFromList(slug: string | undefined): EventSummary | undefined {
  const queryClient = useQueryClient();
  if (slug === undefined || slug === '') {
    return undefined;
  }

  const listData = queryClient.getQueryData<InfiniteData<EventPage>>(eventsListKey);
  if (listData === undefined) {
    return undefined;
  }

  for (const page of listData.pages) {
    for (const event of page.items) {
      if (event.slug === slug) {
        return event;
      }
    }
  }
  return undefined;
}
