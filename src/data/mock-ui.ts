// UI-only mock snapshots for the dev component gallery (src/app/dev/components.tsx).
// Components take display-ready strings ("35:48", "31 Oct", "2h 34m"). Until the screen stages
// add the formatting helpers and the player, these strings are written by hand.
// The screen stages replace each value with a computed one, then delete this file.

import type { Lecture } from '@/features/lectures/lecture.types';

import { lectures } from './sample';

export type TitlePart = {
  text: string;
  highlighted: boolean;
};

// The playback state the designs show: "Sacrifices…" paused at 16:05 of 46:21.
export const mockPlayback = {
  lectureSlug: 'sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam',
  elapsed: '16:05',
  remaining: '-30:16',
  total: '46:21',
  progress: 0.35,
  minutesLeft: '31 min left',
  sourceLabel: 'Latest lectures',
  longDate: 'Saturday, 31 October 2026',
};

function findMockPlaybackLecture(): Lecture {
  for (const lecture of lectures) {
    if (lecture.slug === mockPlayback.lectureSlug) {
      return lecture;
    }
  }
  throw new Error(`mock-ui: no lecture with slug "${mockPlayback.lectureSlug}"`);
}

// The lecture record behind mockPlayback (title, author …). Until the player stage, the Continue
// listening card, the mini player and the active Home row all show this lecture, paused.
export const mockPlaybackLecture = findMockPlaybackLecture();

// Home row meta lines (date · minutes · venue), keyed by lecture slug. No minutes when the
// duration is unknown, no venue when there is none.
export const mockHomeRowMeta: Record<string, string> = {
  'gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum': '31 Oct · 36 min · Masjid Muswalla, Highlands',
  'sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam': '31 Oct · 46 min · Masjid Muswalla, Highlands',
  'mauritius-islamic-finance-hub': '30 Oct · 25 min · Belle Rose Sunnee Mosque',
  'favours-of-the-sahaba-radiyallahu-anhum-upon-the-ummah': '24 Oct · 32 min · Masjid Muswalla, Highlands',
  'who-were-the-sahaba-radiyallahu-anhum': '24 Oct · 40 min · Masjid Muswalla, Highlands',
  'a-country-on-fire-analysis-and-lessons': '16 Oct · Masjid Muswalla, Highlands',
  'the-treaty-of-hudaybiyyah-how-an-apparent-setback-became-a-clear-victory': '9 Oct · 51 min · Masjid Muswalla, Highlands',
  'guarding-the-tongue-in-the-age-of-social-media': '2 Oct · 29 min',
};

// Event detail row meta when the row is not the active lecture (date · clock duration).
export const mockEventDetailRowMeta: Record<string, string> = {
  'gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum': '31 Oct · 35:48',
  'sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam': '31 Oct · 46:21',
  'favours-of-the-sahaba-radiyallahu-anhum-upon-the-ummah': '24 Oct · 32:14',
  'who-were-the-sahaba-radiyallahu-anhum': '24 Oct · 39:37',
};

// Events list stats lines, keyed by event slug.
export const mockEventStats: Record<string, string> = {
  'the-sahaba-radiyyallahu-anhum': '4 lectures · 2h 34m · 24 – 31 Oct',
  'monthly-islahi-majlis-sat-09-may-2026': '5 lectures · 1h 19m',
  jummah: '8 lectures · 3h 25m',
};

export const mockLatestEventMeta = '24 – 31 Oct 2026 · Masjid Muswalla, Highlands';

// Search results for the query "Ṣaḥābā", with the matched part of each title precomputed, so the
// components need no matching logic. The two real records spell it "Şahābā" (S-cedilla); the
// match still covers it once accent-insensitive matching is built.
export type MockLectureResult = {
  slug: string;
  titleParts: TitlePart[];
  author: string;
  metaLabel: string;
  topic: string;
};

export type MockEventResult = {
  slug: string;
  titleParts: TitlePart[];
  metaLabel: string;
  day: string;
  month: string;
};

export const mockSearchResults: {
  query: string;
  lectures: MockLectureResult[];
  events: MockEventResult[];
} = {
  query: 'Ṣaḥābā',
  lectures: [
    {
      slug: 'sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam',
      titleParts: [
        { text: 'Sacrifices of the ', highlighted: false },
        { text: 'Şahābā', highlighted: true },
        { text: " Radiyallāhu 'Anhum for Islam", highlighted: false },
      ],
      author: 'Mawlana Zyad Ally Quenette',
      metaLabel: '31 Oct · Masjid Muswalla, Highlands',
      topic: 'sahaba r.a',
    },
    {
      slug: 'gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum',
      titleParts: [
        { text: 'Gravity of Talking Bad about the ', highlighted: false },
        { text: 'Şahābā', highlighted: true },
        { text: " Radiyallāhu 'Anhum", highlighted: false },
      ],
      author: 'Mufti Houzeifa Mamoojee',
      metaLabel: '31 Oct · Masjid Muswalla, Highlands',
      topic: 'sahaba r.a',
    },
  ],
  events: [
    {
      slug: 'the-sahaba-radiyyallahu-anhum',
      titleParts: [
        { text: 'The ', highlighted: false },
        { text: 'Sahaba', highlighted: true },
        { text: ' Radiyyallahu Anhum', highlighted: false },
      ],
      metaLabel: '24 – 31 Oct 2026 · Masjid Muswalla, Highlands',
      day: '24',
      month: 'Oct',
    },
  ],
};
