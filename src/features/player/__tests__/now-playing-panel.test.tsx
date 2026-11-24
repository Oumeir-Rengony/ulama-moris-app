import { act, fireEvent, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

import * as entryPoint from '@/features/player/open-now-playing';
import { NowPlayingPanel } from '@/features/player/now-playing-panel';
import {
  initialPlayerState,
  usePlayerStore,
  type MirroredStatus,
  type NowPlayingPresentation,
} from '@/features/player/player.store';
import { latestSource, queueOfThree } from '@/test-utils/fixtures';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('@/features/player/audio-engine', () => ({
  toggle: jest.fn(),
  skipForward15: jest.fn(),
  skipBack15: jest.fn(),
  seek: jest.fn(),
}));
jest.mock('@/features/player/open-now-playing', () => ({
  openNowPlayingForLoadedLecture: jest.fn(),
  closeNowPlaying: jest.fn(),
  handlePanelReleased: jest.fn(),
  openEventFromNowPlaying: jest.fn(),
}));

const pausedAndLoaded: MirroredStatus = {
  isPlaying: false,
  isBuffering: false,
  isLoaded: true,
  positionSec: 965,
  durationSec: 2781,
};

const areaLayout = { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } } };

function loadFirst() {
  usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
  usePlayerStore.getState().applyStatus(pausedAndLoaded);
}

function setPresentation(presentation: NowPlayingPresentation) {
  usePlayerStore.getState().setNowPlayingPresentation(presentation);
}

// The panel mounts once the area it slides in has been laid out.
async function renderPanel() {
  await renderWithProviders(<NowPlayingPanel />);
  await fireEvent(screen.getByTestId('now-playing-area'), 'layout', areaLayout);
}

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.clearAllMocks();
});

describe('NowPlayingPanel', () => {
  it('renders nothing when nothing is loaded', async () => {
    await renderPanel();

    expect(screen.queryByTestId('now-playing-panel', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('while closed: mounted, but hidden from screen readers', async () => {
    loadFirst();
    await renderPanel();

    expect(screen.getByTestId('now-playing-panel', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Minimise player' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Minimise player', hidden: true })).toBeOnTheScreen();
  });

  it('while open: reachable by screen readers, and modal', async () => {
    loadFirst();
    setPresentation('open');
    await renderPanel();

    expect(screen.getByRole('button', { name: 'Minimise player' })).toBeOnTheScreen();
    expect(screen.getByTestId('now-playing-panel')).toHaveProp('accessibilityViewIsModal', true);
  });

  it('becomes hidden from screen readers as soon as the store closes', async () => {
    loadFirst();
    setPresentation('open');
    await renderPanel();

    await act(async () => {
      setPresentation('closed');
    });

    expect(screen.queryByRole('button', { name: 'Minimise player' })).not.toBeOnTheScreen();
  });

  it('the chevron closes Now Playing', async () => {
    loadFirst();
    setPresentation('open');
    await renderPanel();

    await fireEvent.press(screen.getByRole('button', { name: 'Minimise player' }));

    expect(entryPoint.closeNowPlaying).toHaveBeenCalledTimes(1);
  });

  it('Android back closes Now Playing while it is open, and is not handled while closed', async () => {
    const addListener = jest.spyOn(BackHandler, 'addEventListener');
    loadFirst();
    await renderPanel();
    expect(addListener).not.toHaveBeenCalled();

    await act(async () => {
      setPresentation('open');
    });
    expect(addListener).toHaveBeenCalledTimes(1);

    // The handler ignores its argument; the type asks for the back-press event.
    const onBackPress = addListener.mock.calls[0][1] as () => boolean;
    expect(onBackPress()).toBe(true);
    expect(entryPoint.closeNowPlaying).toHaveBeenCalledTimes(1);
    addListener.mockRestore();
  });

  it('unmounts when the session is cleared', async () => {
    loadFirst();
    await renderPanel();

    await act(async () => {
      usePlayerStore.getState().setCurrentIndex(null);
    });

    expect(screen.queryByTestId('now-playing-panel', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });
});
