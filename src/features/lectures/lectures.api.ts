import { getJson, isNotFound, nullToUndefined } from '@/features/api/api-client';

import type { Lecture, LectureSeries } from './lecture.types';

export const LECTURE_PAGE_SIZE = 10;

// A lecture as the API sends it. slug, title and url are always set (the API leaves out
// lectures without them); a missing optional value is null.
export type ApiLecture = {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  date: string | null;
  duration: string | null;
  masjid: string | null;
  url: string;
  series: LectureSeries | null;
  event: string | null;
  eventSlug: string | null;
  category: string[];
};

export type ApiPage<Item> = {
  items: Item[];
  // The number of matching items, for display only. 0 past the last page, so paging stops on
  // hasMore, never on total.
  total: number;
  page: number;
  hasMore: boolean;
};

export type LecturePage = ApiPage<Lecture>;

// Exported for the event fetcher, whose detail response holds the same lecture shape.
export function toLecture(apiLecture: ApiLecture): Lecture {
  return {
    id: apiLecture.id,
    slug: apiLecture.slug,
    title: apiLecture.title,
    author: nullToUndefined(apiLecture.author),
    date: nullToUndefined(apiLecture.date),
    duration: nullToUndefined(apiLecture.duration),
    masjid: nullToUndefined(apiLecture.masjid),
    url: apiLecture.url,
    series: nullToUndefined(apiLecture.series),
    event: nullToUndefined(apiLecture.event),
    eventSlug: nullToUndefined(apiLecture.eventSlug),
    category: apiLecture.category,
  };
}

type LecturePageRequest = {
  // 1-based, as the API counts pages.
  page: number;
  // Home always sends one. Search leaves it out to search every series.
  series?: LectureSeries;
  // Matches the title, ignoring case and accents. Left out for no filter.
  search?: string;
};

// One page of lectures, newest first.
export async function fetchLecturePage({ page, series, search }: LecturePageRequest): Promise<LecturePage> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(LECTURE_PAGE_SIZE));
  if (series !== undefined) {
    params.set('type', series);
  }
  if (search !== undefined && search.trim() !== '') {
    params.set('search', search.trim());
  }

  const body = (await getJson(`/lectures?${params.toString()}`)) as ApiPage<ApiLecture>;

  const items: Lecture[] = [];
  for (const apiLecture of body.items) {
    items.push(toLecture(apiLecture));
  }

  return { items, total: body.total, page: body.page, hasMore: body.hasMore };
}

// One lecture, or null when the API has no lecture with that slug. Any other failure throws,
// so the query reports an error the screen can retry.
export async function fetchLectureBySlug(slug: string): Promise<Lecture | null> {
  try {
    const body = (await getJson(`/lectures/${encodeURIComponent(slug)}`)) as ApiLecture;
    return toLecture(body);
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

// Joins the loaded pages into one list. Pages are offset based, so a lecture published while
// the user scrolls pushes everything down by one, and the next page can repeat the last
// lecture of the previous page. A repeat is dropped (by id) so list keys stay unique.
export function joinLecturePages(pages: LecturePage[]): Lecture[] {
  const lectures: Lecture[] = [];
  const seenIds = new Set<string>();

  for (const page of pages) {
    for (const lecture of page.items) {
      if (seenIds.has(lecture.id)) {
        continue;
      }
      seenIds.add(lecture.id);
      lectures.push(lecture);
    }
  }

  return lectures;
}
