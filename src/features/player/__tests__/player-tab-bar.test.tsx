import { act, fireEvent, screen } from '@testing-library/react-native';
import { router, usePathname } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';

import { pickTabForPath, PlayerTabBar } from '@/features/player/player-tab-bar';
import { initialPlayerState, usePlayerStore } from '@/features/player/player.store';
import { renderWithProviders } from '@/test-utils/render-with-providers';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
  usePathname: jest.fn(),
}));

const mockedUsePathname = jest.mocked(usePathname);

function TabBarInLayout() {
  const sheetIndex = useSharedValue(0);
  return <PlayerTabBar sheetIndex={sheetIndex} onHeightChange={jest.fn()} />;
}

async function renderTabBar() {
  return renderWithProviders(<TabBarInLayout />);
}

beforeEach(() => {
  usePlayerStore.setState(initialPlayerState);
  jest.clearAllMocks();
});

describe('pickTabForPath', () => {
  it('knows the tab of every tab screen, and none for the others', () => {
    expect(pickTabForPath('/')).toBe('home');
    expect(pickTabForPath('/events')).toBe('events');
    expect(pickTabForPath('/events/the-sahaba')).toBe('events');
    expect(pickTabForPath('/search')).toBeNull();
    expect(pickTabForPath('/player')).toBeNull();
    expect(pickTabForPath('/eventsx')).toBeNull();
  });
});

describe('PlayerTabBar', () => {
  it('selects the tab of the current screen', async () => {
    mockedUsePathname.mockReturnValue('/events/the-sahaba');
    await renderTabBar();

    expect(screen.getByRole('tab', { name: 'Events' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Home' })).not.toBeSelected();
  });

  it('keeps the last tab selected while a screen outside the tabs (Search) is showing', async () => {
    mockedUsePathname.mockReturnValue('/events');
    const { rerender } = await renderTabBar();

    mockedUsePathname.mockReturnValue('/search');
    await rerender(<TabBarInLayout />);

    expect(screen.getByRole('tab', { name: 'Events' })).toBeSelected();
  });

  it('switching back to a tab shows its last screen again', async () => {
    mockedUsePathname.mockReturnValue('/events/the-sahaba');
    const { rerender } = await renderTabBar();
    mockedUsePathname.mockReturnValue('/');
    await rerender(<TabBarInLayout />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));

    expect(router.navigate).toHaveBeenCalledWith('/events/the-sahaba');
  });

  it('pressing the selected tab again goes back to its first screen', async () => {
    mockedUsePathname.mockReturnValue('/events/the-sahaba');
    await renderTabBar();

    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));

    expect(router.navigate).toHaveBeenCalledWith('/events');
  });

  it('while Now Playing is open: hidden from screen readers and not touchable', async () => {
    mockedUsePathname.mockReturnValue('/');
    await renderTabBar();

    await act(async () => {
      usePlayerStore.getState().setNowPlayingPresentation('open');
    });

    expect(screen.queryByRole('tab', { name: 'Home' })).not.toBeOnTheScreen();
    expect(screen.getByTestId('player-tab-bar', { includeHiddenElements: true })).toHaveProp('pointerEvents', 'none');
  });
});
