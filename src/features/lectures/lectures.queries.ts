import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchLectureBySlug, fetchLecturePage } from './lectures.api';

// The Home list: the latest lectures, one page at a time.
export function useLatestLecturesQuery() {
  return useInfiniteQuery({
    queryKey: ['lectures', 'latest'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchLecturePage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPageIndex ?? undefined,
  });
}

// One lecture's detail record (Now Playing). Does nothing until there is a slug.
export function useLectureQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ['lectures', 'detail', slug],
    queryFn: () => fetchLectureBySlug(slug ?? ''),
    enabled: slug !== undefined && slug !== '',
  });
}
