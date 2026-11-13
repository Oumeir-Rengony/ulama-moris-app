// These protect the contract the real API will have to meet, so swapping it in is safe.
import { events, eventsTotal, lectures } from '@/data/sample';
import { EVENT_PAGE_SIZE, fetchEventBySlug, fetchEventPage, type EventPage } from '@/features/events/events.api';
import { fetchLectureBySlug } from '@/features/lectures/lectures.api';

// Reads pages until nextPageIndex is null, failing instead of hanging if it never ends.
async function fetchAllPages(): Promise<EventPage[]> {
  const pages: EventPage[] = [];
  let pageIndex: number | null = 0;

  while (pageIndex !== null) {
    const page = await fetchEventPage(pageIndex);
    pages.push(page);
    pageIndex = page.nextPageIndex;

    if (pages.length > 100) {
      throw new Error('fetchEventPage never returned nextPageIndex: null');
    }
  }
  return pages;
}

describe('fetchEventPage', () => {
  it('returns a full first page', async () => {
    const firstPage = await fetchEventPage(0);
    expect(firstPage.items).toHaveLength(EVENT_PAGE_SIZE);
  });

  it('reports the events total on every page', async () => {
    const pages = await fetchAllPages();
    for (const page of pages) {
      expect(page.total).toBe(eventsTotal);
    }
  });

  it('counts nextPageIndex up, then ends with null on the last page', async () => {
    const pages = await fetchAllPages();
    const lastPageIndex = pages.length - 1;

    for (let pageIndex = 0; pageIndex < lastPageIndex; pageIndex++) {
      expect(pages[pageIndex].nextPageIndex).toBe(pageIndex + 1);
    }
    expect(pages[lastPageIndex].nextPageIndex).toBeNull();
  });

  it('keeps the order of the data, without sorting', async () => {
    const pages = await fetchAllPages();
    const pagedSlugs: string[] = [];
    for (const page of pages) {
      for (const event of page.items) {
        pagedSlugs.push(event.slug);
      }
    }

    const dataSlugs = events.map((event) => event.slug);
    expect(pagedSlugs).toEqual(dataSlugs);
  });
});

describe('fetchEventBySlug', () => {
  it('returns the Sahaba event with its 4 lectures in data order', async () => {
    const detail = await fetchEventBySlug('the-sahaba-radiyyallahu-anhum');
    expect(detail?.event.title).toBe('The Sahaba Radiyyallahu Anhum');

    const expectedSlugs: string[] = [];
    for (const lecture of lectures) {
      if (lecture.event === 'The Sahaba Radiyyallahu Anhum') {
        expectedSlugs.push(lecture.slug);
      }
    }
    expect(expectedSlugs).toHaveLength(4);
    expect(detail?.lectures.map((lecture) => lecture.slug)).toEqual(expectedSlugs);
  });

  it("generates `total` lectures for an event with no lectures of its own, each one findable", async () => {
    const detail = await fetchEventBySlug('ramadan-reminders-2026');
    if (detail === null) {
      throw new Error('ramadan-reminders-2026 should exist in the sample data');
    }

    expect(detail.lectures).toHaveLength(detail.event.total);
    for (const lecture of detail.lectures) {
      const found = await fetchLectureBySlug(lecture.slug);
      expect(found?.slug).toBe(lecture.slug);
    }
  });

  it('returns null for an unknown slug', async () => {
    expect(await fetchEventBySlug('no-such-event')).toBeNull();
  });
});
