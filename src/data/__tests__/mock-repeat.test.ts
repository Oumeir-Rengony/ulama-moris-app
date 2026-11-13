import { findSampleLecture, repeatSampleLectures } from '@/data/mock-repeat';
import { lectures } from '@/data/sample';

describe('repeatSampleLectures', () => {
  it('repeats the sample lectures in order up to the requested count', () => {
    const count = lectures.length + 2;
    const repeated = repeatSampleLectures({ count, copyTag: '', keepRealSlugsOnFirstPass: true });

    expect(repeated).toHaveLength(count);
    expect(repeated[0].title).toBe(lectures[0].title);
    expect(repeated[lectures.length].title).toBe(lectures[0].title);
    expect(repeated[lectures.length + 1].title).toBe(lectures[1].title);
  });

  it('keeps the real slugs on the first pass when asked, then adds "--N"', () => {
    const repeated = repeatSampleLectures({
      count: lectures.length + 1,
      copyTag: '',
      keepRealSlugsOnFirstPass: true,
    });

    expect(repeated[0].slug).toBe(lectures[0].slug);
    expect(repeated[lectures.length].slug).toBe(`${lectures[0].slug}--1`);
  });

  it('tags every copy when the real slugs are not kept', () => {
    const repeated = repeatSampleLectures({ count: 2, copyTag: 'jummah-', keepRealSlugsOnFirstPass: false });
    expect(repeated[0].slug).toBe(`${lectures[0].slug}--jummah-0`);
    expect(repeated[1].slug).toBe(`${lectures[1].slug}--jummah-0`);
  });

  it('gives every copy a unique slug', () => {
    const repeated = repeatSampleLectures({ count: 81, copyTag: '', keepRealSlugsOnFirstPass: true });
    const uniqueSlugs = new Set(repeated.map((lecture) => lecture.slug));
    expect(uniqueSlugs.size).toBe(81);
  });

  it('returns nothing for a count of 0', () => {
    expect(repeatSampleLectures({ count: 0, copyTag: '', keepRealSlugsOnFirstPass: true })).toEqual([]);
  });
});

describe('findSampleLecture', () => {
  it('finds a sample lecture by its slug', () => {
    expect(findSampleLecture(lectures[2].slug)?.title).toBe(lectures[2].title);
  });

  it('finds a copy, keeping the copy slug', () => {
    const copySlug = `${lectures[2].slug}--jummah-3`;
    const found = findSampleLecture(copySlug);
    expect(found?.title).toBe(lectures[2].title);
    expect(found?.slug).toBe(copySlug);
  });

  it('returns null for an unknown slug', () => {
    expect(findSampleLecture('no-such-lecture')).toBeNull();
  });
});
