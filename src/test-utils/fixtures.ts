// TEST ONLY. Small hand-written lectures and events, shaped like src/data/sample.ts.
// Each fixture covers one edge case, so a test can say exactly which case it is about.
import type { EventSummary } from '@/features/events/event.types';
import type { Lecture } from '@/features/lectures/lecture.types';

// A complete lecture: duration, venue (all caps, as the API sends it), event and topic.
export const fullLecture: Lecture = {
  id: 'fixture-full',
  slug: 'fixture-full-lecture',
  title: "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam",
  author: 'Mawlana Zyad Ally Quenette',
  date: '2026-10-31T21:15:00.000+04:00',
  duration: '46:21',
  masjid: 'MASJID MUSWALLA, HIGHLANDS',
  url: 'https://example.com/full.m4a',
  series: 'local',
  event: 'The Sahaba Radiyyallahu Anhum',
  category: ['sahaba r.a'],
};

// No duration, no venue, no event and no topic: every optional part is missing.
export const bareLecture: Lecture = {
  id: 'fixture-bare',
  slug: 'fixture-bare-lecture',
  title: 'Guarding the Tongue',
  author: 'Mufti Yasin Doomah',
  date: '2026-10-02T19:00:00.000+04:00',
  url: 'https://example.com/bare.m4a',
  series: 'guest',
  category: [],
};

// Recorded just after midnight in Mauritius (+04:00). In any time zone west of it, this moment
// is still 31 October, so a helper that goes through `new Date(iso)` shows the wrong day.
export const justAfterMidnightLecture: Lecture = {
  ...bareLecture,
  id: 'fixture-midnight',
  slug: 'fixture-midnight-lecture',
  date: '2026-11-01T00:30:00.000+04:00',
};

// Long enough to need three lines.
export const threeLineTitle =
  'The Treaty of Hudaybiyyah: How an Apparent Setback Became a Clear Victory for the Believers and a Lesson for Every Generation';

// Spelled with the dot below (Ṣ, as in the designs) rather than the cedilla (Ş, as in the data).
export const dotBelowTitle = 'Favours of the Ṣaḥābā Radiyallāhu ’Anhum upon the Ummah';

// A complete event with an all-caps venue.
export const fullEvent: EventSummary = {
  slug: 'fixture-full-event',
  title: 'The Sahaba Radiyyallahu Anhum',
  total: 4,
  duration: '2h 34m',
  location: 'MASJID MUSWALLA, HIGHLANDS',
  dateRange: '24 Oct – 31 Oct 2026',
  dateRangeLong: '24 – 31 October 2026',
  year: '2026',
  day: '24',
  month: 'Oct',
  latestTime: 1793466900000,
};

// No venue (like Jummah) and a single lecture.
export const noVenueEvent: EventSummary = {
  slug: 'fixture-no-venue-event',
  title: 'Jummah',
  total: 1,
  duration: '42m',
  dateRange: '17 Nov 2023 – 22 Aug 2025',
  dateRangeLong: '17 November 2023 – 22 August 2025',
  year: '2025',
  day: '22',
  month: 'Aug',
  latestTime: 1755882000000,
};

// Builds an event in the given year, for the grouping tests.
export function eventInYear(slug: string, year: string): EventSummary {
  return { ...fullEvent, slug, title: slug, year };
}

// ---------- Player ----------

function lectureInQueue(position: number): Lecture {
  return {
    ...fullLecture,
    id: `fixture-queue-${position}`,
    slug: `fixture-queue-lecture-${position}`,
    title: `Queue lecture ${position}`,
    url: `https://example.com/queue-${position}.m4a`,
  };
}

// Three lectures with their own audio URLs, in data order.
export const queueOfThree: Lecture[] = [lectureInQueue(1), lectureInQueue(2), lectureInQueue(3)];

export const latestSource = { kind: 'latest' } as const;
export const eventSource = { kind: 'event', eventSlug: fullEvent.slug, eventTitle: fullEvent.title } as const;
export const searchSource = { kind: 'search', query: 'Ṣaḥābā' } as const;
