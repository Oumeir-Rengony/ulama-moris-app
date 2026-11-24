import { router } from 'expo-router';

import * as engine from '@/features/player/audio-engine';
import {
  closeNowPlaying,
  dismissMiniPlayer,
  openEventFromNowPlaying,
  openNowPlaying,
  openNowPlayingForLoadedLecture,
} from '@/features/player/open-now-playing';
import { initialPlayerState, usePlayerStore } from '@/features/player/player.store';
import { latestSource, queueOfThree, searchSource } from '@/test-utils/fixtures';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: jest.fn() },
}));
jest.mock('@/features/player/audio-engine', () => ({
  playLecture: jest.fn(),
  resume: jest.fn(),
  reloadFailedLecture: jest.fn(),
  stopAndClear: jest.fn(),
}));

const [first, second] = queueOfThree;
const push = jest.mocked(router.push);
const replace = jest.mocked(router.replace);
const back = jest.mocked(router.back);
const navigate = jest.mocked(router.navigate);
const canGoBack = jest.mocked(router.canGoBack);
const playLecture = jest.mocked(engine.playLecture);
const resume = jest.mocked(engine.resume);
const reloadFailedLecture = jest.mocked(engine.reloadFailedLecture);
const stopAndClear = jest.mocked(engine.stopAndClear);

// A session with `first` loaded and paused.
function loadFirst() {
  usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
  usePlayerStore.getState().applyStatus({
    isPlaying: false,
    isBuffering: false,
    isLoaded: true,
    positionSec: 965,
    durationSec: 2781,
  });
}

function failFirst() {
  usePlayerStore.getState().reportAudioFailure();
}

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.resetAllMocks();
});

describe('openNowPlaying', () => {
  it('a new lecture: loads it, then shows Now Playing', () => {
    const steps: string[] = [];
    playLecture.mockImplementation(() => {
      steps.push('load');
    });
    push.mockImplementation(() => {
      steps.push('show');
    });

    openNowPlaying({ lecture: second, queue: queueOfThree, source: latestSource, resumeIfPaused: false });

    expect(playLecture).toHaveBeenCalledWith(second, queueOfThree, latestSource);
    expect(push).toHaveBeenCalledWith('/player');
    expect(steps).toEqual(['load', 'show']);
  });

  it('another lecture while one is loaded: loads the new one', () => {
    loadFirst();

    openNowPlaying({ lecture: second, queue: queueOfThree, source: latestSource, resumeIfPaused: false });

    expect(playLecture).toHaveBeenCalledWith(second, queueOfThree, latestSource);
    expect(push).toHaveBeenCalledWith('/player');
  });

  it('the loaded lecture from a row body: shows it, never reloads or resumes', () => {
    loadFirst();

    openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: false });

    expect(playLecture).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/player');
  });

  it('the loaded lecture from a play button: resumes it, never reloads', () => {
    loadFirst();

    openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: true });

    expect(resume).toHaveBeenCalledTimes(1);
    expect(playLecture).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/player');
  });

  it('the loaded lecture whose audio failed: loads it again', () => {
    loadFirst();
    failFirst();

    openNowPlaying({ lecture: first, queue: queueOfThree, source: latestSource, resumeIfPaused: true });

    expect(reloadFailedLecture).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
  });

  it('from Search: Now Playing replaces Search', () => {
    openNowPlaying({ lecture: second, queue: [second], source: searchSource, resumeIfPaused: true, replacesSearch: true });

    expect(replace).toHaveBeenCalledWith('/player');
    expect(push).not.toHaveBeenCalled();
  });
});

describe('openNowPlayingForLoadedLecture (tap the bar)', () => {
  it('shows Now Playing for the loaded lecture, no reload', () => {
    loadFirst();

    openNowPlayingForLoadedLecture();

    expect(push).toHaveBeenCalledWith('/player');
    expect(playLecture).not.toHaveBeenCalled();
    expect(reloadFailedLecture).not.toHaveBeenCalled();
  });

  it('loads the audio again when it had failed', () => {
    loadFirst();
    failFirst();

    openNowPlayingForLoadedLecture();

    expect(reloadFailedLecture).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/player');
  });

  it('does nothing when nothing is loaded', () => {
    openNowPlayingForLoadedLecture();

    expect(push).not.toHaveBeenCalled();
  });
});

describe('closeNowPlaying (the chevron)', () => {
  it('goes back, and never touches the audio', () => {
    canGoBack.mockReturnValue(true);

    closeNowPlaying();

    expect(back).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
    expect(stopAndClear).not.toHaveBeenCalled();
  });

  it('goes to the tabs when there is nothing to go back to (a cold-start deep link)', () => {
    canGoBack.mockReturnValue(false);

    closeNowPlaying();

    expect(back).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/');
  });
});

describe('openEventFromNowPlaying (the event pill)', () => {
  it('closes Now Playing, then opens the event', () => {
    canGoBack.mockReturnValue(true);
    const steps: string[] = [];
    back.mockImplementation(() => {
      steps.push('close');
    });
    navigate.mockImplementation(() => {
      steps.push('open event');
    });

    openEventFromNowPlaying('the-sahaba-radiyyallahu-anhum');

    expect(navigate).toHaveBeenCalledWith({
      pathname: '/events/[slug]',
      params: { slug: 'the-sahaba-radiyyallahu-anhum' },
    });
    expect(steps).toEqual(['close', 'open event']);
  });
});

describe('dismissMiniPlayer (screen-reader "Stop and close player")', () => {
  it('stops and clears the session', () => {
    loadFirst();

    dismissMiniPlayer();

    expect(stopAndClear).toHaveBeenCalledTimes(1);
  });
});
