import {
  clockLabel,
  clockToSeconds,
  longDateLabel,
  minutesLabel,
  minutesLeftLabel,
  shortDateLabel,
} from '@/utils/format-time';

// The data's dates are in Mauritius time (+04:00). `npm test` runs in Los Angeles time, far to
// the west, so a helper that converts through `new Date(isoString)` lands on the wrong day and
// the date tests below fail.
describe('test time zone', () => {
  it('is far from +04:00 (run the tests with `npm test`, which sets TZ)', () => {
    const justAfterMidnightInMauritius = new Date('2026-11-01T00:30:00.000+04:00');
    expect(justAfterMidnightInMauritius.getDate()).not.toBe(1);
  });
});

describe('clockToSeconds', () => {
  it('reads minutes and seconds', () => {
    expect(clockToSeconds('35:48')).toBe(2148);
  });

  it('reads hours, minutes and seconds', () => {
    expect(clockToSeconds('1:02:05')).toBe(3725);
  });

  it('returns null for a missing or empty value', () => {
    expect(clockToSeconds(undefined)).toBeNull();
    expect(clockToSeconds('')).toBeNull();
    expect(clockToSeconds('   ')).toBeNull();
  });

  it('returns null for text that is not a clock', () => {
    expect(clockToSeconds('abc')).toBeNull();
    expect(clockToSeconds('12')).toBeNull();
    expect(clockToSeconds('1:2:3:4')).toBeNull();
    expect(clockToSeconds('3a:10')).toBeNull();
  });
});

describe('minutesLabel', () => {
  it('rounds to the nearest minute', () => {
    expect(minutesLabel(2148)).toBe('36 min');
    expect(minutesLabel(89)).toBe('1 min');
  });

  it('rounds exactly half a minute up', () => {
    expect(minutesLabel(30)).toBe('1 min');
  });
});

describe('shortDateLabel', () => {
  it('shows the day and short month', () => {
    expect(shortDateLabel('2026-10-31T21:15:00.000+04:00')).toBe('31 Oct');
  });

  it('keeps the date from the string, not the device time zone', () => {
    expect(shortDateLabel('2026-11-01T00:30:00.000+04:00')).toBe('1 Nov');
  });
});

describe('longDateLabel', () => {
  it('shows the weekday, day, month and year', () => {
    expect(longDateLabel('2026-10-31T21:15:00.000+04:00')).toBe('Saturday, 31 October 2026');
  });

  it('keeps its own weekday just after midnight +04:00', () => {
    expect(longDateLabel('2026-11-01T00:30:00.000+04:00')).toBe('Sunday, 1 November 2026');
  });
});

describe('minutesLeftLabel', () => {
  it('rounds up', () => {
    // 46:21 − 16:05 = 1816 s = 30.3 min.
    expect(minutesLeftLabel(1816)).toBe('31 min left');
    expect(minutesLeftLabel(5)).toBe('1 min left');
  });

  it('reads 0 at the end, and never goes below 0', () => {
    expect(minutesLeftLabel(0)).toBe('0 min left');
    expect(minutesLeftLabel(-20)).toBe('0 min left');
  });
});

describe('clockLabel', () => {
  it('shows minutes and two-digit seconds under an hour', () => {
    expect(clockLabel(965)).toBe('16:05');
    expect(clockLabel(2781)).toBe('46:21');
    expect(clockLabel(0)).toBe('0:00');
  });

  it('adds hours from one hour', () => {
    expect(clockLabel(3725)).toBe('1:02:05');
  });

  it('drops the fraction of a second', () => {
    expect(clockLabel(965.9)).toBe('16:05');
  });

  it('reads 0:00 for a negative or missing value', () => {
    expect(clockLabel(-3)).toBe('0:00');
    expect(clockLabel(Number.NaN)).toBe('0:00');
  });
});
