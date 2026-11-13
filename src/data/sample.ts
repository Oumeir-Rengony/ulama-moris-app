// Static sample data, shaped like the real API (docs/src/data/sample.ts).
// The first two lectures and the first two events are the real records from the website, kept
// exactly as they are (including the "Ş" spelling and the all-caps venues). Everything marked
// MOCK was added so the designs can be filled: more rows, two years of events, an event without
// a venue, lectures without a duration or a venue, and 2- and 3-line titles.
// Mock lectures reuse the two real recordings' audio URLs, so the player has something to play.

// ---------- Types ----------

// The home filter chips. Not an API field yet; added for the series filter (HANDOFF §4.1).
export type LectureSeries = 'local' | 'guest' | 'islahi-majlis';

// A lecture as it appears in a list (the API's `Lectures` items).
export type LectureSummary = {
  slug: string;
  title: string;
  author: string;
  // ISO date with time and offset: "2026-10-31T21:15:00.000+04:00".
  date: string;
  // Clock string: "35:48", or "1:02:05" once it's an hour or more. Missing when unknown.
  duration?: string;
  // All caps from the API ("MASJID MUSWALLA, HIGHLANDS"). Show it through formatVenue().
  masjid?: string;
  url: string;
  series: LectureSeries;
};

// A lecture's detail record (the API's `Lecture`): the summary plus the detail fields.
export type Lecture = LectureSummary & {
  id: string;
  // The title of the event this lecture belongs to. Missing when it isn't part of an event.
  event?: string;
  // Topic strings ("sahaba r.a"). The first one is the lecture's topic. Empty when it has none.
  category: string[];
};

// An event as it appears in the Events list (the API's `Events` items).
export type EventSummary = {
  slug: string;
  title: string;
  // Number of recorded lectures.
  total: number;
  // Total listening time, already formatted: "2h 34m".
  duration: string;
  // Missing when the event has no single venue (e.g. Jummah).
  location?: string;
  // "24 Oct – 31 Oct 2026", or "9 May 2026" for a one-day event.
  dateRange: string;
  // Long form for the event hero: "24 – 31 October 2026". MOCK field: the API will return it
  // ready-made. Rename it to the API's field name once that is known.
  dateRangeLong: string;
  // The year the event is grouped under in the Events list.
  year: string;
  // Date tile: the data's day and month, shown as they are (the start day).
  day: string;
  month: string;
  // Time of the most recent recording, in milliseconds. Newest first.
  latestTime: number;
};

const sahabaAudioUrl =
  'https://assets.ctfassets.net/n7lbwg9xm90s/7lJFzEb2gn6EnvmH9mBuH/fc731919e30ab5fdf593a29e46499de8/9debee86-94dd-4bb1-90ee-a18f944b00bf.m4a';
const sacrificesAudioUrl =
  'https://assets.ctfassets.net/n7lbwg9xm90s/xtKHdICdGePSFGwWeF6sU/2c2c6bf9726cc1821d7c767dd52a7449/b4e8c60f-d0e4-41b1-a309-3b113785f976.m4a';

const sahabaEventTitle = 'The Sahaba Radiyyallahu Anhum';

// ---------- Lectures (newest first, the order the API returns them) ----------

