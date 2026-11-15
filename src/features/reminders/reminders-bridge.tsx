import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { usePlayerStore } from '@/features/player/player.store';

import {
  askForReminderPermissionOnce,
  hideRemindersWhileAppIsOpen,
  type ReminderNotificationData,
} from './reminder-scheduler';
import { rescheduleRemindersOnLeave } from './reschedule-reminders';

function logPermissionError(error: unknown): void {
  console.error('Could not ask for permission to send reminders.', error);
}

function readOpenPath(response: Notifications.NotificationResponse): string | null {
  const data = response.notification.request.content.data as Partial<ReminderNotificationData> | undefined;
  if (data === undefined) {
    return null;
  }
  if (typeof data.openPath !== 'string') {
    return null;
  }
  return data.openPath;
}

function openReminder(response: Notifications.NotificationResponse): void {
  const openPath = readOpenPath(response);
  // The inactivity reminder only opens the app, which the OS has already done.
  if (openPath !== null) {
    router.push(openPath as Href);
  }
  // Otherwise the same tap would be handled again on the next launch.
  Notifications.clearLastNotificationResponse();
}

// iOS and Android only; the web build uses reminders-bridge.web.tsx, which renders nothing.
// Mounted once in the root layout, after PlayerStatusBridge: both listen for the app leaving, and
// the bridge's listener (registered first, so called first) saves the resume point this one plans
// the reminders from. Renders nothing.
export function RemindersBridge() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  // The user is leaving: rebuild the schedule once for the whole visit.
  useEffect(() => {
    hideRemindersWhileAppIsOpen();

    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'background') {
        rescheduleRemindersOnLeave();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // Taps: one that launched the app, and any while it runs.
  useEffect(() => {
    const launchResponse = Notifications.getLastNotificationResponse();
    if (launchResponse !== null) {
      openReminder(launchResponse);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(openReminder);
    return () => {
      subscription.remove();
    };
  }, []);

  // The first play is when asking for permission makes sense to the user.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    askForReminderPermissionOnce().catch(logPermissionError);
  }, [isPlaying]);

  return null;
}
