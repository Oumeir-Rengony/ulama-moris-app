import { useQuery } from '@tanstack/react-query';

import { fetchSearchResults } from './search.api';
import type { SearchScope } from './scope';

// The results for one scope and one (already debounced) query. Does nothing while the query is
// blank, so the recent searches show instead.
export function useSearchQuery(scope: SearchScope, debouncedQuery: string) {
  return useQuery({
    queryKey: ['search', scope, debouncedQuery],
    queryFn: () => fetchSearchResults(scope, debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  });
}
