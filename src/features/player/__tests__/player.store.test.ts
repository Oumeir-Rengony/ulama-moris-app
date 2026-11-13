import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  initialPlayerState,
  selectActiveLectureSlug,
  selectCurrentLecture,
  selectIsMiniPlayerVisible,
  selectSourceLabel,
  usePlayerStore,
  type MirroredStatus,
  type NowPlayingPresentation,
} from '@/features/player/player.store';
import { eventSource, latestSource, queueOfThree, searchSource } from '@/test-utils/fixtures';

const pausedAndLoaded: MirroredStatus = {
  isPlaying: false,
  isBuffering: false,
  isLoaded: true,
  positionSec: 120,
  durationSec: 2781,
};

function loadSecondLecture() {
  usePlayerStore.getState().startQueue(queueOfThree, 1, eventSource);
  usePlayerStore.getState().applyStatus(pausedAndLoaded);
}

beforeEach(async () => {
  usePlayerStore.setState(initialPlayerState);
  await AsyncStorage.clear();
  jest.mocked(AsyncStorage.setItem).mockClear();
});

describe('player store', () => {
  it('starts with nothing loaded', () => {
    const state = usePlayerStore.getState();
    expect(state.currentIndex).toBeNull();
    expect(state.queue).toEqual([]);
    expect(state.isPlaying).toBe(false);
    expect(selectCurrentLecture(state)).toBeNull();
  });

  it('startQueue keeps the queue in the given order, with the start index and source', () => {
    const reversed = [queueOfThree[2], queueOfThree[0], queueOfThree[1]];
    usePlayerStore.getState().startQueue(reversed, 2, searchSource);

    const state = usePlayerStore.getState();
    expect(state.queue).toEqual(reversed);
    expect(state.currentIndex).toBe(2);
    expect(state.source).toEqual(searchSource);
    expect(selectCurrentLecture(state)).toBe(queueOfThree[1]);
  });

  it('applyStatus copies every mirrored field, and a duration of 0 stays 0', () => {
    usePlayerStore.getState().applyStatus({ ...pausedAndLoaded, isPlaying: true, durationSec: 0 });

    const state = usePlayerStore.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.isLoaded).toBe(true);
    expect(state.positionSec).toBe(120);
    expect(state.durationSec).toBe(0);
  });

  it('never writes to storage, however often the status changes', () => {
    for (let update = 0; update < 100; update++) {
      usePlayerStore.getState().applyStatus({ ...pausedAndLoaded, positionSec: update });
    }
    usePlayerStore.getState().setNowPlayingPresentation('open');
    usePlayerStore.getState().setHasQueueEnded(true);

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

describe('selectSourceLabel', () => {
  it('names each kind of source', () => {
    usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
    expect(selectSourceLabel(usePlayerStore.getState())).toBe('Latest lectures');

    usePlayerStore.getState().startQueue(queueOfThree, 0, eventSource);
    expect(selectSourceLabel(usePlayerStore.getState())).toBe('The Sahaba Radiyyallahu Anhum');

    usePlayerStore.getState().startQueue(queueOfThree, 0, searchSource);
    expect(selectSourceLabel(usePlayerStore.getState())).toBe('“Ṣaḥābā”');
  });
});

describe('selectActiveLectureSlug', () => {
  it('is the loaded lecture while the session is going', () => {
    loadSecondLecture();
    expect(selectActiveLectureSlug(usePlayerStore.getState())).toBe(queueOfThree[1].slug);
  });

  it('is null when nothing is loaded or the queue has ended', () => {
    expect(selectActiveLectureSlug(usePlayerStore.getState())).toBeNull();

    loadSecondLecture();
    usePlayerStore.getState().setHasQueueEnded(true);
    expect(selectActiveLectureSlug(usePlayerStore.getState())).toBeNull();
  });
});

describe('selectIsMiniPlayerVisible', () => {
  it('is visible with a paused lecture loaded and Now Playing closed', () => {
    loadSecondLecture();
    expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(true);
  });

  it('is hidden while the bar drops away and while Now Playing opens, is open or closes', () => {
    loadSecondLecture();
    const presentations: NowPlayingPresentation[] = ['miniLeaving', 'opening', 'open', 'closing'];
    for (const presentation of presentations) {
      usePlayerStore.getState().setNowPlayingPresentation(presentation);
      expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(false);
    }
  });

  it('stays visible while loading, buffering, playing and paused', () => {
    loadSecondLecture();
    const playbackStates: MirroredStatus[] = [
      { ...pausedAndLoaded, isLoaded: false },
      { ...pausedAndLoaded, isBuffering: true },
      { ...pausedAndLoaded, isPlaying: true },
      pausedAndLoaded,
    ];
    for (const status of playbackStates) {
      usePlayerStore.getState().applyStatus(status);
      expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(true);
    }
  });

  it('is hidden when the queue has ended or nothing is loaded', () => {
    loadSecondLecture();
    usePlayerStore.getState().setHasQueueEnded(true);
    expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(false);

    usePlayerStore.getState().setHasQueueEnded(false);
    usePlayerStore.getState().setCurrentIndex(null);
    expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(false);
  });
});