export const lectures: Lecture[] = [
  {
    id: '1iEGTjX7Rtu1dshU00v5FI',
    title: "Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum",
    slug: 'gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum',
    event: sahabaEventTitle,
    date: '2026-10-31T21:15:00.000+04:00',
    author: 'Mufti Houzeifa Mamoojee',
    duration: '35:48',
    category: ['sahaba r.a'],
    url: sahabaAudioUrl,
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    series: 'local',
  },
  {
    id: 'mock-lecture-02', // MOCK id: the list record had none
    title: "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam",
    slug: 'sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam',
    event: sahabaEventTitle,
    date: '2026-10-31T20:15:00.000+04:00',
    author: 'Mawlana Zyad Ally Quenette',
    duration: '46:21',
    category: ['sahaba r.a'],
    url: sacrificesAudioUrl,
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    series: 'local',
  },
  // MOCK from here on.
  {
    id: 'mock-lecture-03',
    title: 'Mauritius – Islamic Finance Hub',
    slug: 'mauritius-islamic-finance-hub',
    date: '2026-10-30T19:30:00.000+04:00',
    author: 'Mufti Houzeifa Mamoojee',
    duration: '24:51',
    category: ['islamic finance'],
    url: sahabaAudioUrl,
    masjid: 'BELLE ROSE SUNNEE MOSQUE',
    series: 'local',
  },
  {
    id: 'mock-lecture-04',
    title: 'Favours of the Ṣaḥābā Radiyallāhu ’Anhum upon the Ummah',
    slug: 'favours-of-the-sahaba-radiyallahu-anhum-upon-the-ummah',
    event: sahabaEventTitle,
    date: '2026-10-24T21:00:00.000+04:00',
    author: 'Mufti Houzeifa Mamoojee',
    duration: '32:14',
    category: ['sahaba r.a'],
    url: sacrificesAudioUrl,
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    series: 'local',
  },
  {
    id: 'mock-lecture-05',
    // Assumed to be the 4th lecture of the Sahaba event, 2377 s derived from the event total
    // (HANDOFF §6: confirm both).
    title: 'Who were the ṣaḥābā Radiyallāhu ’Anhum',
    slug: 'who-were-the-sahaba-radiyallahu-anhum',
    event: sahabaEventTitle,
    date: '2026-10-24T20:00:00.000+04:00',
    author: 'Mufti Yasin Doomah',
    duration: '39:37',
    category: ['sahaba r.a'],
    url: sahabaAudioUrl,
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    series: 'local',
  },
  {
    id: 'mock-lecture-06',
    // No duration: it wasn't in the screenshots (HANDOFF §6).
    title: 'A Country on Fire: Analysis and Lessons',
    slug: 'a-country-on-fire-analysis-and-lessons',
    date: '2026-10-16T19:30:00.000+04:00',
    author: 'Mufti Houzeifa Mamoojee',
    category: ['current affairs'],
    url: sacrificesAudioUrl,
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    series: 'local',
  },
  {
    id: 'mock-lecture-07',
    // A 3-line title.
    title:
      'The Treaty of Hudaybiyyah: How an Apparent Setback Became a Clear Victory for the Muslims, and Its Lessons for Today',
    slug: 'the-treaty-of-hudaybiyyah-how-an-apparent-setback-became-a-clear-victory',
    date: '2026-10-09T19:30:00.000+04:00',
    author: 'Mawlana Zyad Ally Quenette',
    duration: '51:07',
    category: ['seerah'],
    url: sahabaAudioUrl,
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    series: 'local',
  },
  {
    id: 'mock-lecture-08',
    // No venue, no event and no topic: Now Playing's "no tags" case.
    title: 'Guarding the Tongue in the Age of Social Media',
    slug: 'guarding-the-tongue-in-the-age-of-social-media',
    date: '2026-10-02T19:30:00.000+04:00',
    author: 'Mufti Yasin Doomah',
    duration: '28:40',
    category: [],
    url: sacrificesAudioUrl,
    series: 'local',
  },
  {
    id: 'mock-lecture-09',
    title: 'Rights of Parents in Old Age',
    slug: 'rights-of-parents-in-old-age',
    date: '2026-09-25T19:30:00.000+04:00',
    author: 'Mufti Houzeifa Mamoojee',
    duration: '33:05',
    category: ['akhlaq'],
    url: sahabaAudioUrl,
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    series: 'local',
  },
  {
    id: 'mock-lecture-10',
    title: 'Zakat on Savings, Gold and Business Stock',
    slug: 'zakat-on-savings-gold-and-business-stock',
    date: '2026-09-18T19:30:00.000+04:00',
    author: 'Mufti Houzeifa Mamoojee',
    duration: '41:22',
    category: ['islamic finance'],
    url: sacrificesAudioUrl,
    masjid: 'BELLE ROSE SUNNEE MOSQUE',
    series: 'local',
  },
  {
    id: 'mock-lecture-11',
    // Over an hour, for the "1:02:05" clock format.
    title: 'The Final Sermon: Lessons for Every Muslim',
    slug: 'the-final-sermon-lessons-for-every-muslim',
    date: '2026-09-11T19:30:00.000+04:00',
    author: 'Mawlana Zyad Ally Quenette',
    duration: '1:02:05',
    category: ['seerah'],
    url: sahabaAudioUrl,
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    series: 'local',
  },
  {
    id: 'mock-lecture-12',
    title: 'Patience at the Time of Calamity',
    slug: 'patience-at-the-time-of-calamity',
    date: '2026-09-04T19:30:00.000+04:00',
    author: 'Mufti Yasin Doomah',
    duration: '26:18',
    category: ['akhlaq'],
    url: sacrificesAudioUrl,
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    series: 'local',
  },
];

