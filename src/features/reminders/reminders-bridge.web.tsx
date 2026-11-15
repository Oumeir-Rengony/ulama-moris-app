// Web has no local reminders, so there is nothing to schedule or tap. Same export as
// reminders-bridge.tsx; keeps expo-notifications out of the web build.
export function RemindersBridge() {
  return null;
}
