import { latestLecturesTotal, lectures, type Lecture, type LectureSummary } from '@/data/sample';

export const LECTURE_PAGE_SIZE = 10;

export type LecturePage = {
  items: LectureSummary[];
  // The size of the whole library, as the API reports it. The app never counts lectures.
  total: number;
  // null once the last page has been returned.
  nextPageIndex: number | null;
};

// The sample data has only about a dozen lectures, too few to scroll. Repeat them in order until
// the list is as long as the total the "API" reports, so the list and the "81 lectures" label
// agree. The first pass keeps the real slugs (so the playing lecture still matches); every later
// copy gets "--<copy number>" added, so list keys stay unique.
function buildMockLibrary(): Lecture[] {
  const library: Lecture[] = [];
  let copyNumber = 0;

  while (library.length < latestLecturesTotal) {
    for (const lecture of lectures) {
      if (library.length >= latestLecturesTotal) {
        break;
      }

      let slug = lecture.slug;
      if (copyNumber > 0) {
        slug = `${lecture.slug}--${copyNumber}`;
      }
      library.push({ ...lecture, slug });
    }
    copyNumber += 1;
  }

  return library;
}

const mockLibrary = buildMockLibrary();

// Returns one page of the latest lectures, newest first.
// Stub: reads the static data directly, with no network and no delay. When the real API arrives,
// only this function's body changes; the query hook and the screen stay the same.
export async function fetchLecturePage(pageIndex: number): Promise<LecturePage> {
  const start = pageIndex * LECTURE_PAGE_SIZE;
  const end = start + LECTURE_PAGE_SIZE;
  const items = mockLibrary.slice(start, end);

  let nextPageIndex: number | null = pageIndex + 1;
  const reachedTheEnd = end >= mockLibrary.length;
  if (reachedTheEnd) {
    nextPageIndex = null;
  }

  return { items, total: latestLecturesTotal, nextPageIndex };
}

// Returns one lecture's detail record, or null when no lecture has that slug.
// Stub: looks the slug up in the same mock library Home pages through, so the repeated copies
// ("…--2") resolve too. The real API replaces this function's body.
export async function fetchLectureBySlug(slug: string): Promise<Lecture | null> {
  for (const lecture of mockLibrary) {
    if (lecture.slug === slug) {
      return lecture;
    }
  }
  return null;
}