// ---------- Events (newest first by latestTime) ----------

export const events: EventSummary[] = [
  {
    slug: 'the-sahaba-radiyyallahu-anhum',
    title: sahabaEventTitle,
    total: 4,
    duration: '2h 34m',
    location: 'MASJID MUSWALLA, HIGHLANDS',
    dateRange: '24 Oct – 31 Oct 2026',
    dateRangeLong: '24 – 31 October 2026',
    year: '2026',
    day: '24',
    month: 'Oct',
    latestTime: 1793466900000,
  },
  {
    slug: 'monthly-islahi-majlis-sat-09-may-2026',
    title: 'Monthly Islahi Majlis - Sat 09 May 2026',
    total: 5,
    duration: '1h 19m',
    location: 'Nuʿmān Ibn Thābit, Quatre Bornes',
    dateRange: '9 May 2026',
    dateRangeLong: '9 May 2026',
    year: '2026',
    day: '9',
    month: 'May',
    latestTime: 1778346000000,
  },
  // MOCK from here on.
  {
    slug: 'ramadan-reminders-2026',
    title: 'Ramadan Reminders 2026',
    total: 12,
    duration: '5h 48m',
    location: 'JUMMAH MASJID, PORT LOUIS',
    dateRange: '19 Feb – 18 Mar 2026',
    dateRangeLong: '19 February – 18 March 2026',
    year: '2026',
    day: '19',
    month: 'Feb',
    latestTime: 1773853200000,
  },
  {
    slug: 'monthly-islahi-majlis-sat-10-jan-2026',
    title: 'Monthly Islahi Majlis - Sat 10 Jan 2026',
    total: 4,
    duration: '58m',
    location: 'Nuʿmān Ibn Thābit, Quatre Bornes',
    dateRange: '10 Jan 2026',
    dateRangeLong: '10 January 2026',
    year: '2026',
    day: '10',
    month: 'Jan',
    latestTime: 1768064400000,
  },
  {
    // No single venue, and it spans several years (HANDOFF §4.2).
    slug: 'jummah',
    title: 'Jummah',
    total: 8,
    duration: '3h 25m',
    dateRange: '17 Nov 2023 – 22 Aug 2025',
    dateRangeLong: '17 November 2023 – 22 August 2025',
    year: '2025',
    day: '17',
    month: 'Nov',
    latestTime: 1755853200000,
  },
  {
    slug: 'monthly-islahi-majlis-sat-12-jul-2025',
    title: 'Monthly Islahi Majlis - Sat 12 Jul 2025',
    total: 5,
    duration: '1h 31m',
    location: 'Nuʿmān Ibn Thābit, Quatre Bornes',
    dateRange: '12 Jul 2025',
    dateRangeLong: '12 July 2025',
    year: '2025',
    day: '12',
    month: 'Jul',
    latestTime: 1752339600000,
  },
  {
    slug: 'youth-programme-the-young-muslim-today',
    title: 'Youth Programme: The Young Muslim Today',
    total: 3,
    duration: '1h 47m',
    location: 'BELLE ROSE SUNNEE MOSQUE',
    dateRange: '14 Jun 2025',
    dateRangeLong: '14 June 2025',
    year: '2025',
    day: '14',
    month: 'Jun',
    latestTime: 1749915000000,
  },
  {
    slug: 'preparing-for-hajj-2025',
    title: 'Preparing for Hajj',
    total: 4,
    duration: '2h 5m',
    location: 'MASJID MUSWALLA, HIGHLANDS',
    dateRange: '3 May – 10 May 2025',
    dateRangeLong: '3 – 10 May 2025',
    year: '2025',
    day: '3',
    month: 'May',
    latestTime: 1746896400000,
  },
  {
    slug: 'ramadan-reminders-2025',
    title: 'Ramadan Reminders 2025',
    total: 10,
    duration: '4h 51m',
    location: 'JUMMAH MASJID, PORT LOUIS',
    dateRange: '1 Mar – 29 Mar 2025',
    dateRangeLong: '1 – 29 March 2025',
    year: '2025',
    day: '1',
    month: 'Mar',
    latestTime: 1743267600000,
  },
  {
    slug: 'seerah-conference-2025',
    title: 'Seerah Conference 2025',
    total: 6,
    duration: '4h 12m',
    location: 'MASJID MUSWALLA, HIGHLANDS',
    dateRange: '8 Feb – 9 Feb 2025',
    dateRangeLong: '8 – 9 February 2025',
    year: '2025',
    day: '8',
    month: 'Feb',
    latestTime: 1739120400000,
  },
  {
    slug: 'monthly-islahi-majlis-sat-11-jan-2025',
    title: 'Monthly Islahi Majlis - Sat 11 Jan 2025',
    total: 5,
    duration: '1h 31m',
    location: 'Nuʿmān Ibn Thābit, Quatre Bornes',
    dateRange: '11 Jan 2025',
    dateRangeLong: '11 January 2025',
    year: '2025',
    day: '11',
    month: 'Jan',
    latestTime: 1736614800000,
  },
];

