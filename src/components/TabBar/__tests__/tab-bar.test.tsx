import { fireEvent, screen } from '@testing-library/react-native';

import { TabBar, TabBarItem } from '@/components/TabBar';
import { renderWithProviders } from '@/test-utils/render-with-providers';

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
  it('shows the Home and Events tabs', async () => {
    await renderWithProviders(<TabBar selectedTab="home" />);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'Home' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeOnTheScreen();
  });

  it('marks the selected tab', async () => {
    await renderWithProviders(<TabBar selectedTab="events" />);
    expect(screen.getByRole('tab', { name: 'Events' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Home' })).not.toBeSelected();
  });

  it('reports which tab was pressed, the selected one included', async () => {
    const handleTabPress = jest.fn();
    await renderWithProviders(<TabBar selectedTab="home" onTabPress={handleTabPress} />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Home' }));

    expect(handleTabPress.mock.calls).toEqual([['events'], ['home']]);
  });
});
