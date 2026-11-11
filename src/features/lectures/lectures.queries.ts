import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchLecturePage } from './lectures.api';

// The Home list: the latest lectures, one page at a time.
export function useLatestLecturesQuery() {
  return useInfiniteQuery({
    queryKey: ['lectures', 'latest'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchLecturePage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPageIndex ?? undefined,
  });
}
