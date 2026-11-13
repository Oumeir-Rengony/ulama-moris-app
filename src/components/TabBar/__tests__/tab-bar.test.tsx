import { fireEvent, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { TabBar, TabBarItem } from '@/components/TabBar';
import { renderWithProviders } from '@/test-utils/render-with-providers';

type FakeTabBar = {
  props: BottomTabBarProps;
  emit: jest.Mock;
  navigateToTab: jest.Mock;
};

// The navigator passes a large state object. TabBar only reads `index` and `routes`, so the
// fake fills in just those and is cast to the full type.
function createTabBarProps(selectedIndex: number): FakeTabBar {
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigateToTab = jest.fn();

  const state = {
    index: selectedIndex,
    routes: [
      { key: 'index-key', name: 'index' },
      { key: 'events-key', name: 'events' },
      // A route that isn't a tab: it must not be shown.
      { key: 'hidden-key', name: 'settings' },
    ],
  };

  const props = { state, emitter: { emit }, navigateToTab } as unknown as BottomTabBarProps;
  return { props, emit, navigateToTab };
}

describe('TabBarItem', () => {
  it('is a tab with its label and selected state', async () => {
    await renderWithProviders(
      <>
        <TabBarItem tab="home" label="Home" isSelected />
        <TabBarItem tab="events" label="Events" isSelected={false} />
      </>,
    );
    expect(screen.getByRole('tab', { name: 'Home' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Events' })).not.toBeSelected();
  });
});

describe('TabBar', () => {
  it('shows only the Home and Events tabs', async () => {
    const { props } = createTabBarProps(0);
    await renderWithProviders(<TabBar {...props} />);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'Home' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeOnTheScreen();
  });

  it('marks the active tab as selected', async () => {
    const { props } = createTabBarProps(1);
    await renderWithProviders(<TabBar {...props} />);
    expect(screen.getByRole('tab', { name: 'Events' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Home' })).not.toBeSelected();
  });

  it('goes to another tab when it is pressed', async () => {
    const { props, emit, navigateToTab } = createTabBarProps(0);
    await renderWithProviders(<TabBar {...props} />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));
    expect(emit).toHaveBeenCalledWith({ type: 'tabPress', target: 'events-key', canPreventDefault: true });
    expect(navigateToTab).toHaveBeenCalledWith('events-key');
  });

  it('stays put when the active tab is pressed again', async () => {
    const { props, emit, navigateToTab } = createTabBarProps(0);
    await renderWithProviders(<TabBar {...props} />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Home' }));
    expect(emit).toHaveBeenCalledTimes(1);
    expect(navigateToTab).not.toHaveBeenCalled();
  });

  it('stays put when a listener prevents the tab press', async () => {
    const { props, emit, navigateToTab } = createTabBarProps(0);
    emit.mockReturnValue({ defaultPrevented: true });
    await renderWithProviders(<TabBar {...props} />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));
    expect(navigateToTab).not.toHaveBeenCalled();
  });
});
