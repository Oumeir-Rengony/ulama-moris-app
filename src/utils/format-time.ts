// Formatting helpers for times and dates (HANDOFF §4.7). One plain function per format.
// The other helpers (minutesLeftLabel, clockLabel, longDateLabel, totalLabel) are added by the
// stages that first need them.

// "35:48" → 2148, "1:02:05" → 3725. Returns null for a missing, empty or invalid value.
export function clockToSeconds(clock: string | undefined): number | null {
  if (clock === undefined || clock.trim() === '') {
    return null;
  }

  const parts = clock.split(':');
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  let totalSeconds = 0;
  for (const part of parts) {
    const isWholeNumber = /^\d+$/.test(part);
    if (!isWholeNumber) {
      return null;
    }
    totalSeconds = totalSeconds * 60 + Number(part);
  }
  return totalSeconds;
}

// 2148 → "36 min". Rounds to the nearest minute.
export function minutesLabel(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-10-31T21:15:00.000+04:00" → "31 Oct".
// Reads the YYYY-MM-DD part of the string directly. `new Date(...)` would convert to the device's
// time zone, which can move the date to the day before or after.
export function shortDateLabel(isoDateTime: string): string {
  const datePart = isoDateTime.slice(0, 10);
  const [, monthText, dayText] = datePart.split('-');

  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  return `${day} ${shortMonthNames[monthIndex]}`;
}
