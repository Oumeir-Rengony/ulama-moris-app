import { AppState } from 'react-native';

import { useListeningHistoryStore } from '@/features/player/listening-history.store';
import { clockToSeconds } from '@/utils/format-time';

import { planReminders, type LastListen } from './reminder-plan';
import { replaceScheduledReminders } from './reminder-scheduler';
import { ACTIVE_REMINDER_TIMINGS } from './reminder-timings';

// Connects the decision logic to the scheduler: reads the listening history, asks
// reminder-plan.ts what to book, and hands that to reminder-scheduler.ts.
//
// The schedule is rebuilt when the user leaves the app, and when a pause or a finish happens
// while the app is in the background (the lock screen), because that may be the last chance.
// While the app is open, pauses and finishes only save the playback state.

// The last time the user used the app. Updated when they leave it.
let lastActivityAt = Date.now();

// Rebuilds run one after another, so fast pause/play taps in the background can't interleave
// a cancel with another rebuild's bookings.
let rebuildQueue: Promise<void> = Promise.resolve();

// Everything comes from the saved listening history, so this works offline.
function readLastListen(): LastListen | null {
  const history = useListeningHistoryStore.getState();
  const slug = history.lastPlayedSlug;
  if (slug === null) {
    return null;
  }

  // Saved before the title was kept: there's nothing to name in the reminder, so it counts as
  // no last listen (the inactivity reminder is booked instead).
  const title = history.lastPlayedTitle;
  if (title === null) {
    return null;
  }

  let listenedAt = history.lastPlayedAt;
  // Saved before this field existed: count the last listen as now.
  if (listenedAt === null) {
    listenedAt = Date.now();
  }

  return {
    slug,
    title,
    positionSec: history.progressById[slug] ?? 0,
    durationSec: clockToSeconds(history.lastPlayedDuration ?? undefined),
    listenedAt,
  };
}

async function rebuildReminders(): Promise<void> {
  const lastListen = readLastListen();
  const reminders = planReminders({
    now: Date.now(),
    lastActivityAt,
    lastListen,
    timings: ACTIVE_REMINDER_TIMINGS,
  });
  await replaceScheduledReminders(reminders);
}

function logRebuildError(error: unknown): void {
  console.error('Could not schedule the reminder notifications.', error);
}

export function rescheduleReminders(): Promise<void> {
  rebuildQueue = rebuildQueue.then(rebuildReminders).catch(logRebuildError);
  return rebuildQueue;
}

// The user is leaving the app: this is their last activity.
export function rescheduleRemindersOnLeave(): Promise<void> {
  lastActivityAt = Date.now();
  return rescheduleReminders();
}

// For a pause or a finish. Only rebuilds when the app isn't in front; while it is, leaving the
// app rebuilds once for the whole visit.
export function rescheduleRemindersIfInBackground(): void {
  if (AppState.currentState === 'active') {
    return;
  }
  rescheduleReminders();
}
