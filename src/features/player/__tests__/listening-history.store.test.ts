import AsyncStorage from '@react-native-async-storage/async-storage';

import { initialListeningHistoryState, useListeningHistoryStore } from '@/features/player/listening-history.store';

beforeEach(async () => {
  useListeningHistoryStore.setState(initialListeningHistoryState);
  await AsyncStorage.clear();
});

// A lecture as the history keeps it: slug "a" is titled "Lecture a", 10 minutes long.
function playedLecture(slug: string) {
  return { slug, title: `Lecture ${slug}`, duration: '10:00' };
}

async function readStoredJson() {
  const stored = await AsyncStorage.getItem('listening-history');
  if (stored === null) {
    return null;
  }
  return JSON.parse(stored);
}

describe('listening history store', () => {
  it('saveProgress writes one resume point and leaves the others as they are', () => {
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);
    useListeningHistoryStore.getState().saveProgress(playedLecture('b'), 300);
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 150);

    expect(useListeningHistoryStore.getState().progressById).toEqual({ a: 150, b: 300 });
  });

  it('has no lecture for Continue listening before anything is played', () => {
    expect(useListeningHistoryStore.getState().lastPlayedSlug).toBeNull();
  });

  it('remembers the lecture saved most recently, for Continue listening', () => {
    useListeningHistoryStore.getState().saveProgress(playedLecture('b'), 300);
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);

    expect(useListeningHistoryStore.getState().lastPlayedSlug).toBe('a');
  });

  it('markFinished drops the resume point and hides Continue listening', () => {
    useListeningHistoryStore.getState().saveProgress(playedLecture('b'), 300);
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);

    useListeningHistoryStore.getState().markFinished('a');

    expect(useListeningHistoryStore.getState().progressById).toEqual({ b: 300 });
    expect(useListeningHistoryStore.getState().lastPlayedSlug).toBeNull();
  });

  it('markFinished on an older lecture keeps the last played one', () => {
    useListeningHistoryStore.getState().saveProgress(playedLecture('b'), 300);
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);

    useListeningHistoryStore.getState().markFinished('b');

    expect(useListeningHistoryStore.getState().lastPlayedSlug).toBe('a');
  });

  it('persists the resume points and the last played lecture under "listening-history"', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-13T10:00:00Z'));
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);
    jest.useRealTimers();

    const stored = await readStoredJson();
    expect(stored.state).toEqual({
      progressById: { a: 120 },
      lastPlayedSlug: 'a',
      lastPlayedAt: Date.parse('2026-11-13T10:00:00Z'),
      lastPlayedTitle: 'Lecture a',
      lastPlayedDuration: '10:00',
    });
  });

  it('keeps the last played lecture’s title and duration, so reminders need no network', () => {
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);
    useListeningHistoryStore.getState().saveProgress({ slug: 'b', title: 'No length known' }, 30);

    expect(useListeningHistoryStore.getState().lastPlayedTitle).toBe('No length known');
    expect(useListeningHistoryStore.getState().lastPlayedDuration).toBeNull();
  });

  it('remembers when the last played lecture was saved, for the continue listening reminder', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-13T10:00:00Z'));
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);
    jest.useRealTimers();

    expect(useListeningHistoryStore.getState().lastPlayedAt).toBe(Date.parse('2026-11-13T10:00:00Z'));
  });

  it('keeps that time when the same position is saved again (leaving the app while paused)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-13T10:00:00Z'));
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);
    jest.setSystemTime(new Date('2026-11-13T12:00:00Z'));
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);
    jest.useRealTimers();

    expect(useListeningHistoryStore.getState().lastPlayedAt).toBe(Date.parse('2026-11-13T10:00:00Z'));
  });

  it('moves that time when the position moved', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-13T10:00:00Z'));
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);
    jest.setSystemTime(new Date('2026-11-13T12:00:00Z'));
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 180);
    jest.useRealTimers();

    expect(useListeningHistoryStore.getState().lastPlayedAt).toBe(Date.parse('2026-11-13T12:00:00Z'));
  });

  it('forgets that time, title and duration when the last played lecture is finished', () => {
    useListeningHistoryStore.getState().saveProgress(playedLecture('a'), 120);
    useListeningHistoryStore.getState().markFinished('a');

    expect(useListeningHistoryStore.getState().lastPlayedAt).toBeNull();
    expect(useListeningHistoryStore.getState().lastPlayedTitle).toBeNull();
    expect(useListeningHistoryStore.getState().lastPlayedDuration).toBeNull();
  });

  it('reads data saved before the last-played time existed, with no time', async () => {
    await AsyncStorage.setItem(
      'listening-history',
      JSON.stringify({ state: { progressById: { a: 120 }, lastPlayedSlug: 'a' }, version: 0 }),
    );

    await useListeningHistoryStore.persist.rehydrate();

    expect(useListeningHistoryStore.getState().lastPlayedAt).toBeNull();
    expect(useListeningHistoryStore.getState().lastPlayedTitle).toBeNull();
  });

  it('reads them back after a restart', async () => {
    await AsyncStorage.setItem(
      'listening-history',
      JSON.stringify({ state: { progressById: { a: 120 }, lastPlayedSlug: 'a' }, version: 0 }),
    );

    await useListeningHistoryStore.persist.rehydrate();

    expect(useListeningHistoryStore.getState().progressById.a).toBe(120);
    expect(useListeningHistoryStore.getState().lastPlayedSlug).toBe('a');
  });
});
