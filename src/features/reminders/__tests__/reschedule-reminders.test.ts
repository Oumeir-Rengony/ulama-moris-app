import AsyncStorage from '@react-native-async-storage/async-storage';

import { initialListeningHistoryState, useListeningHistoryStore } from '@/features/player/listening-history.store';
import { rescheduleRemindersOnLeave } from '@/features/reminders/reschedule-reminders';
import * as fakeNotifications from '@/test-utils/fake-expo-notifications';

// The lecture as the listening history keeps it (35:48 long). The reminders are built from the
// history alone, with no network.
const SAMPLE_LECTURE = {
  slug: 'gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum',
  title: "Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum",
  duration: '35:48',
};
const SAMPLE_SLUG = SAMPLE_LECTURE.slug;

beforeEach(async () => {
  fakeNotifications.resetFakeNotifications();
  useListeningHistoryStore.setState(initialListeningHistoryState);
  await AsyncStorage.clear();
});

describe('rescheduleRemindersOnLeave', () => {
  it('books the continue listening series for an unfinished lecture', async () => {
    useListeningHistoryStore.getState().saveProgress(SAMPLE_LECTURE, 600);

    await rescheduleRemindersOnLeave();

    const identifiers = fakeNotifications.scheduledIdentifiers();
    expect(identifiers).toHaveLength(10);
    expect(identifiers).not.toContain('reminder-inactive');
  });

  it('books the inactivity reminder once that lecture is finished', async () => {
    useListeningHistoryStore.getState().saveProgress(SAMPLE_LECTURE, 600);
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
