import type { EventSummary } from '@/features/events/event.types';
import type { Lecture } from '@/features/lectures/lecture.types';
import { formatVenue } from '@/utils/format-venue';
import { shortDateLabel } from '@/utils/format-time';

function lectureCountLabel(total: number): string {
  if (total === 1) {
    return '1 lecture';
  }
  return `${total} lectures`;
}

// "4 lectures", for the Latest event card's chip.
export function eventLectureCountLabel(event: EventSummary): string {
  return lectureCountLabel(event.total);
}

// Events row stats: "4 lectures · 2h 34m · 24 Oct – 31 Oct 2026". The date range is shown as
// the data gives it. The duration or the date range is left out when the event has none.
export function eventStatsLabel(event: EventSummary): string {
  const parts: string[] = [lectureCountLabel(event.total)];

  if (event.duration) {
    parts.push(event.duration);
  }

  if (event.dateRange) {
    parts.push(event.dateRange);
  }

  return parts.join(' · ');
}

// Latest event card: "24 Oct – 31 Oct 2026 · Masjid Muswalla, Highlands". The date range or the
// venue is left out when the event has none.
export function latestEventMetaLabel(event: EventSummary): string {
  const parts: string[] = [];

  if (event.dateRange) {
    parts.push(event.dateRange);
  }

  if (event.location) {
    parts.push(formatVenue(event.location));
  }

  return parts.join(' · ');
}

// The venue, ready to show, or undefined when the event has none.
export function eventVenueLabel(event: EventSummary): string | undefined {
  if (event.location) {
    return formatVenue(event.location);
  }
  return undefined;
}

// Event hero chip: "4 recorded lectures".
export function recordedLecturesLabel(event: EventSummary): string {
  if (event.total === 1) {
    return '1 recorded lecture';
  }
  return `${event.total} recorded lectures`;
}

// Event detail row number: 0 → "01", 9 → "10".
export function lectureNumberLabel(index: number): string {
  const number = index + 1;
  if (number < 10) {
    return `0${number}`;
  }
  return `${number}`;
}

// Event detail row meta when the row isn't the active lecture: "31 Oct · 35:48".
// The date or the duration is left out when it's unknown.
export function eventLectureMetaLabel(lecture: Lecture): string {
  const parts: string[] = [];

  if (lecture.date !== undefined) {
    parts.push(shortDateLabel(lecture.date));
  }

  if (lecture.duration) {
    parts.push(lecture.duration);
  }

  return parts.join(' · ');
}

// Event detail row meta for the paused active lecture: "Paused · 16:05 / 46:21".
export function pausedLectureMetaLabel(lecture: Lecture, elapsed: string): string {
  if (lecture.duration) {
    return `Paused · ${elapsed} / ${lecture.duration}`;
  }
  return `Paused · ${elapsed}`;
}

// Event detail row meta for the playing active lecture: "Now playing · 16:05 / 46:21".
export function playingLectureMetaLabel(lecture: Lecture, elapsed: string): string {
  if (lecture.duration) {
    return `Now playing · ${elapsed} / ${lecture.duration}`;
  }
  return `Now playing · ${elapsed}`;
}
