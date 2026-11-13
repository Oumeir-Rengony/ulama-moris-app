import {
  lectureResultMetaLabel,
  noResultsMessage,
  noResultsTitle,
  resultsHeadingLabel,
  searchPlaceholder,
} from '@/features/search/search-labels';
import { bareLecture, fullLecture } from '@/test-utils/fixtures';

describe('searchPlaceholder', () => {
  it('has one placeholder per scope', () => {
    expect(searchPlaceholder('lectures')).toBe('Search by topic');
    expect(searchPlaceholder('events')).toBe('Search events by name');
  });
});

describe('resultsHeadingLabel', () => {
  it('uses the singular for one result', () => {
    expect(resultsHeadingLabel('lectures', 1)).toBe('1 lecture found');
    expect(resultsHeadingLabel('events', 1)).toBe('1 event found');
  });

  it('uses the plural for several results', () => {
    expect(resultsHeadingLabel('lectures', 3)).toBe('3 lectures found');
    expect(resultsHeadingLabel('events', 2)).toBe('2 events found');
  });
});

describe('no-results card', () => {
  it('quotes the query in the title', () => {
    expect(noResultsTitle('zzz')).toBe('No results for “zzz”');
  });

  it('suggests another title for each scope', () => {
    expect(noResultsMessage('lectures')).toBe('Try another lecture title.');
    expect(noResultsMessage('events')).toBe('Try another event title.');
  });
});

describe('lectureResultMetaLabel', () => {
  it('shows the date and formatted venue', () => {
    expect(lectureResultMetaLabel(fullLecture)).toBe('31 Oct · Masjid Muswalla, Highlands');
  });

  it('shows only the date when there is no venue', () => {
    expect(lectureResultMetaLabel(bareLecture)).toBe('2 Oct');
  });
});
