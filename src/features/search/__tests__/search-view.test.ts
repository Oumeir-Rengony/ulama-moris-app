import type { SearchResults } from '@/features/search/search.api';
import { pickSearchView } from '@/features/search/search-view';
import { fullLecture } from '@/test-utils/fixtures';

const oneResult: SearchResults = {
  items: [{ kind: 'lecture', lecture: fullLecture, titleParts: [{ text: fullLecture.title, highlighted: true }] }],
  total: 1,
};

const noResults: SearchResults = { items: [], total: 0 };

describe('pickSearchView', () => {
  it('shows the recent searches while the input is empty', () => {
    const view = pickSearchView({ query: '', debouncedQuery: '', results: undefined });
    expect(view).toEqual({ kind: 'recent' });
  });

  it('treats a blank input as empty', () => {
    const view = pickSearchView({ query: '   ', debouncedQuery: '   ', results: noResults });
    expect(view).toEqual({ kind: 'recent' });
  });

  it('keeps the recent searches while the first letters wait for the debounce', () => {
    const view = pickSearchView({ query: 's', debouncedQuery: '', results: undefined });
    expect(view).toEqual({ kind: 'recent' });
  });

  it('waits while the results for a new query have not arrived', () => {
    const view = pickSearchView({ query: 'sahaba', debouncedQuery: 'sahaba', results: undefined });
    expect(view).toEqual({ kind: 'waiting' });
  });

  it('shows the results when there are some', () => {
    const view = pickSearchView({ query: 'sahaba', debouncedQuery: 'sahaba', results: oneResult });
    expect(view).toEqual({ kind: 'results', results: oneResult });
  });

  it('shows no-results with the trimmed query when nothing matched', () => {
    const view = pickSearchView({ query: 'zzz ', debouncedQuery: 'zzz ', results: noResults });
    expect(view).toEqual({ kind: 'no-results', query: 'zzz' });
  });

  it('keeps the previous results while newer typing waits for the debounce', () => {
    const view = pickSearchView({ query: 'sahaba r', debouncedQuery: 'sahaba', results: oneResult });
    expect(view).toEqual({ kind: 'results', results: oneResult });
  });
});
