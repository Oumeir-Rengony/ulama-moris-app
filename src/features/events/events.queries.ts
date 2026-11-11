import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchEventBySlug, fetchEventPage } from './events.api';

// The Events list: events one page at a time, newest first.
export function useEventsQuery() {
  return useInfiniteQuery({
    queryKey: ['events', 'list'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchEventPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPageIndex ?? undefined,
  });
}

// One event and its lectures (Event detail, the mini player on Event detail, and Now Playing's
// "Playing from" line). Does nothing until there is a slug.
export function useEventQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ['events', 'detail', slug],
    queryFn: () => fetchEventBySlug(slug ?? ''),
    enabled: slug !== undefined && slug !== '',
  });
}
