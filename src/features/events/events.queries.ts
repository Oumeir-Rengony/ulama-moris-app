import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchEventPage } from './events.api';

// The Events list: events one page at a time, newest first.
export function useEventsQuery() {
  return useInfiniteQuery({
    queryKey: ['events', 'list'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchEventPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPageIndex ?? undefined,
  });
}