// ---------- Totals (the API returns these; the app never counts) ----------

export const latestLecturesTotal = 81;
export const eventsTotal = 11;

// ---------- Home series filter ----------

export const lectureSeries: { key: LectureSeries; label: string }[] = [
  { key: 'local', label: 'Local' },
  { key: 'guest', label: 'Guest' },
  { key: 'islahi-majlis', label: 'Islāhi Majlis' },
];

// ---------- Topics ----------

// Display labels for the topic strings in `category`.
export const topicLabels: Record<string, string> = {
  'sahaba r.a': 'Ṣaḥābā r.a',
  'islamic finance': 'Islamic finance',
  'current affairs': 'Current affairs',
  seerah: 'Seerah',
  akhlaq: 'Akhlāq',
};

// Every distinct topic, in the order it first appears in the data. A topic's colour is its
// position in this list (catForTopic in src/theme/tokens.ts), so it is the same on every
// screen. Later this list comes from the API.
function buildTopicOrder(allLectures: Lecture[]): string[] {
  const orderedTopics: string[] = [];
  for (const lecture of allLectures) {
    for (const topic of lecture.category) {
      if (!orderedTopics.includes(topic)) {
        orderedTopics.push(topic);
      }
    }
  }
  return orderedTopics;
}

export const topicOrder: string[] = buildTopicOrder(lectures);

// ---------- Search ----------

// Placeholder recent searches per scope. The lectures list is the design's; the events list has
// no design and is made up from event titles. They are not real searches (HANDOFF §6).
export const seedRecentSearches: { lectures: string[]; events: string[] } = {
  lectures: ['Ṣaḥābā', 'Islamic finance', 'Fire', 'Sacrifices', 'Ummah'],
  events: ['Jummah', 'Sahaba', 'Islahi'],
};
