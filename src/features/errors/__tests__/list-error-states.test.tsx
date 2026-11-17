// The list error states on a real screen (Events) with the fake API: the first page failing,
// "Try again", failing again, recovering, and a later page failing under the loaded rows.
import { act, fireEvent, screen } from '@testing-library/react-native';

import EventsScreen from '@/app/(tabs)/events/index';
import { renderWithProviders } from '@/test-utils/render-with-providers';
import { answerFetchWith, apiEvent, apiPage, failFetchWithNoConnection } from '@/test-utils/fake-fetch';

// expo-router can't load under Jest here. The screen only uses it inside these two helpers, which
// navigate when a row or the search button is pressed; these tests press neither.
jest.mock('@/features/events/open-event', () => ({ openEvent: jest.fn() }));
jest.mock('@/features/search/open-search', () => ({ openSearch: jest.fn() }));

function tenEvents(prefix: string) {
  const events = [];
  for (let index = 0; index < 10; index++) {
    events.push(apiEvent({ slug: `${prefix}-${index}`, title: `${prefix} event ${index}` }));
  }
  return events;
}

describe('Events list errors', () => {
  it('shows "Events didn’t load" when the first page fails', async () => {
    failFetchWithNoConnection();

    await renderWithProviders(<EventsScreen />);

    expect(await screen.findByRole('header', { name: 'Events didn’t load' })).toBeOnTheScreen();
    expect(screen.getByText('Check your internet connection, then try again.')).toBeOnTheScreen();
  });

  it('keeps the same card and message when "Try again" fails too', async () => {
    failFetchWithNoConnection();
    await renderWithProviders(<EventsScreen />);
    await screen.findByRole('header', { name: 'Events didn’t load' });

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Events didn’t load' })).toBeOnTheScreen();
    expect(screen.getByText('Check your internet connection, then try again.')).toBeOnTheScreen();
  });

  it('shows the events once "Try again" works', async () => {
    failFetchWithNoConnection();
    await renderWithProviders(<EventsScreen />);
    await screen.findByRole('header', { name: 'Events didn’t load' });

    answerFetchWith(() => ({
      status: 200,
      body: apiPage([apiEvent({ title: 'The Muslim Family' })], { total: 1, page: 1, hasMore: false }),
    }));
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findAllByText('The Muslim Family')).not.toHaveLength(0);
    expect(screen.queryByRole('header', { name: 'Events didn’t load' })).toBeNull();
  });

  it('keeps the loaded events and shows the footer when the next page fails', async () => {
    answerFetchWith((path) => {
      if (path.includes('page=1')) {
        return { status: 200, body: apiPage(tenEvents('first'), { total: 20, page: 1, hasMore: true }) };
      }
      return { status: 500, body: { error: 'Failed to fetch events' } };
    });
    await renderWithProviders(<EventsScreen />);
    await screen.findAllByText('first event 1');
    const list = screen.getByTestId('events-list');

    await act(async () => {
      list.props.onEndReached?.();
    });

    expect(await screen.findByText('More events didn’t load')).toBeOnTheScreen();
    expect(screen.getAllByText('first event 1').length).toBeGreaterThan(0);
  });
});
