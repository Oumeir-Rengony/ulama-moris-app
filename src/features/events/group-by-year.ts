import type { EventSummary } from '@/data/sample';

export type EventListItem = {
  event: EventSummary;
  // The event's position in the whole list (0, 1, 2 …), not within its year. The date tile
  // colour rotates by this, so the colours keep going across a year boundary.
  position: number;
};

export type EventYearSection = {
  // "2026"
  title: string;
  data: EventListItem[];
};

// Groups events into one section per year, for the SectionList. The API already returns them
// newest first, so a new section starts whenever the year changes. Nothing is sorted here.
export function groupEventsByYear(allEvents: EventSummary[]): EventYearSection[] {
  const sections: EventYearSection[] = [];
  let currentSection: EventYearSection | null = null;

  for (let position = 0; position < allEvents.length; position++) {
    const event = allEvents[position];

    const startsNewYear = currentSection === null || currentSection.title !== event.year;
    if (startsNewYear) {
      currentSection = { title: event.year, data: [] };
      sections.push(currentSection);
    }

    currentSection?.data.push({ event, position });
  }

  return sections;
}
