// TEST ONLY. A stand-in for the expo-notifications module, loaded for every test by jest.setup.ts.
// It keeps the scheduled notifications in memory, so the reminder tests can read what was booked
// without the OS. Names follow the installed expo-notifications types
// (node_modules/expo-notifications/build).

type FakeRequest = {
  identifier: string;
  content: { title: string; body: string; data: Record<string, unknown> };
  trigger: { type: string; date: number; channelId?: string };
};

type FakePermissions = {
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined';
  ios?: { status: number };
};

export const SchedulableTriggerInputTypes = { DATE: 'date' };
export const AndroidImportance = { DEFAULT: 3 };
export const IosAuthorizationStatus = { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3 };

let scheduled: FakeRequest[] = [];
let permissions: FakePermissions = { granted: true, status: 'granted' };

export const requestPermissionsAsync = jest.fn(async () => permissions);
export const setNotificationChannelAsync = jest.fn(async () => null);
export const setNotificationHandler = jest.fn();
export const clearLastNotificationResponse = jest.fn();
export const getLastNotificationResponse = jest.fn(() => null);
export const addNotificationResponseReceivedListener = jest.fn(() => ({ remove: jest.fn() }));

export async function getPermissionsAsync(): Promise<FakePermissions> {
  return permissions;
}

export async function getAllScheduledNotificationsAsync(): Promise<FakeRequest[]> {
  return [...scheduled];
}

export async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  const kept: FakeRequest[] = [];
  for (const request of scheduled) {
    if (request.identifier !== identifier) {
      kept.push(request);
    }
  }
  scheduled = kept;
}

export async function scheduleNotificationAsync(request: FakeRequest): Promise<string> {
  await cancelScheduledNotificationAsync(request.identifier);
  scheduled.push(request);
  return request.identifier;
}

// Test helpers.

export function setFakePermissions(next: FakePermissions): void {
  permissions = next;
}

// A notification that isn't a reminder (to check reminders never cancel other notifications).
export function addOtherScheduledNotification(identifier: string): void {
  scheduled.push({
    identifier,
    content: { title: 'Other', body: '', data: {} },
    trigger: { type: 'date', date: 0 },
  });
}

export function scheduledIdentifiers(): string[] {
  const identifiers: string[] = [];
  for (const request of scheduled) {
    identifiers.push(request.identifier);
  }
  return identifiers;
}

export function scheduledRequests(): FakeRequest[] {
  return [...scheduled];
}

export function resetFakeNotifications(): void {
  scheduled = [];
  permissions = { granted: true, status: 'granted' };
  requestPermissionsAsync.mockClear();
  setNotificationChannelAsync.mockClear();
}
