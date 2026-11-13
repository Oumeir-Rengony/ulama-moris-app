// These protect the contract the real API will have to meet, so swapping it in is safe.
import { latestLecturesTotal, type LectureSummary } from '@/data/sample';
import { fetchLectureBySlug, fetchLecturePage, LECTURE_PAGE_SIZE, type LecturePage } from '@/features/lectures/lectures.api';

// Reads pages until nextPageIndex is null. Stops after 100 pages so a broken stub that never
// ends fails the test instead of hanging it.
async function fetchAllPages(): Promise<LecturePage[]> {
  const pages: LecturePage[] = [];
  let pageIndex: number | null = 0;

  while (pageIndex !== null) {
    const page = await fetchLecturePage(pageIndex);
    pages.push(page);
    pageIndex = page.nextPageIndex;

    if (pages.length > 100) {
      throw new Error('fetchLecturePage never returned nextPageIndex: null');
    }
  }
  return pages;
}

function allItems(pages: LecturePage[]): LectureSummary[] {
  const items: LectureSummary[] = [];
  for (const page of pages) {
    items.push(...page.items);
  }
  return items;
}

describe('fetchLecturePage', () => {
  it('returns a full first page', async () => {
    const firstPage = await fetchLecturePage(0);
    expect(firstPage.items).toHaveLength(LECTURE_PAGE_SIZE);
    expect(firstPage.nextPageIndex).toBe(1);
  });

  it('reports the same library total on every page', async () => {
    const pages = await fetchAllPages();
    for (const page of pages) {
      expect(page.total).toBe(latestLecturesTotal);
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

  it('returns exactly the total across all pages, so the last page may be short', async () => {
    const pages = await fetchAllPages();
    expect(allItems(pages)).toHaveLength(latestLecturesTotal);

    const lastPage = pages[pages.length - 1];
    expect(lastPage.items.length).toBeGreaterThan(0);
    expect(lastPage.items.length).toBeLessThanOrEqual(LECTURE_PAGE_SIZE);
  });

  it('never repeats a slug across pages', async () => {
    const pages = await fetchAllPages();
    const slugs = allItems(pages).map((lecture) => lecture.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('fetchLectureBySlug', () => {
  it('finds a lecture from the first page', async () => {
    const firstPage = await fetchLecturePage(0);
    const firstLecture = firstPage.items[0];
    const found = await fetchLectureBySlug(firstLecture.slug);
    expect(found?.title).toBe(firstLecture.title);
  });

  it('finds a generated "--N" copy from a later page', async () => {
    const laterPage = await fetchLecturePage(2);
    const copy = laterPage.items[0];
    expect(copy.slug).toContain('--');

    const found = await fetchLectureBySlug(copy.slug);
    expect(found?.slug).toBe(copy.slug);
    expect(found?.title).toBe(copy.title);
  });

  it('returns null for an unknown slug', async () => {
    expect(await fetchLectureBySlug('no-such-lecture')).toBeNull();
  });
});
