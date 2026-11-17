import { router } from 'expo-router';

import * as engine from '@/features/player/audio-engine';
import {
  beginCloseAfterSwipe,
  closeNowPlaying,
  dismissMiniPlayer,
  finishCloseAfterSwipe,
  openEventFromNowPlaying,
  openNowPlaying,
  openNowPlayingForLoadedLecture,
  showNowPlayingFromDeepLink,
} from '@/features/player/open-now-playing';
import { MINI_EXIT_MS } from '@/features/player/player-motion-config';
import * as motion from '@/features/player/player-surface-motion';
import type { OnMotionFinished } from '@/features/player/player-surface-motion';
import {
  initialPlayerState,
  selectCurrentLecture,
  selectIsMiniPlayerVisible,
  usePlayerStore,
  type NowPlayingPresentation,
} from '@/features/player/player.store';
import { eventSource, latestSource, queueOfThree, searchSource } from '@/test-utils/fixtures';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));
jest.mock('@/features/player/audio-engine', () => ({
  playLecture: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  reloadFailedLecture: jest.fn(),
  stopAndClear: jest.fn(),
}));
// The motion commands only record their calls. Tests finish an animation by calling the
// onFinished they were given.
jest.mock('@/features/player/player-surface-motion', () => ({
  enterFresh: jest.fn(),
  expandFromMini: jest.fn(),
  collapseToMini: jest.fn(),
  dropMini: jest.fn(),
  showNowPlayingWithoutMotion: jest.fn(),
}));

const [first, second] = queueOfThree;
const navigate = jest.mocked(router.navigate);
const back = jest.mocked(router.back);
const playLecture = jest.mocked(engine.playLecture);
const pause = jest.mocked(engine.pause);
const resume = jest.mocked(engine.resume);
const stopAndClear = jest.mocked(engine.stopAndClear);
const reloadFailedLecture = jest.mocked(engine.reloadFailedLecture);
const enterFresh = jest.mocked(motion.enterFresh);
const expandFromMini = jest.mocked(motion.expandFromMini);
const collapseToMini = jest.mocked(motion.collapseToMini);
const dropMini = jest.mocked(motion.dropMini);
const showNowPlayingWithoutMotion = jest.mocked(motion.showNowPlayingWithoutMotion);

function presentation(): NowPlayingPresentation {
  return usePlayerStore.getState().nowPlayingPresentation;
}

function setPresentation(value: NowPlayingPresentation) {
  usePlayerStore.getState().setNowPlayingPresentation(value);
}

// The onFinished the latest call to a motion command received.
function lastOnFinished(command: jest.MockedFunction<(args: { onFinished: OnMotionFinished }) => void>): OnMotionFinished {
  const calls = command.mock.calls;
  return calls[calls.length - 1][0].onFinished;
}

// A session with `first` loaded and paused, the mini player showing.
function loadFirstWithMiniPlayerShowing() {
  usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
  usePlayerStore.getState().applyStatus({
    isPlaying: false,
    isBuffering: false,
    isLoaded: true,
    positionSec: 965,
    durationSec: 2781,
  });
}

const openSecond = { lecture: second, queue: queueOfThree, source: latestSource, resumeIfPaused: false };

