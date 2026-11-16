// An event, as the Events list, Event detail and Search use it. events.api.ts builds it from the
// API's JSON. Every date field is computed by the API in Mauritius time and is ready to show.
// A value the API sends as null is left out here (undefined).

export type EventSummary = {
  slug: string;
  title: string;
  // Number of lectures. Can be 0 for an event that has none yet.
  total: number;
  // Total listening time, already formatted: "2h 34m". Missing if a lecture has no duration.
  duration?: string;
  // Missing when the lectures weren't all recorded at the same venue.
  location?: string;
  // "24 Oct – 31 Oct 2026", or "9 May 2026" for a one-day event.
  dateRange?: string;
  // Long form for the event hero: "24 – 31 October 2026".
  dateRangeLong?: string;
  // The year the event is grouped under in the Events list. Missing when no lecture has a date:
  // such events go under "Other events".
  year?: string;
  // Date tile: the start day and month ("24", "Oct").
  day?: string;
  month?: string;
  // Time of the most recent lecture, in milliseconds. 0 when no lecture has a date.
  latestTime: number;
};
