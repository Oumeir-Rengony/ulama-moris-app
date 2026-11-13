// These protect the contract the real API will have to meet, so swapping it in is safe.
import { fetchSearchResults, type SearchResult } from '@/features/search/search.api';

function resultTitle(result: SearchResult): string {
  if (result.kind === 'lecture') {
    return result.lecture.title;
  }
  return result.event.title;
}

function resultSlug(result: SearchResult): string {
  if (result.kind === 'lecture') {
    return result.lecture.slug;
  }
  return result.event.slug;
}

describe('fetchSearchResults, lectures', () => {
  it('finds every Sahaba lecture, in data order, whichever way "Sahaba" is spelled', async () => {
    const results = await fetchSearchResults('lectures', 'sahaba');
    expect(results.items.map(resultSlug)).toEqual([
      'gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum',
      'sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam',
      'favours-of-the-sahaba-radiyallahu-anhum-upon-the-ummah',
      'who-were-the-sahaba-radiyallahu-anhum',
    ]);
  });

  it('reports a total equal to the number of items', async () => {
    const results = await fetchSearchResults('lectures', 'sahaba');
    expect(results.total).toBe(results.items.length);
  });

  it('returns each lecture once, never a "--N" copy', async () => {
    const results = await fetchSearchResults('lectures', 'the');
    const slugs = results.items.map(resultSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).not.toContain('--');
    }
  });

  it('matches titles only, never a topic or an author', async () => {
    // "current affairs" and "akhlaq" are topics; Mamoojee and Quenette are scholars.
    // None of them appears in a lecture title.
    for (const query of ['current', 'akhlaq', 'Mamoojee', 'Quenette']) {
      const results = await fetchSearchResults('lectures', query);
      expect(results.items).toEqual([]);
    }
  });

  it('flags the matched part of every title for highlighting', async () => {
    const results = await fetchSearchResults('lectures', 'sahaba');
    for (const result of results.items) {
      const highlightedParts = result.titleParts.filter((part) => part.highlighted);
      expect(highlightedParts).toHaveLength(1);

      const joinedParts = result.titleParts.map((part) => part.text).join('');
      expect(joinedParts).toBe(resultTitle(result));
    }
  });

  it('returns nothing for an empty query', async () => {
    const results = await fetchSearchResults('lectures', '');
    expect(results).toEqual({ items: [], total: 0 });
  });
});

describe('fetchSearchResults, events', () => {
  it('finds the one event titled Jummah, not events held at a Jummah Masjid', async () => {
    const results = await fetchSearchResults('events', 'jummah');
    expect(results.items.map(resultSlug)).toEqual(['jummah']);
    expect(results.total).toBe(1);
  });

  it('only returns events', async () => {
    const results = await fetchSearchResults('events', 'sahaba');
    for (const result of results.items) {
      expect(result.kind).toBe('event');
    }
  });

  it('returns nothing for an empty query', async () => {
    const results = await fetchSearchResults('events', '');
    expect(results).toEqual({ items: [], total: 0 });
  });
});
