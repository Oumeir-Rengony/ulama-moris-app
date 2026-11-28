import { useQuery, useSuspenseInfiniteQuery } from '@tanstack/react-query';

import type { LectureSeries } from './lecture.types';
import { fetchLectureBySlug, fetchLecturePage, type LecturePage } from './lectures.api';

// The API counts pages from 1. The next page is asked for only while the API says there is one.
function nextPageAfter(lastPage: LecturePage): number | undefined {
  if (!lastPage.hasMore) {
    return undefined;
  }
  return lastPage.page + 1;
}

// The Home list: one series' lectures, newest first, one page at a time. Each series has its own
// cache entry, so switching chips back shows the pages already loaded.
// Suspends until the first page has loaded: render it inside a QueryBoundary.
export function useLatestLecturesQuery(series: LectureSeries) {
  return useSuspenseInfiniteQuery({
    queryKey: ['lectures', 'latest', { series }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchLecturePage({ page: pageParam, series }),
    getNextPageParam: nextPageAfter,
  });
}

// One lecture's detail record (Continue listening, deep links). Does nothing until there is a
// slug. The data is null when the API has no lecture with that slug.
export function useLectureQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ['lectures', 'detail', slug],
    queryFn: () => fetchLectureBySlug(slug ?? ''),
    enabled: slug !== undefined && slug !== '',
  });
}
