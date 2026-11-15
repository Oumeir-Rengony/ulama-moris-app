import { isUnfinished, planReminders, type LastListen, type ReminderPlanInput } from '@/features/reminders/reminder-plan';
import { PRODUCTION_REMINDER_TIMINGS, QUICK_TEST_REMINDER_TIMINGS } from '@/features/reminders/reminder-timings';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Monday 20:00, the guide's example timeline.
const mondayEvening = Date.parse('2026-11-16T20:00:00+04:00');

function halfListened(changes: Partial<LastListen> = {}): LastListen {
  return {
    slug: 'sahaba-1',
    title: 'Who were the Sahaba?',
    positionSec: 1000,
    durationSec: 2000,
    listenedAt: mondayEvening,
    ...changes,
  };
}

function planAt(changes: Partial<ReminderPlanInput>) {
  return planReminders({
    now: mondayEvening,
    lastActivityAt: mondayEvening,
    lastListen: null,
    timings: PRODUCTION_REMINDER_TIMINGS,
    ...changes,
  });
}

function idsOf(plan: ReturnType<typeof planReminders>): string[] {
  const ids: string[] = [];
  for (const reminder of plan) {
    ids.push(reminder.id);
  }
  return ids;
}

describe('isUnfinished', () => {
  it('is unfinished partway through', () => {
    expect(isUnfinished(halfListened())).toBe(true);
  });

  it('is not started at 5 seconds or less', () => {
    expect(isUnfinished(halfListened({ positionSec: 5 }))).toBe(false);
  });

  it('counts past 95% as finished', () => {
    expect(isUnfinished(halfListened({ positionSec: 1900 }))).toBe(false);
    expect(isUnfinished(halfListened({ positionSec: 1899 }))).toBe(true);
  });

  it('is unfinished when the length is unknown', () => {
    expect(isUnfinished(halfListened({ durationSec: null }))).toBe(true);
  });
});

describe('planReminders', () => {
  it('scenario 1: half listened → 10 continue reminders, 24 h after the listen, then every 3 days', () => {
    const plan = planAt({ lastListen: halfListened() });

    expect(plan).toHaveLength(10);
    expect(plan[0].fireAt).toBe(mondayEvening + DAY_MS);
    expect(plan[1].fireAt).toBe(mondayEvening + DAY_MS + 3 * DAY_MS);
    expect(plan[9].fireAt).toBe(mondayEvening + DAY_MS + 9 * 3 * DAY_MS);
    expect(idsOf(plan)[0]).toBe('reminder-continue-0');
    expect(idsOf(plan)[9]).toBe('reminder-continue-9');
  });

  it('never books the inactivity reminder together with continue listening', () => {
    const plan = planAt({ lastListen: halfListened() });

    expect(idsOf(plan)).not.toContain('reminder-inactive');
  });

  it('the continue reminder names the lecture and opens the player on it', () => {
    const [first] = planAt({ lastListen: halfListened() });

    expect(first.body).toBe("You're partway through Who were the Sahaba?. Tap to keep listening.");
    expect(first.openPath).toBe('/player?slug=sahaba-1');
  });

  it('scenario 2: finished → only the inactivity reminder, 3 days after the last activity', () => {
    const plan = planAt({ lastListen: halfListened({ positionSec: 2000 }) });

    expect(idsOf(plan)).toEqual(['reminder-inactive']);
    expect(plan[0].fireAt).toBe(mondayEvening + 3 * DAY_MS);
    expect(plan[0].openPath).toBeNull();
  });

  it('scenario 3: nothing played → the inactivity reminder', () => {
    expect(idsOf(planAt({ lastListen: null }))).toEqual(['reminder-inactive']);
  });

  it('scenario 4: an old unfinished lecture whose 24 h has passed → the first reminder a minute from now', () => {
    const now = mondayEvening + 2 * DAY_MS;
    const plan = planAt({ now, lastActivityAt: now, lastListen: halfListened() });

    expect(plan[0].fireAt).toBe(now + 60 * 1000);
    expect(plan[1].fireAt).toBe(now + 60 * 1000 + 3 * DAY_MS);
  });

  it('scenario 6: listened again → the series starts from the new listen', () => {
    const laterListen = mondayEvening + 10 * HOUR_MS;
    const plan = planAt({ now: laterListen, lastListen: halfListened({ listenedAt: laterListen }) });

    expect(plan[0].fireAt).toBe(laterListen + DAY_MS);
  });

  it('scenario 8: a visit with nothing unfinished → inactivity 3 days from that visit', () => {
    const visit = mondayEvening + 2 * DAY_MS;
    const plan = planAt({ now: visit, lastActivityAt: visit });

    expect(plan[0].fireAt).toBe(visit + 3 * DAY_MS);
  });

  it('uses the timings it is given: the quick test set is in minutes', () => {
    const plan = planAt({ lastListen: halfListened(), timings: QUICK_TEST_REMINDER_TIMINGS });

    expect(plan[0].fireAt).toBe(mondayEvening + 60 * 1000);
    expect(plan[1].fireAt).toBe(mondayEvening + 3 * 60 * 1000);
  });
});
