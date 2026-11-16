// A lecture, as the app uses it everywhere: list rows, Now Playing, the player queue.
// lectures.api.ts builds it from the API's JSON. The API sends a missing value as null; here it
// is left out (undefined), so components can take it as an optional prop.

// The Home series chips. The same values the API's `type` filter takes.
export type LectureSeries = 'local' | 'guest' | 'islahi-majlis';

export type Lecture = {
  id: string;
  // Identifies the lecture everywhere: resume points, Continue listening, deep links, the queue.
  slug: string;
  title: string;
  // The speaker. Missing on a few older lectures: the author line is hidden then.
  author?: string;
  // ISO date with time and offset: "2026-10-31T21:15:00.000+04:00". Missing when unknown.
  date?: string;
  // Clock string as entered by editors: "35:48", or "1:02:05". Missing when unknown.
  duration?: string;
  // The venue as entered ("MASJID MUSWALLA, HIGHLANDS"). Show it through formatVenue().
  masjid?: string;
  // The audio file.
  url: string;
  series?: LectureSeries;
  // The title of the event this lecture belongs to, and that event's slug for the event pill.
  event?: string;
  eventSlug?: string;
  // Topic strings, shown as they are ("Gaza", "sahaba r.a"). The first one is the lecture's
  // topic. Empty when it has none.
  category: string[];
};
