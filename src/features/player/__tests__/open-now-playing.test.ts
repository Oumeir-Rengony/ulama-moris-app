import { router } from 'expo-router';

import * as engine from '@/features/player/audio-engine';
import {
  closeNowPlaying,
  dismissMiniPlayer,
  handlePanelReleased,
  openEventFromNowPlaying,
  openNowPlaying,
  openNowPlayingForLoadedLecture,
  showNowPlayingFromDeepLink,
} from '@/features/player/open-now-playing';
import {
  initialPlayerState,
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
  resume: jest.fn(),
  reloadFailedLecture: jest.fn(),
  stopAndClear: jest.fn(),
}));

const [first, second] = queueOfThree;
const navigate = jest.mocked(router.navigate);
const back = jest.mocked(router.back);
const playLecture = jest.mocked(engine.playLecture);
const resume = jest.mocked(engine.resume);
const stopAndClear = jest.mocked(engine.stopAndClear);
const reloadFailedLecture = jest.mocked(engine.reloadFailedLecture);

function presentation(): NowPlayingPresentation {
  return usePlayerStore.getState().nowPlayingPresentation;
}

function setPresentation(value: NowPlayingPresentation) {
  usePlayerStore.getState().setNowPlayingPresentation(value);
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
  usePlayerStore.setState(initialPlayerState);
  jest.resetAllMocks();
});

describe('openNowPlaying', () => {
  it('with nothing loaded: the intent is recorded before the audio loads, and nothing navigates', () => {
    let presentationAtLoad: NowPlayingPresentation | null = null;
    playLecture.mockImplementation(() => {
      presentationAtLoad = presentation();
    });

    openNowPlaying({ lecture: second, queue: queueOfThree, source: eventSource, resumeIfPaused: false });

    expect(presentationAtLoad).toBe('open');
    expect(presentation()).toBe('open');
    expect(playLecture).toHaveBeenCalledWith(second, queueOfThree, eventSource);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('the loaded lecture with the bar showing: opens, nothing reloads or resumes', () => {
    loadFirstWithMiniPlayerShowing();

    openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: false });

    expect(presentation()).toBe('open');
    expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(false);
    expect(playLecture).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it('a play button on the loaded, paused lecture also resumes it, once', () => {
    loadFirstWithMiniPlayerShowing();

    openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: true });

    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('another lecture while the bar shows: switches the audio and opens at once, nothing stops', () => {
    loadFirstWithMiniPlayerShowing();

    openNowPlaying(openSecond);

    expect(presentation()).toBe('open');
    expect(playLecture).toHaveBeenCalledWith(second, queueOfThree, latestSource);
    expect(stopAndClear).not.toHaveBeenCalled();
  });

  it('from Search: Search leaves before the presentation changes', () => {
    let presentationAtBack: NowPlayingPresentation | null = null;
    back.mockImplementation(() => {
      presentationAtBack = presentation();
    });

    openNowPlaying({
      lecture: second,
      queue: [second],
      source: searchSource,
      resumeIfPaused: true,
      leaveSearchFirst: true,
    });

    expect(back).toHaveBeenCalledTimes(1);
    expect(presentationAtBack).toBe('closed');
    expect(presentation()).toBe('open');
  });

  it('a double tap opens one Now Playing', () => {
    openNowPlaying(openSecond);
    openNowPlaying(openSecond);

    expect(playLecture).toHaveBeenCalledTimes(1);
  });

  it('puts the presentation back to closed and rethrows when loading fails', () => {
    playLecture.mockImplementation(() => {
      throw new Error('load failed');
    });

    expect(() => openNowPlaying(openSecond)).toThrow('load failed');
    expect(presentation()).toBe('closed');
  });
});

describe('openNowPlayingForLoadedLecture (tap the bar)', () => {
  it('opens Now Playing on the loaded lecture, no reload', () => {
    loadFirstWithMiniPlayerShowing();

    openNowPlayingForLoadedLecture();

    expect(presentation()).toBe('open');
    expect(playLecture).not.toHaveBeenCalled();
    expect(reloadFailedLecture).not.toHaveBeenCalled();
  });

  it('is ignored when nothing is loaded', () => {
    openNowPlayingForLoadedLecture();

    expect(presentation()).toBe('closed');
  });

  it('is ignored while open', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    openNowPlayingForLoadedLecture();

    expect(presentation()).toBe('open');
    expect(reloadFailedLecture).not.toHaveBeenCalled();
  });
});

describe('closeNowPlaying (chevron, Android back)', () => {
  it('closes without pausing', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    closeNowPlaying();

    expect(presentation()).toBe('closed');
    expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(true);
    expect(stopAndClear).not.toHaveBeenCalled();
  });

  it('when the queue has ended: closes, with no bar underneath, and stops nothing', () => {
    loadFirstWithMiniPlayerShowing();
    usePlayerStore.getState().setHasQueueEnded(true);
    setPresentation('open');

    closeNowPlaying();

    expect(presentation()).toBe('closed');
    expect(selectIsMiniPlayerVisible(usePlayerStore.getState())).toBe(false);
    expect(stopAndClear).not.toHaveBeenCalled();
  });

  it('is ignored while closed', () => {
    loadFirstWithMiniPlayerShowing();

    closeNowPlaying();

    expect(presentation()).toBe('closed');
  });
});

