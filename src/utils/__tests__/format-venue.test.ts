import { formatVenue } from '@/utils/format-venue';

describe('formatVenue', () => {
  it('capitalises each word of an all-caps venue', () => {
    expect(formatVenue('MASJID MUSWALLA, HIGHLANDS')).toBe('Masjid Muswalla, Highlands');
  });

  it('leaves a mixed-case venue unchanged, diacritics included', () => {
    expect(formatVenue('Nuʿmān Ibn Thābit, Quatre Bornes')).toBe('Nuʿmān Ibn Thābit, Quatre Bornes');
  });

  it('capitalises a single word', () => {
    expect(formatVenue('JUMMAH')).toBe('Jummah');
  });

  it('returns an empty string unchanged', () => {
    expect(formatVenue('')).toBe('');
  });
});
