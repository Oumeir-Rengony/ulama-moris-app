import { fetchEventBySlug, fetchEventPage, joinEventPages, type EventPage } from '@/features/events/events.api';
import { fullEvent } from '@/test-utils/fixtures';
import { answerFetchWith, apiEvent, apiLecture, apiPage, fetchedPaths } from '@/test-utils/fake-fetch';

describe('fetchEventPage', () => {
  it('asks for one page of 10 events', async () => {
    answerFetchWith(() => ({ status: 200, body: apiPage([], { total: 9, page: 1, hasMore: false }) }));

    await fetchEventPage({ page: 1 });

    expect(fetchedPaths()).toEqual(['/events?page=1&limit=10']);
  });

  it('sends a trimmed search', async () => {
    answerFetchWith(() => ({ status: 200, body: apiPage([], { total: 0, page: 1, hasMore: false }) }));

    await fetchEventPage({ page: 1, search: ' majlis ' });

    expect(fetchedPaths()).toEqual(['/events?page=1&limit=10&search=majlis']);
  });

  it('returns the events in the order the API gives them', async () => {
    const events = [apiEvent({ slug: 'newest' }), apiEvent({ slug: 'older' })];
    answerFetchWith(() => ({ status: 200, body: apiPage(events, { total: 9, page: 1, hasMore: true }) }));

    const page = await fetchEventPage({ page: 1 });

    expect(page.items.map((event) => event.slug)).toEqual(['newest', 'older']);
    expect(page.total).toBe(9);
    expect(page.hasMore).toBe(true);
  });

  it('leaves out every value the API sends as null (an event with no dated lecture)', async () => {
    const undatedEvent = apiEvent({
      total: 0,
      duration: null,
      location: null,
      dateRange: null,
      dateRangeLong: null,
      year: null,
      day: null,
      month: null,
      latestTime: 0,
    });
    answerFetchWith(() => ({ status: 200, body: apiPage([undatedEvent], { total: 1, page: 1, hasMore: false }) }));

    const page = await fetchEventPage({ page: 1 });

    expect(page.items[0]).toEqual({
      slug: 'the-sahaba-radiyyallahu-anhum',
      title: 'The Sahaba Radiyyallahu Anhum',
      total: 0,
      latestTime: 0,
    });
  });
});

describe('fetchEventBySlug', () => {
  it('returns the event and its lectures, in the order the API gives them', async () => {
    const lectures = [apiLecture({ id: 'second', slug: 'second' }), apiLecture({ id: 'first', slug: 'first' })];
    answerFetchWith(() => ({ status: 200, body: { event: apiEvent(), lectures } }));

    const detail = await fetchEventBySlug('the-sahaba-radiyyallahu-anhum');

    expect(fetchedPaths()).toEqual(['/events/the-sahaba-radiyyallahu-anhum']);
    expect(detail?.event.dateRangeLong).toBe('24 – 31 October 2026');
    expect(detail?.lectures.map((lecture) => lecture.slug)).toEqual(['second', 'first']);
  });

  it('turns the lectures into the app shape too', async () => {
    const lectures = [apiLecture({ masjid: null })];
    answerFetchWith(() => ({ status: 200, body: { event: apiEvent(), lectures } }));

    const detail = await fetchEventBySlug('the-sahaba-radiyyallahu-anhum');

    expect(detail?.lectures[0].masjid).toBeUndefined();
  });

  it('returns an event with no lectures yet as a valid, empty event', async () => {
    answerFetchWith(() => ({ status: 200, body: { event: apiEvent({ total: 0 }), lectures: [] } }));

    const detail = await fetchEventBySlug('the-sahaba-radiyyallahu-anhum');

    expect(detail?.lectures).toEqual([]);
  });

  it('returns null when the API has no such event', async () => {
    answerFetchWith(() => ({ status: 404, body: { error: 'Event not found' } }));

    expect(await fetchEventBySlug('nope')).toBeNull();
  });

  it('throws for any other failure, so the screen can offer a retry', async () => {
    answerFetchWith(() => ({ status: 500, body: { error: 'Failed to fetch event' } }));

    await expect(fetchEventBySlug('the-sahaba-radiyyallahu-anhum')).rejects.toMatchObject({ status: 500 });
  });
});

describe('joinEventPages', () => {
  function page(slugs: string[], pageNumber: number): EventPage {
    const items = [];
    for (const slug of slugs) {
      items.push({ ...fullEvent, slug });
    }
    return { items, total: 4, page: pageNumber, hasMore: true };
  }

  it('drops an event that a later page repeats', () => {
    const events = joinEventPages([page(['a', 'b'], 1), page(['b', 'c'], 2)]);

    expect(events.map((event) => event.slug)).toEqual(['a', 'b', 'c']);
  });
});
