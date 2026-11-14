import AsyncStorage from '@react-native-async-storage/async-storage';

import { initialListeningHistoryState, useListeningHistoryStore } from '@/features/player/listening-history.store';

beforeEach(async () => {
  useListeningHistoryStore.setState(initialListeningHistoryState);
  await AsyncStorage.clear();
});

async function readStoredJson() {
  const stored = await AsyncStorage.getItem('listening-history');
  if (stored === null) {
    return null;
  }
  return JSON.parse(stored);
}

describe('listening history store', () => {
  it('saveProgress writes one resume point and leaves the others as they are', () => {
    useListeningHistoryStore.getState().saveProgress('a', 120);
    useListeningHistoryStore.getState().saveProgress('b', 300);
    useListeningHistoryStore.getState().saveProgress('a', 150);

    expect(useListeningHistoryStore.getState().progressById).toEqual({ a: 150, b: 300 });
  });

  it('has no lecture for Continue listening before anything is played', () => {
    expect(useListeningHistoryStore.getState().lastPlayedSlug).toBeNull();
  });

  it('remembers the lecture saved most recently, for Continue listening', () => {
    useListeningHistoryStore.getState().saveProgress('b', 300);
    useListeningHistoryStore.getState().saveProgress('a', 120);

    expect(useListeningHistoryStore.getState().lastPlayedSlug).toBe('a');
  });

  it('markFinished drops the resume point and hides Continue listening', () => {
    useListeningHistoryStore.getState().saveProgress('b', 300);
    useListeningHistoryStore.getState().saveProgress('a', 120);

    useListeningHistoryStore.getState().markFinished('a');

    expect(useListeningHistoryStore.getState().progressById).toEqual({ b: 300 });
    expect(useListeningHistoryStore.getState().lastPlayedSlug).toBeNull();
  });

  it('markFinished on an older lecture keeps the last played one', () => {
    useListeningHistoryStore.getState().saveProgress('b', 300);
    useListeningHistoryStore.getState().saveProgress('a', 120);

    useListeningHistoryStore.getState().markFinished('b');

    expect(useListeningHistoryStore.getState().lastPlayedSlug).toBe('a');
  });

  it('persists the resume points and the last played lecture under "listening-history"', async () => {
    useListeningHistoryStore.getState().saveProgress('a', 120);

    const stored = await readStoredJson();
    expect(stored.state).toEqual({ progressById: { a: 120 }, lastPlayedSlug: 'a' });
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
