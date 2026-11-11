// Formatting helpers for times and dates (HANDOFF §4.7). One plain function per format.
// The other helpers (minutesLeftLabel, clockLabel, totalLabel) are added by the stages that
// first need them. Month and weekday names are written out here instead of using
// toLocaleDateString, so the output is the same in every device language.

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
const longMonthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
// In the order JavaScript's getDay() counts them: 0 is Sunday.
const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type DateParts = {
  year: number;
  // 1 to 12.
  month: number;
  day: number;
};

// Reads the YYYY-MM-DD part of the string directly. `new Date(isoString)` would convert to the
// device's time zone, which can move the date to the day before or after.
function readDateParts(isoDateTime: string): DateParts {
  const datePart = isoDateTime.slice(0, 10);
  const [yearText, monthText, dayText] = datePart.split('-');
  return { year: Number(yearText), month: Number(monthText), day: Number(dayText) };
}

// "2026-10-31T21:15:00.000+04:00" → "31 Oct".
export function shortDateLabel(isoDateTime: string): string {
  const { month, day } = readDateParts(isoDateTime);
  return `${day} ${shortMonthNames[month - 1]}`;
}

// "2026-10-31T21:15:00.000+04:00" → "Saturday, 31 October 2026".
// The weekday comes from a LOCAL date built from the parts, so it matches the day in the string
// whatever the device's time zone.
export function longDateLabel(isoDateTime: string): string {
  const { year, month, day } = readDateParts(isoDateTime);
  const localDate = new Date(year, month - 1, day);
  const weekday = weekdayNames[localDate.getDay()];
  return `${weekday}, ${day} ${longMonthNames[month - 1]} ${year}`;
}