beforeEach(() => {
  jest.useFakeTimers();
  usePlayerStore.setState(initialPlayerState);
  jest.resetAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('openNowPlaying', () => {
  it('with nothing loaded: intent, then audio, then the entrance, and no navigation at all', async () => {
    let presentationAtLoad: NowPlayingPresentation | null = null;
    playLecture.mockImplementation(() => {
      presentationAtLoad = presentation();
    });

    await openNowPlaying({ lecture: second, queue: queueOfThree, source: eventSource, resumeIfPaused: false });

    expect(presentationAtLoad).toBe('opening');
    expect(playLecture).toHaveBeenCalledWith(second, queueOfThree, eventSource);
    expect(enterFresh).toHaveBeenCalledTimes(1);
    expect(playLecture.mock.invocationCallOrder[0]).toBeLessThan(enterFresh.mock.invocationCallOrder[0]);
    expect(navigate).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it('the entrance finishing opens Now Playing; a replaced entrance does not', async () => {
    await openNowPlaying(openSecond);

    lastOnFinished(enterFresh)(false);
    expect(presentation()).toBe('opening');

    lastOnFinished(enterFresh)(true);
    expect(presentation()).toBe('open');
  });

  it('the loaded lecture with the bar showing: the bar grows, nothing reloads or pauses', async () => {
    loadFirstWithMiniPlayerShowing();

    await openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: false });

    expect(presentation()).toBe('opening');
    expect(expandFromMini).toHaveBeenCalledTimes(1);
    expect(enterFresh).not.toHaveBeenCalled();
    expect(playLecture).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it('a play button on the loaded, paused lecture also resumes it, once', async () => {
    loadFirstWithMiniPlayerShowing();

    await openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: true });

    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('a switch: the bar drops first, and the new lecture loads only after it has gone', async () => {
    loadFirstWithMiniPlayerShowing();

    const opening = openNowPlaying(openSecond);

    expect(presentation()).toBe('miniLeaving');
    expect(pause).toHaveBeenCalledTimes(1);
    expect(dropMini).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(MINI_EXIT_MS - 1);
    expect(playLecture).not.toHaveBeenCalled();
    expect(enterFresh).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    await opening;
    expect(presentation()).toBe('opening');
    expect(playLecture).toHaveBeenCalledWith(second, queueOfThree, latestSource);
    expect(playLecture.mock.invocationCallOrder[0]).toBeLessThan(enterFresh.mock.invocationCallOrder[0]);
  });

  it('the bar never shows the new lecture during a switch', async () => {
    loadFirstWithMiniPlayerShowing();

    const opening = openNowPlaying(openSecond);
    await jest.advanceTimersByTimeAsync(MINI_EXIT_MS / 2);

    const stateDuringDrop = usePlayerStore.getState();
    expect(selectCurrentLecture(stateDuringDrop)?.slug).toBe(first.slug);
    expect(selectIsMiniPlayerVisible(stateDuringDrop)).toBe(false);

    await jest.advanceTimersByTimeAsync(MINI_EXIT_MS);
    await opening;
  });

  it('from Search: Search leaves before the sheet rises', async () => {
    await openNowPlaying({
      lecture: second,
      queue: [second],
      source: searchSource,
      resumeIfPaused: true,
      leaveSearchFirst: true,
    });

    expect(back).toHaveBeenCalledTimes(1);
    expect(back.mock.invocationCallOrder[0]).toBeLessThan(enterFresh.mock.invocationCallOrder[0]);
  });

  it.each<NowPlayingPresentation>(['miniLeaving', 'opening', 'open', 'closing'])(
    'is ignored while the presentation is %s (one action at a time, double taps)',
    async (busyPresentation) => {
      loadFirstWithMiniPlayerShowing();
      setPresentation(busyPresentation);

      await openNowPlaying(openSecond);

      expect(presentation()).toBe(busyPresentation);
      expect(playLecture).not.toHaveBeenCalled();
      expect(enterFresh).not.toHaveBeenCalled();
      expect(dropMini).not.toHaveBeenCalled();
    },
  );

  it('a double tap opens one sheet', async () => {
    await openNowPlaying(openSecond);
    await openNowPlaying(openSecond);

    expect(enterFresh).toHaveBeenCalledTimes(1);
    expect(playLecture).toHaveBeenCalledTimes(1);
  });

  it('puts the presentation back to closed and rethrows when loading fails', async () => {
    playLecture.mockImplementation(() => {
      throw new Error('load failed');
    });

    await expect(openNowPlaying(openSecond)).rejects.toThrow('load failed');
    expect(presentation()).toBe('closed');
  });
});

describe('openNowPlayingForLoadedLecture (tap the bar)', () => {
  it('grows the bar into Now Playing, no reload', () => {
    loadFirstWithMiniPlayerShowing();

    openNowPlayingForLoadedLecture();

    expect(presentation()).toBe('opening');
    expect(expandFromMini).toHaveBeenCalledTimes(1);
    expect(playLecture).not.toHaveBeenCalled();
  });

  it('retargets a collapse: the collapse finishing late does not close the reopened player', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');
    closeNowPlaying();
    const collapseFinished = lastOnFinished(collapseToMini);

    openNowPlayingForLoadedLecture();
    expect(presentation()).toBe('opening');
    expect(expandFromMini).toHaveBeenCalledTimes(1);

    collapseFinished(false);
    expect(presentation()).toBe('opening');
  });

  it.each<NowPlayingPresentation>(['miniLeaving', 'opening', 'open'])('is ignored while %s', (busyPresentation) => {
    loadFirstWithMiniPlayerShowing();
    setPresentation(busyPresentation);

    openNowPlayingForLoadedLecture();

    expect(presentation()).toBe(busyPresentation);
    expect(expandFromMini).not.toHaveBeenCalled();
  });

  it('does nothing when nothing is loaded', () => {
    openNowPlayingForLoadedLecture();

    expect(presentation()).toBe('closed');
    expect(expandFromMini).not.toHaveBeenCalled();
  });
});

describe('closeNowPlaying (chevron, Android back)', () => {
  it('collapses into the bar, and is closed once the collapse finishes', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    closeNowPlaying();
    expect(presentation()).toBe('closing');
    expect(collapseToMini).toHaveBeenCalledTimes(1);

    lastOnFinished(collapseToMini)(true);
    expect(presentation()).toBe('closed');
    expect(pause).not.toHaveBeenCalled();
  });

  it('retargets an entrance: the entrance finishing afterwards does not reopen it', async () => {
    await openNowPlaying(openSecond);
    const entranceFinished = lastOnFinished(enterFresh);

    closeNowPlaying();
    expect(presentation()).toBe('closing');

    entranceFinished(true);
    expect(presentation()).toBe('closing');
  });

  it.each<NowPlayingPresentation>(['closed', 'miniLeaving', 'closing'])('is ignored while %s', (presentationBefore) => {
    loadFirstWithMiniPlayerShowing();
    setPresentation(presentationBefore);

    closeNowPlaying();

    expect(presentation()).toBe(presentationBefore);
    expect(collapseToMini).not.toHaveBeenCalled();
  });
});

describe('the swipe down on Now Playing', () => {
  it('records closing on release, and closed when the spring finishes', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    beginCloseAfterSwipe();
    expect(presentation()).toBe('closing');
    // The gesture already started the spring: no second animation.
    expect(collapseToMini).not.toHaveBeenCalled();

    finishCloseAfterSwipe(true);
    expect(presentation()).toBe('closed');
  });
});

describe('dismissMiniPlayer (swipe the bar down)', () => {
  it('drops the bar, then stops and clears once it has gone', async () => {
    loadFirstWithMiniPlayerShowing();

    const dismissing = dismissMiniPlayer();
    expect(presentation()).toBe('miniLeaving');
    expect(dropMini).toHaveBeenCalledTimes(1);
    expect(stopAndClear).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(MINI_EXIT_MS);
    await dismissing;
    expect(stopAndClear).toHaveBeenCalledTimes(1);
    expect(presentation()).toBe('closed');
  });

  it('is ignored when the bar is not showing', async () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    await dismissMiniPlayer();

    expect(dropMini).not.toHaveBeenCalled();
    expect(presentation()).toBe('open');
  });
});

