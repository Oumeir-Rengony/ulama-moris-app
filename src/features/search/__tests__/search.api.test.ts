import { fetchSearchResultsPage, joinSearchPages, type SearchResultsPage } from '@/features/search/search.api';
import { answerFetchWith, apiEvent, apiLecture, apiPage, fetchedPaths } from '@/test-utils/fake-fetch';

describe('fetchSearchResultsPage, lectures', () => {
  it('searches every series: no type is sent', async () => {
    answerFetchWith(() => ({ status: 200, body: apiPage([], { total: 0, page: 1, hasMore: false }) }));

    await fetchSearchResultsPage('lectures', 'sahaba', 1);

    expect(fetchedPaths()).toEqual(['/lectures?page=1&limit=10&search=sahaba']);
  });

  it('returns lecture results with the API total and paging', async () => {
    const lectures = [apiLecture({ id: 'a' }), apiLecture({ id: 'b' })];
    answerFetchWith(() => ({ status: 200, body: apiPage(lectures, { total: 14, page: 1, hasMore: true }) }));

    const results = await fetchSearchResultsPage('lectures', 'sahaba', 1);

    expect(results.items).toHaveLength(2);
    expect(results.items[0].kind).toBe('lecture');
    expect(results.total).toBe(14);
    expect(results.hasMore).toBe(true);
  });

  it('highlights the matched part of the title, whichever way "Sahaba" is spelled', async () => {
    answerFetchWith(() => ({ status: 200, body: apiPage([apiLecture()], { total: 1, page: 1, hasMore: false }) }));

    const results = await fetchSearchResultsPage('lectures', 'sahaba', 1);
    const highlightedText = [];
    for (const part of results.items[0].titleParts) {
      if (part.highlighted) {
        highlightedText.push(part.text);
      }
    }

    expect(highlightedText).toEqual(['Şahābā']);
  });

  it('shows the whole title unhighlighted when the match can’t be found again', async () => {
    answerFetchWith(() => ({ status: 200, body: apiPage([apiLecture()], { total: 1, page: 1, hasMore: false }) }));

    const results = await fetchSearchResultsPage('lectures', 'zzz', 1);

    expect(results.items[0].titleParts).toEqual([
      { text: "Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum", highlighted: false },
    ]);
  });
});

describe('fetchSearchResultsPage, events', () => {
  it('searches the events and returns event results', async () => {
    answerFetchWith(() => ({ status: 200, body: apiPage([apiEvent()], { total: 1, page: 1, hasMore: false }) }));

    const results = await fetchSearchResultsPage('events', 'sahaba', 1);

    expect(fetchedPaths()).toEqual(['/events?page=1&limit=10&search=sahaba']);
    expect(results.items[0].kind).toBe('event');
    expect(results.total).toBe(1);
  });
});

describe('joinSearchPages', () => {
  function lecturePage(ids: string[], options: { page: number; total: number }): SearchResultsPage {
    const items = [];
    for (const id of ids) {
      items.push({
        kind: 'lecture' as const,
        lecture: { id, slug: id, title: id, url: 'https://example.com/a.m4a', category: [] },
        titleParts: [{ text: id, highlighted: false }],
      });
    }
    return { items, total: options.total, page: options.page, hasMore: true };
  }

  it('keeps the first page’s total, because the API reports 0 past the last page', () => {
    const results = joinSearchPages([lecturePage(['a'], { page: 1, total: 11 }), lecturePage([], { page: 2, total: 0 })]);

    expect(results.total).toBe(11);
  });

  it('drops a result that a later page repeats', () => {
    const results = joinSearchPages([
      lecturePage(['a', 'b'], { page: 1, total: 3 }),
      lecturePage(['b', 'c'], { page: 2, total: 3 }),
    ]);

    const ids = [];
    for (const result of results.items) {
      if (result.kind === 'lecture') {
        ids.push(result.lecture.id);
      }
    }
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('is empty before any page has arrived', () => {
    expect(joinSearchPages([])).toEqual({ items: [], total: 0 });
  });
});