describe('handlePanelReleased (the panel was dragged and let go)', () => {
  it('released closed from open: closes, playback continues', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    handlePanelReleased('closed');

    expect(presentation()).toBe('closed');
    expect(stopAndClear).not.toHaveBeenCalled();
  });

  it('released open while open (sprang back): stays open', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    handlePanelReleased('open');

    expect(presentation()).toBe('open');
  });

  it('grabbed while closing and pushed back up: re-opens', () => {
    loadFirstWithMiniPlayerShowing();

    handlePanelReleased('open');

    expect(presentation()).toBe('open');
  });

  it('released closed while already closed: nothing changes, nothing stops', () => {
    loadFirstWithMiniPlayerShowing();

    handlePanelReleased('closed');

    expect(presentation()).toBe('closed');
    expect(stopAndClear).not.toHaveBeenCalled();
  });

  it('does nothing when nothing is loaded', () => {
    handlePanelReleased('open');
    expect(presentation()).toBe('closed');

    handlePanelReleased('closed');
    expect(presentation()).toBe('closed');
  });

  it('a row tapped right after a release always opens Now Playing (the store cannot get stuck)', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');
    handlePanelReleased('closed');

    openNowPlaying(openSecond);

    expect(presentation()).toBe('open');
    expect(playLecture).toHaveBeenCalledTimes(1);
  });
});

describe('dismissing the bar', () => {
  it('stops and clears the session', () => {
    loadFirstWithMiniPlayerShowing();

    dismissMiniPlayer();

    expect(stopAndClear).toHaveBeenCalledTimes(1);
  });

  it('is ignored while Now Playing is open', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    dismissMiniPlayer();

    expect(stopAndClear).not.toHaveBeenCalled();
  });

  it('is ignored when the bar is not showing (the queue ended)', () => {
    loadFirstWithMiniPlayerShowing();
    usePlayerStore.getState().setHasQueueEnded(true);

    dismissMiniPlayer();

    expect(stopAndClear).not.toHaveBeenCalled();
  });
});

describe('openEventFromNowPlaying (the event pill)', () => {
  it('closes Now Playing and opens the event underneath', () => {
    loadFirstWithMiniPlayerShowing();
    setPresentation('open');

    openEventFromNowPlaying('the-sahaba-radiyyallahu-anhum');

    expect(presentation()).toBe('closed');
    expect(navigate).toHaveBeenCalledWith({
      pathname: '/events/[slug]',
      params: { slug: 'the-sahaba-radiyyallahu-anhum' },
    });
  });

  it('is ignored while Now Playing is closed', () => {
    loadFirstWithMiniPlayerShowing();

    openEventFromNowPlaying('the-sahaba-radiyyallahu-anhum');

    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('showNowPlayingFromDeepLink', () => {
  it('opens Now Playing on the loaded lecture', () => {
    loadFirstWithMiniPlayerShowing();

    showNowPlayingFromDeepLink();

    expect(presentation()).toBe('open');
  });

  it('is ignored when nothing is loaded', () => {
    showNowPlayingFromDeepLink();

    expect(presentation()).toBe('closed');
  });
});

describe('opening a lecture whose audio did not load', () => {
  function failFirst() {
    loadFirstWithMiniPlayerShowing();
    usePlayerStore.getState().reportAudioFailure();
  }

  it('from a list row: opens Now Playing and loads it again', () => {
    failFirst();

    openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: false });

    expect(presentation()).toBe('open');
    expect(reloadFailedLecture).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
    expect(playLecture).not.toHaveBeenCalled();
  });

  it('from the mini player: opens Now Playing and loads it again', () => {
    failFirst();

    openNowPlayingForLoadedLecture();

    expect(reloadFailedLecture).toHaveBeenCalledTimes(1);
  });
});
