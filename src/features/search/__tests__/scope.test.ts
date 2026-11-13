import { parseSearchScope } from '@/features/search/scope';

describe('parseSearchScope', () => {
  it('reads "events" as the events scope', () => {
    expect(parseSearchScope('events')).toBe('events');
  });

  it('reads "lectures" as the lectures scope', () => {
    expect(parseSearchScope('lectures')).toBe('lectures');
  });

  it('falls back to lectures for a missing or unknown value', () => {
    expect(parseSearchScope(undefined)).toBe('lectures');
    expect(parseSearchScope('other')).toBe('lectures');
  });

  it('falls back to lectures when the param is repeated (an array)', () => {
    expect(parseSearchScope(['events', 'lectures'])).toBe('lectures');
  });
});