describe('openEventFromNowPlaying (the event pill)', () => {
  it('collapses Now Playing into the bar and opens the event underneath', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    openEventFromNowPlaying('the-sahaba-radiyyallahu-anhum');

    expect(presentation()).toBe('closing');
    expect(collapseToMini).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith({
      pathname: '/events/[slug]',
      params: { slug: 'the-sahaba-radiyyallahu-anhum' },
    });
  });

  it('is ignored while Now Playing is not in front', () => {
    loadFirstWithMiniPlayerShowing();

    openEventFromNowPlaying('the-sahaba-radiyyallahu-anhum');

    expect(navigate).not.toHaveBeenCalled();
    expect(collapseToMini).not.toHaveBeenCalled();
  });
});

describe('showNowPlayingFromDeepLink', () => {
  it('opens at once, with no entrance', () => {
    loadFirstWithMiniPlayerShowing();

    showNowPlayingFromDeepLink();

    expect(presentation()).toBe('open');
    expect(showNowPlayingWithoutMotion).toHaveBeenCalledTimes(1);
    expect(enterFresh).not.toHaveBeenCalled();
  });
});

describe('opening a lecture whose audio did not load', () => {
  function failFirst() {
    loadFirstWithMiniPlayerShowing();
    usePlayerStore.getState().reportAudioFailure();
  }

  it('from a list row: grows the bar into Now Playing and loads it again', async () => {
    failFirst();

    await openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: false });

    expect(expandFromMini).toHaveBeenCalledTimes(1);
    expect(reloadFailedLecture).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
    expect(playLecture).not.toHaveBeenCalled();
  });

  it('from the mini player: grows into Now Playing and loads it again', () => {
    failFirst();

    openNowPlayingForLoadedLecture();

    expect(expandFromMini).toHaveBeenCalledTimes(1);
    expect(reloadFailedLecture).toHaveBeenCalledTimes(1);
  });

  it('from the mini player, when the audio is fine: never reloads', () => {
    loadFirstWithMiniPlayerShowing();

    openNowPlayingForLoadedLecture();

    expect(reloadFailedLecture).not.toHaveBeenCalled();
  });
});
