import { findSampleLecture, repeatSampleLectures } from '@/data/mock-repeat';
import { latestLecturesTotal, type Lecture, type LectureSummary } from '@/data/sample';

export const LECTURE_PAGE_SIZE = 10;

export type LecturePage = {
  items: LectureSummary[];
  // The size of the whole library, as the API reports it. The app never counts lectures.
  total: number;
  // null once the last page has been returned.
  nextPageIndex: number | null;
};

// MOCK: the sample lectures repeated up to the total the "API" reports, so the list and the
// "81 lectures" label agree (see src/data/mock-repeat.ts).
const mockLibrary = repeatSampleLectures({
  count: latestLecturesTotal,
  copyTag: '',
  keepRealSlugsOnFirstPass: true,
});

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
// Stub: resolves the sample lectures and every generated copy ("…--3", "…--jummah-0"), so a
// lecture opened from Home or from any event detail can be found. The real API replaces this body.
export async function fetchLectureBySlug(slug: string): Promise<Lecture | null> {
  return findSampleLecture(slug);
}
