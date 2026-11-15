import type { PlannedReminder } from '@/features/reminders/reminder-plan';
import { replaceScheduledReminders } from '@/features/reminders/reminder-scheduler';
import * as fakeNotifications from '@/test-utils/fake-expo-notifications';

function reminder(id: string, fireAt: number): PlannedReminder {
  return { id, fireAt, title: 'Title', body: 'Body', openPath: '/player?slug=a' };
}

beforeEach(() => {
  fakeNotifications.resetFakeNotifications();
});

describe('replaceScheduledReminders', () => {
  it('books exactly the reminders it is given, at their times, with where a tap goes', async () => {
    await replaceScheduledReminders([reminder('reminder-continue-0', 1000), reminder('reminder-continue-1', 2000)]);

    const requests = fakeNotifications.scheduledRequests();
    expect(fakeNotifications.scheduledIdentifiers()).toEqual(['reminder-continue-0', 'reminder-continue-1']);
    expect(requests[0].trigger.date).toBe(1000);
    expect(requests[0].content.data).toEqual({ openPath: '/player?slug=a' });
  });

  it('cancels the reminders booked before, so two types are never booked together', async () => {
    await replaceScheduledReminders([reminder('reminder-continue-0', 1000), reminder('reminder-continue-1', 2000)]);
    await replaceScheduledReminders([reminder('reminder-inactive', 5000)]);

    expect(fakeNotifications.scheduledIdentifiers()).toEqual(['reminder-inactive']);
  });

  it('leaves notifications that are not reminders alone', async () => {
    fakeNotifications.addOtherScheduledNotification('something-else');

    await replaceScheduledReminders([reminder('reminder-inactive', 5000)]);

    expect(fakeNotifications.scheduledIdentifiers()).toEqual(['something-else', 'reminder-inactive']);
  });

  it('without permission, only cancels', async () => {
    await replaceScheduledReminders([reminder('reminder-inactive', 5000)]);
    fakeNotifications.setFakePermissions({ granted: false, status: 'denied' });

    await replaceScheduledReminders([reminder('reminder-continue-0', 1000)]);

    expect(fakeNotifications.scheduledIdentifiers()).toEqual([]);
  });
});
