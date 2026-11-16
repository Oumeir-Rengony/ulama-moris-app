import { ApiError } from '@/features/api/api-client';
import { fetchLectureBySlug, fetchLecturePage, joinLecturePages, type LecturePage } from '@/features/lectures/lectures.api';
import type { Lecture } from '@/features/lectures/lecture.types';
import { fullLecture } from '@/test-utils/fixtures';
import { answerFetchWith, apiLecture, apiPage, failFetchWithNoConnection, fetchedPaths } from '@/test-utils/fake-fetch';

describe('fetchLecturePage', () => {
  it('asks for one page of 10 lectures of the series', async () => {
    answerFetchWith(() => ({ status: 200, body: apiPage([], { total: 0, page: 2, hasMore: false }) }));

    await fetchLecturePage({ page: 2, series: 'guest' });

    expect(fetchedPaths()).toEqual(['/lectures?page=2&limit=10&type=guest']);
  });

  it('sends a trimmed search and leaves out the series when there is none', async () => {
    answerFetchWith(() => ({ status: 200, body: apiPage([], { total: 0, page: 1, hasMore: false }) }));

    await fetchLecturePage({ page: 1, search: '  sahaba ' });

    expect(fetchedPaths()).toEqual(['/lectures?page=1&limit=10&search=sahaba']);
  });

  it('returns the page as the API reports it', async () => {
    answerFetchWith(() => ({ status: 200, body: apiPage([apiLecture()], { total: 81, page: 1, hasMore: true }) }));

    const page = await fetchLecturePage({ page: 1, series: 'local' });

    expect(page.total).toBe(81);
    expect(page.page).toBe(1);
    expect(page.hasMore).toBe(true);
    expect(page.items[0]).toEqual({
      id: 'api-lecture-1',
      slug: 'gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum',
      title: "Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum",
      author: 'Mufti Houzeifa Mamoojee',
      date: '2026-10-31T21:15:00.000+04:00',
      duration: '35:48',
      masjid: 'MASJID MUSWALLA, HIGHLANDS',
      url: 'https://example.com/gravity.m4a',
      series: 'local',
      event: 'The Sahaba Radiyyallahu Anhum',
      eventSlug: 'the-sahaba-radiyyallahu-anhum',
      category: ['sahaba r.a'],
    });
  });

  it('leaves out every value the API sends as null', async () => {
    const bareApiLecture = apiLecture({
      author: null,
      date: null,
      duration: null,
      masjid: null,
      series: null,
      event: null,
      eventSlug: null,
      category: [],
    });
    answerFetchWith(() => ({ status: 200, body: apiPage([bareApiLecture], { total: 1, page: 1, hasMore: false }) }));

    const page = await fetchLecturePage({ page: 1, series: 'local' });
    const lecture = page.items[0];

    expect(lecture.author).toBeUndefined();
    expect(lecture.date).toBeUndefined();
    expect(lecture.duration).toBeUndefined();
    expect(lecture.masjid).toBeUndefined();
    expect(lecture.series).toBeUndefined();
    expect(lecture.event).toBeUndefined();
    expect(lecture.eventSlug).toBeUndefined();
    expect(lecture.category).toEqual([]);
  });

  it('throws an ApiError with the status when the API fails', async () => {
    answerFetchWith(() => ({ status: 500, body: { error: 'Failed to fetch lectures' } }));

    const request = fetchLecturePage({ page: 1, series: 'local' });

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 500, message: 'Failed to fetch lectures' });
  });

  it('lets a failed connection fail the request', async () => {
    failFetchWithNoConnection();

    await expect(fetchLecturePage({ page: 1, series: 'local' })).rejects.toThrow('Network request failed');
  });
});

describe('fetchLectureBySlug', () => {
  it('asks for the lecture by its slug, encoded for the URL', async () => {
    answerFetchWith(() => ({ status: 200, body: apiLecture() }));

    await fetchLectureBySlug('seerah-(s.a.w)');

    expect(fetchedPaths()).toEqual(['/lectures/seerah-(s.a.w)']);
  });

  it('returns the lecture', async () => {
    answerFetchWith(() => ({ status: 200, body: apiLecture() }));

    const lecture = await fetchLectureBySlug('gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum');

    expect(lecture?.title).toBe("Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum");
  });

  it('returns null when the API has no such lecture', async () => {
    answerFetchWith(() => ({ status: 404, body: { error: 'Lecture not found' } }));

    expect(await fetchLectureBySlug('nope')).toBeNull();
  });

  it('throws for any other failure, so the screen can offer a retry', async () => {
    answerFetchWith(() => ({ status: 500, body: { error: 'Failed to fetch lecture' } }));

    await expect(fetchLectureBySlug('gravity')).rejects.toMatchObject({ status: 500 });
  });
});

describe('joinLecturePages', () => {
  function lectureWithId(id: string): Lecture {
    return { ...fullLecture, id, slug: `slug-${id}` };
  }

  function page(items: Lecture[], pageNumber: number): LecturePage {
    return { items, total: 4, page: pageNumber, hasMore: true };
  }

  it('joins the pages in order', () => {
    const pages = [page([lectureWithId('a'), lectureWithId('b')], 1), page([lectureWithId('c')], 2)];

    const ids = joinLecturePages(pages).map((lecture) => lecture.id);

    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('drops a lecture that a later page repeats (a lecture was published while scrolling)', () => {
    const pages = [page([lectureWithId('a'), lectureWithId('b')], 1), page([lectureWithId('b'), lectureWithId('c')], 2)];

    const ids = joinLecturePages(pages).map((lecture) => lecture.id);

    expect(ids).toEqual(['a', 'b', 'c']);
  });
});
