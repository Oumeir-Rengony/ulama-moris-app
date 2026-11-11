// MOCK ONLY. The sample data has about a dozen lectures, but the screens need more: Home pages
// through 81, and every event detail needs `total` rows. This repeats the sample lectures and
// gives each copy its own slug, so list keys stay unique and every copy can be opened.
//
// A copy's slug is "<original slug>--<tag>", e.g. "rights-of-parents-in-old-age--3" or
// "rights-of-parents-in-old-age--jummah-0". The original is always the part before "--", so one
// lookup (findSampleLecture) resolves any copy, wherever it was made.
import { lectures, type Lecture } from './sample';

const copySeparator = '--';

type RepeatOptions = {
  // How many lectures to return.
  count: number;
  // Goes between "--" and the copy number: '' for Home ("…--3"), 'jummah-' for an event.
  copyTag: string;
  // Home keeps the real slugs on the first pass, so the playing lecture still matches.
  keepRealSlugsOnFirstPass: boolean;
};

export function repeatSampleLectures({ count, copyTag, keepRealSlugsOnFirstPass }: RepeatOptions): Lecture[] {
  const repeated: Lecture[] = [];
  let copyNumber = 0;

  while (repeated.length < count) {
    for (const lecture of lectures) {
      if (repeated.length >= count) {
        break;
      }

      let slug = `${lecture.slug}${copySeparator}${copyTag}${copyNumber}`;
      const isFirstPass = copyNumber === 0;
      if (isFirstPass && keepRealSlugsOnFirstPass) {
        slug = lecture.slug;
      }

      repeated.push({ ...lecture, slug });
    }
    copyNumber += 1;
  }

  return repeated;
}

// Finds a sample lecture by slug, including any copy made by repeatSampleLectures. A copy has
// the same fields as its original, with its own slug.
export function findSampleLecture(slug: string): Lecture | null {
  const originalSlug = slug.split(copySeparator)[0];

  for (const lecture of lectures) {
    if (lecture.slug === originalSlug) {
      return { ...lecture, slug };
    }
  }
  return null;
}
