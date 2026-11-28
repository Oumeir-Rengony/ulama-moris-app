import { fireEvent, screen } from '@testing-library/react-native';
import { usePathname } from 'expo-router';
import { Text } from 'react-native';

import { PlayerShell } from '@/features/player/player-shell';
import { initialPlayerState, usePlayerStore, type MirroredStatus } from '@/features/player/player.store';
import { useTabBarHeight } from '@/features/player/tab-bar-height';
import { latestSource, queueOfThree } from '@/test-utils/fixtures';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
  usePathname: jest.fn(),
}));
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

const mockedUsePathname = jest.mocked(usePathname);

const pausedAndLoaded: MirroredStatus = {
  isPlaying: false,
  isBuffering: false,
  isLoaded: true,
  positionSec: 965,
  durationSec: 2781,
};

const tabBarHeight = 83;
const openPlayerLabel = /Open player/;

function loadFirst() {
  usePlayerStore.getState().startQueue(queueOfThree, 0, latestSource);
  usePlayerStore.getState().applyStatus(pausedAndLoaded);
}

// Stands in for the navigator's screens. Shows the tab bar height it is given, as tab screens
// add it to their bottom padding.
function FakeScreen() {
  const height = useTabBarHeight();
  return <Text>{`Screen with tab bar height ${height}`}</Text>;
}

// The player waits for the area it moves in and for the tab bar to be laid out.
async function renderShell() {
  await renderWithProviders(
    <PlayerShell>
      <FakeScreen />
    </PlayerShell>,
  );
  await fireEvent(screen.getByTestId('now-playing-area', { includeHiddenElements: true }), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } },
  });
  await fireEvent(screen.getByTestId('player-tab-bar', { includeHiddenElements: true }), 'layout', {
    nativeEvent: { layout: { x: 0, y: 761, width: 390, height: tabBarHeight } },
  });
}

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.clearAllMocks();
});

describe('PlayerShell', () => {
  it('draws the screens and gives them the tab bar’s measured height', async () => {
    mockedUsePathname.mockReturnValue('/');
    await renderShell();

    expect(screen.getByText(`Screen with tab bar height ${tabBarHeight}`)).toBeOnTheScreen();
  });

  it('on a tab screen: the mini player and the tab bar are both reachable', async () => {
    mockedUsePathname.mockReturnValue('/');
    loadFirst();
    await renderShell();

    expect(screen.getByRole('button', { name: openPlayerLabel })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Home' })).toBeOnTheScreen();
  });

  it('on Search: the mini player stays, and the tab bar is out of the way', async () => {
    mockedUsePathname.mockReturnValue('/search');
    loadFirst();
    await renderShell();

    expect(screen.getByRole('button', { name: openPlayerLabel })).toBeOnTheScreen();
    expect(screen.queryByRole('tab', { name: 'Home' })).not.toBeOnTheScreen();
    expect(screen.getByTestId('player-tab-bar', { includeHiddenElements: true })).toHaveProp('pointerEvents', 'none');
  });

  it('opening Search while a lecture plays keeps the mini player', async () => {
    mockedUsePathname.mockReturnValue('/');
    loadFirst();
    await renderShell();

    mockedUsePathname.mockReturnValue('/search');
    await screen.rerender(
      <PlayerShell>
        <FakeScreen />
      </PlayerShell>,
    );

    expect(screen.getByRole('button', { name: openPlayerLabel })).toBeOnTheScreen();
    expect(screen.queryByRole('tab', { name: 'Home' })).not.toBeOnTheScreen();
  });

  it('on Search with nothing loaded: no mini player', async () => {
    mockedUsePathname.mockReturnValue('/search');
    await renderShell();

    expect(screen.queryByRole('button', { name: openPlayerLabel, hidden: true })).not.toBeOnTheScreen();
  });
});
