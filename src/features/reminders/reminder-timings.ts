// How long the reminders wait. The decision logic (reminder-plan.ts) receives one of these sets,
// so a test can pass its own and nothing else changes.

export type ReminderTimings = {
  // From the last listen to the first continue listening reminder.
  continueFirstDelayMs: number;
  // Between two continue listening reminders.
  continueRepeatMs: number;
  // How many continue listening reminders are booked at once. Local notifications can't run
  // code when they fire, so the repeats are booked in advance (iOS allows 64 pending).
  continueCount: number;
  // From the last activity to the inactivity reminder.
  inactivityDelayMs: number;
  // A reminder whose time has already passed is sent this long from now instead.
  minimumLeadMs: number;
};

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const PRODUCTION_REMINDER_TIMINGS: ReminderTimings = {
  continueFirstDelayMs: 24 * HOUR_MS,
  continueRepeatMs: 3 * DAY_MS,
  continueCount: 10,
  inactivityDelayMs: 3 * DAY_MS,
  minimumLeadMs: 1 * MINUTE_MS,
};

// The same rules in minutes, so a full series can be watched in one sitting.
export const QUICK_TEST_REMINDER_TIMINGS: ReminderTimings = {
  continueFirstDelayMs: 1 * MINUTE_MS,
  continueRepeatMs: 2 * MINUTE_MS,
  continueCount: 10,
  inactivityDelayMs: 3 * MINUTE_MS,
  minimumLeadMs: 10 * SECOND_MS,
};

// Development builds use the quick timings; release builds use the real ones.
// TODO(before release): confirm testers of preview builds should get the real timings too.
export const ACTIVE_REMINDER_TIMINGS: ReminderTimings = __DEV__
  ? QUICK_TEST_REMINDER_TIMINGS
  : PRODUCTION_REMINDER_TIMINGS;
