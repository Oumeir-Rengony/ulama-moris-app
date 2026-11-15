import type { PlannedReminder } from './reminder-plan';

// Web has no local reminders. Same exports as reminder-scheduler.ts, doing nothing, so the web
// build never loads expo-notifications (which warns about push tokens on web as soon as it loads).

export type ReminderNotificationData = {
  openPath: string | null;
};

export function hideRemindersWhileAppIsOpen(): void {}

export async function askForReminderPermissionOnce(): Promise<void> {}

export async function replaceScheduledReminders(_reminders: PlannedReminder[]): Promise<void> {}
