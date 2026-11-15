import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import { REMINDER_ID_PREFIX, type PlannedReminder } from './reminder-plan';

// Books reminders with the OS. It makes no decisions: it cancels every reminder and books exactly
// the list it is given (from reminder-plan.ts). iOS and Android only; the web build uses
// reminder-scheduler.web.ts, which does nothing.

const ANDROID_CHANNEL_ID = 'reminders';

// Read by the tap handler to know where to go.
export type ReminderNotificationData = {
  openPath: string | null;
};

function isReminder(identifier: string): boolean {
  return identifier.startsWith(REMINDER_ID_PREFIX);
}

// With no handler, expo-notifications shows a notification that arrives while the app is open as a
// banner. A reminder to come back is pointless to someone already in the app, so it is dropped.
export function hideRemindersWhileAppIsOpen(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const shouldShow = !isReminder(notification.request.identifier);
      return {
        shouldShowBanner: shouldShow,
        shouldShowList: shouldShow,
        shouldPlaySound: shouldShow,
        shouldSetBadge: false,
      };
    },
  });
}

async function hasPermission(): Promise<boolean> {
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted) {
    return true;
  }
  // iOS can also grant quietly ("provisional"); those reminders still arrive.
  const iosStatus = permissions.ios?.status;
  return iosStatus === IosAuthorizationStatus.PROVISIONAL;
}

// iOS asks the first time a lecture plays, when the user can see why. Android doesn't ask here:
// the audio engine already asks for the same notification permission on the first play, and two
// prompts at once could collide.
let hasAskedForPermission = false;

export async function askForReminderPermissionOnce(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  if (hasAskedForPermission) {
    return;
  }
  hasAskedForPermission = true;

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'undetermined') {
    return;
  }
  await Notifications.requestPermissionsAsync();
}

// Android 8+ files every notification under a channel, which users can turn off in Settings.
// Without one, expo-notifications uses a generic "Miscellaneous" channel.
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Reminders',
    importance: AndroidImportance.DEFAULT,
  });
}

async function cancelAllReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (isReminder(request.identifier)) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }
}

async function bookReminder(reminder: PlannedReminder): Promise<void> {
  const data: ReminderNotificationData = { openPath: reminder.openPath };
  await Notifications.scheduleNotificationAsync({
    identifier: reminder.id,
    content: {
      title: reminder.title,
      body: reminder.body,
      data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminder.fireAt,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

// Cancels every reminder, then books `reminders`. Cancelling first means two reminder types can
// never be booked together. Without permission it only cancels.
export async function replaceScheduledReminders(reminders: PlannedReminder[]): Promise<void> {
  await cancelAllReminders();

  const isAllowed = await hasPermission();
  if (!isAllowed) {
    return;
  }

  await ensureAndroidChannel();
  for (const reminder of reminders) {
    await bookReminder(reminder);
  }
}
