import type { EventSummary } from './event.types';

export type EventListItem = {
  event: EventSummary;
  // The event's position in the whole list (0, 1, 2 …), not within its year. The date tile
  // colour rotates by this, so the colours keep going across a year boundary.
  position: number;
};

export type EventYearSection = {
  // "2026", or "Other events" for events without a date.
  title: string;
  data: EventListItem[];
};

// The heading for events none of whose lectures has a date, the same as on the website.
export const undatedEventsTitle = 'Other events';

// Groups events into one section per year, for the SectionList. The API already returns them
// newest first, so a new section starts whenever the year changes. Nothing is sorted here.
// Events without a year (the API puts them last) go in a final "Other events" section.
// Pass every loaded page at once: a year that continues on the next page stays one section.
export function groupEventsByYear(allEvents: EventSummary[]): EventYearSection[] {
  const sections: EventYearSection[] = [];
  const undatedItems: EventListItem[] = [];
  let currentSection: EventYearSection | null = null;

  for (let position = 0; position < allEvents.length; position++) {
    const event = allEvents[position];

    if (event.year === undefined) {
      undatedItems.push({ event, position });
      continue;
    }

    const startsNewYear = currentSection === null || currentSection.title !== event.year;
    if (startsNewYear) {
      currentSection = { title: event.year, data: [] };
      sections.push(currentSection);
    }

    currentSection?.data.push({ event, position });
  }

  if (undatedItems.length > 0) {
    sections.push({ title: undatedEventsTitle, data: undatedItems });
  }

  return sections;
}
