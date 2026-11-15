import type { ReminderTimings } from './reminder-timings';

// The decision logic for reminders: which ones to book, when, and what they say.
// Pure: it never talks to expo-notifications. reminder-scheduler.ts books whatever this returns,
// so these rules can change without touching how notifications are scheduled.

// Every reminder ID starts with this, so the scheduler can cancel them all without knowing
// how many there are.
export const REMINDER_ID_PREFIX = 'reminder-';

export type PlannedReminder = {
  // Fixed, so booking again replaces instead of duplicating.
  id: string;
  fireAt: number;
  title: string;
  body: string;
  // Where a tap takes the user, or null to just open the app.
  openPath: string | null;
};

// The lecture played most recently, as far as reminders need it.
export type LastListen = {
  slug: string;
  title: string;
  positionSec: number;
  // null when the lecture's length is unknown.
  durationSec: number | null;
  listenedAt: number;
};

export type ReminderPlanInput = {
  now: number;
  // The last time the user used the app (left it).
  lastActivityAt: number;
  lastListen: LastListen | null;
  timings: ReminderTimings;
};

// Played less than this is "not really started" and gets no continue reminder.
const MINIMUM_LISTENED_SEC = 5;
// Played past this share counts as finished.
const FINISHED_SHARE = 0.95;

export function isUnfinished(listen: LastListen): boolean {
  if (listen.positionSec <= MINIMUM_LISTENED_SEC) {
    return false;
  }
  if (listen.durationSec === null || listen.durationSec <= 0) {
    return true;
  }
  const playedShare = listen.positionSec / listen.durationSec;
  return playedShare < FINISHED_SHARE;
}

function notBefore(fireAt: number, earliest: number): number {
  if (fireAt < earliest) {
    return earliest;
  }
  return fireAt;
}

function planContinueListening(listen: LastListen, input: ReminderPlanInput): PlannedReminder[] {
  const { timings } = input;
  const earliest = input.now + timings.minimumLeadMs;
  const firstFireAt = notBefore(listen.listenedAt + timings.continueFirstDelayMs, earliest);

  const reminders: PlannedReminder[] = [];
  for (let index = 0; index < timings.continueCount; index++) {
    reminders.push({
      id: `${REMINDER_ID_PREFIX}continue-${index}`,
      fireAt: firstFireAt + index * timings.continueRepeatMs,
      title: 'Continue listening',
      body: `You're partway through ${listen.title}. Tap to keep listening.`,
      openPath: `/player?slug=${encodeURIComponent(listen.slug)}`,
    });
  }
  return reminders;
}

function planInactivity(input: ReminderPlanInput): PlannedReminder[] {
  const earliest = input.now + input.timings.minimumLeadMs;
  const fireAt = notBefore(input.lastActivityAt + input.timings.inactivityDelayMs, earliest);

  return [
    {
      id: `${REMINDER_ID_PREFIX}inactive`,
      fireAt,
      title: 'Ulama Moris',
      body: 'New things to listen to are waiting for you.',
      openPath: null,
    },
  ];
}

// One type at a time: an unfinished lecture gets the continue listening series and nothing
// else; otherwise the inactivity reminder.
export function planReminders(input: ReminderPlanInput): PlannedReminder[] {
  const listen = input.lastListen;
  if (listen !== null && isUnfinished(listen)) {
    return planContinueListening(listen, input);
  }
  return planInactivity(input);
}
