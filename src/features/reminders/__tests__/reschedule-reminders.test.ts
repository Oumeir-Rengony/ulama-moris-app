import AsyncStorage from '@react-native-async-storage/async-storage';

import { initialListeningHistoryState, useListeningHistoryStore } from '@/features/player/listening-history.store';
import { rescheduleRemindersOnLeave } from '@/features/reminders/reschedule-reminders';
import * as fakeNotifications from '@/test-utils/fake-expo-notifications';

// A real sample lecture (35:48 long), so the title and length come from the lectures stub.
const SAMPLE_SLUG = 'gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum';

beforeEach(async () => {
  fakeNotifications.resetFakeNotifications();
  useListeningHistoryStore.setState(initialListeningHistoryState);
  await AsyncStorage.clear();
});

describe('rescheduleRemindersOnLeave', () => {
  it('books the continue listening series for an unfinished lecture', async () => {
    useListeningHistoryStore.getState().saveProgress(SAMPLE_SLUG, 600);

    await rescheduleRemindersOnLeave();

    const identifiers = fakeNotifications.scheduledIdentifiers();
    expect(identifiers).toHaveLength(10);
    expect(identifiers).not.toContain('reminder-inactive');
  });

  it('books the inactivity reminder once that lecture is finished', async () => {
    useListeningHistoryStore.getState().saveProgress(SAMPLE_SLUG, 600);
    await rescheduleRemindersOnLeave();

    useListeningHistoryStore.getState().markFinished(SAMPLE_SLUG);
    await rescheduleRemindersOnLeave();

    expect(fakeNotifications.scheduledIdentifiers()).toEqual(['reminder-inactive']);
  });

  it('books the inactivity reminder when nothing was played', async () => {
    await rescheduleRemindersOnLeave();

    expect(fakeNotifications.scheduledIdentifiers()).toEqual(['reminder-inactive']);
  });
});
