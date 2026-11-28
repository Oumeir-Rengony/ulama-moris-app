import { act, fireEvent, screen } from '@testing-library/react-native';
import { BackHandler, Keyboard } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

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
  handleSheetSettled: jest.fn(),
  dismissMiniPlayer: jest.fn(),
  openEventFromNowPlaying: jest.fn(),
}));

const pausedAndLoaded: MirroredStatus = {
  isPlaying: false,
  isBuffering: false,
  isLoaded: true,
  positionSec: 965,
  durationSec: 2781,
};

const areaLayout = {
  nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } },
};

function loadFirst() {
  usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
  usePlayerStore.getState().applyStatus(pausedAndLoaded);
}

function setPresentation(presentation: NowPlayingPresentation) {
  usePlayerStore.getState().setNowPlayingPresentation(presentation);
}

function PanelInLayout({ tabBarHeight }: { tabBarHeight: number }) {
  const sheetIndex = useSharedValue(-1);
  const outsideTabsProgress = useSharedValue(0);
  return <NowPlayingPanel sheetIndex={sheetIndex} tabBarHeight={tabBarHeight} outsideTabsProgress={outsideTabsProgress} />;
}

// The sheet mounts once the area it moves in and the tab bar have been laid out.
async function renderPanel(tabBarHeight = 83) {
  await renderWithProviders(<PanelInLayout tabBarHeight={tabBarHeight} />);
  await fireEvent(screen.getByTestId('now-playing-area'), 'layout', areaLayout);
}

const openPlayerLabel = /Open player/;

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.clearAllMocks();
});

describe('NowPlayingPanel', () => {
  it('waits for the tab bar to be measured', async () => {
    loadFirst();
    await renderPanel(0);

    expect(
      screen.queryByTestId('now-playing-panel', {
        includeHiddenElements: true,
      }),
    ).not.toBeOnTheScreen();
  });

  it('while nothing is loaded: no bar, and Now Playing hidden (the sheet is below the screen)', async () => {
    await renderPanel();

    expect(screen.queryByRole('button', { name: openPlayerLabel, hidden: true })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Minimise player' })).not.toBeOnTheScreen();
  });

  it('while closed: the bar is reachable; Now Playing is hidden from screen readers and takes no touches', async () => {
    loadFirst();
    await renderPanel();

    expect(screen.getByRole('button', { name: openPlayerLabel })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Minimise player' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Minimise player', hidden: true })).toBeOnTheScreen();
    expect(screen.getByTestId('now-playing-panel', { includeHiddenElements: true })).toHaveProp(
      'pointerEvents',
      'none',
    );
  });

  it('while open: Now Playing is reachable and modal; the bar is hidden', async () => {
    loadFirst();
    setPresentation('open');
    await renderPanel();

    expect(screen.getByRole('button', { name: 'Minimise player' })).toBeOnTheScreen();
    expect(screen.getByTestId('now-playing-panel')).toHaveProp('accessibilityViewIsModal', true);
    expect(screen.getByTestId('now-playing-panel')).toHaveProp('pointerEvents', 'auto');
    expect(screen.queryByRole('button', { name: openPlayerLabel })).not.toBeOnTheScreen();
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

  // A keyboard left open by Search would cover Now Playing's controls.
  it('closes the keyboard when Now Playing opens, and not before', async () => {
    const dismissKeyboard = jest.spyOn(Keyboard, 'dismiss');
    loadFirst();
    await renderPanel();
    expect(dismissKeyboard).not.toHaveBeenCalled();

    await act(async () => {
      setPresentation('open');
    });

    expect(dismissKeyboard).toHaveBeenCalledTimes(1);
    dismissKeyboard.mockRestore();
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

  it('the bar goes when the session is cleared', async () => {
    loadFirst();
    await renderPanel();

    await act(async () => {
      usePlayerStore.getState().setCurrentIndex(null);
    });

    expect(screen.queryByRole('button', { name: openPlayerLabel, hidden: true })).not.toBeOnTheScreen();
  });
});
