import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchEventBySlug, fetchEventPage, type EventPage } from './events.api';

// The API counts pages from 1. The next page is asked for only while the API says there is one.
function nextPageAfter(lastPage: EventPage): number | undefined {
  if (!lastPage.hasMore) {
    return undefined;
  }
  return lastPage.page + 1;
}

// The Events list: events one page at a time, newest first.
export function useEventsQuery() {
  return useInfiniteQuery({
    queryKey: ['events', 'list'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchEventPage({ page: pageParam }),
    getNextPageParam: nextPageAfter,
  });
}

// One event and its lectures (Event detail). Does nothing until there is a slug. The data is
// null when the API has no event with that slug.
export function useEventQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ['events', 'detail', slug],
    queryFn: () => fetchEventBySlug(slug ?? ''),
    enabled: slug !== undefined && slug !== '',
  });
}
