import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchSearchResultsPage, type SearchResultsPage } from './search.api';
import type { SearchScope } from './scope';

// The API counts pages from 1. The next page is asked for only while the API says there is one.
function nextPageAfter(lastPage: SearchResultsPage): number | undefined {
  if (!lastPage.hasMore) {
    return undefined;
  }
  return lastPage.page + 1;
}

// The results for one scope and one (already debounced) query, 10 at a time. Does nothing while
// the query is blank, so the recent searches show instead.
export function useSearchQuery(scope: SearchScope, debouncedQuery: string) {
  const query = debouncedQuery.trim();

  return useInfiniteQuery({
    queryKey: ['search', scope, query],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchSearchResultsPage(scope, query, pageParam),
    getNextPageParam: nextPageAfter,
    enabled: query.length > 0,
  });
}
