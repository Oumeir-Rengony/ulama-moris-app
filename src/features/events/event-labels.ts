import type { EventSummary } from '@/data/sample';
import { formatVenue } from '@/utils/format-venue';

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
// the data gives it.
export function eventStatsLabel(event: EventSummary): string {
  return `${lectureCountLabel(event.total)} · ${event.duration} · ${event.dateRange}`;
}

// Latest event card: "24 Oct – 31 Oct 2026 · Masjid Muswalla, Highlands". No venue part when the
// event has none.
export function latestEventMetaLabel(event: EventSummary): string {
  if (event.location) {
    return `${event.dateRange} · ${formatVenue(event.location)}`;
  }
  return event.dateRange;
}

// The venue, ready to show, or undefined when the event has none.
export function eventVenueLabel(event: EventSummary): string | undefined {
  if (event.location) {
    return formatVenue(event.location);
  }
  return undefined;
}
