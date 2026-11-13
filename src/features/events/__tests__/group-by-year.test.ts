import { groupEventsByYear, type EventYearSection } from '@/features/events/group-by-year';
import { eventInYear } from '@/test-utils/fixtures';

// "2026: a, b" style summaries, so the expected value reads like the list on screen.
function summarise(sections: EventYearSection[]): string[] {
  const lines: string[] = [];
  for (const section of sections) {
    const slugs: string[] = [];
    for (const item of section.data) {
      slugs.push(item.event.slug);
    }
    lines.push(`${section.title}: ${slugs.join(', ')}`);
  }
  return lines;
}

describe('groupEventsByYear', () => {
  it('starts a new section every time the year changes, keeping API order', () => {
    const events = [eventInYear('a', '2026'), eventInYear('b', '2026'), eventInYear('c', '2025')];
    expect(summarise(groupEventsByYear(events))).toEqual(['2026: a, b', '2025: c']);
  });

  it('numbers each event by its position in the whole list', () => {
    const events = [eventInYear('a', '2026'), eventInYear('b', '2025'), eventInYear('c', '2025')];
    const sections = groupEventsByYear(events);
    expect(sections[1].data[0].position).toBe(1);
    expect(sections[1].data[1].position).toBe(2);
  });

  it('returns no sections for no events', () => {
    expect(groupEventsByYear([])).toEqual([]);
  });

  it('starts a new section for a year that comes back later, without sorting or merging', () => {
    const events = [eventInYear('a', '2026'), eventInYear('b', '2025'), eventInYear('c', '2026')];
    expect(summarise(groupEventsByYear(events))).toEqual(['2026: a', '2025: b', '2026: c']);
  });
});
