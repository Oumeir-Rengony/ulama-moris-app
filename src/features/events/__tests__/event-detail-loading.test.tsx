// Event detail's loading and error states with the fake API: the skeleton while the event loads
// (with the real hero card when the Events list already has the event), the error card, and
// "Try again".
import { fireEvent, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import EventDetailScreen from '@/app/(tabs)/events/[slug]';
import type { EventSummary } from '@/features/events/event.types';
import type { EventPage } from '@/features/events/events.api';
import {
  answerFetchWith,
  apiEvent,
  apiLecture,
  failFetchWithNoConnection,
  testApiBaseUrl,
} from '@/test-utils/fake-fetch';
import { createTestQueryClient, renderWithProviders } from '@/test-utils/render-with-providers';

// expo-router can't load under Jest here. The screen reads the slug and may redirect.
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), navigate: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Redirect: () => null,
}));

// The rows open Now Playing through the audio engine, which needs native expo-audio. These tests
// press no row.
jest.mock('@/features/player/open-now-playing', () => ({ openNowPlaying: jest.fn() }));

const eventSlug = 'the-sahaba-radiyyallahu-anhum';

// The event as the Events list holds it.
const listedEvent: EventSummary = {
  slug: eventSlug,
  title: 'The Sahaba Radiyyallahu Anhum',
  total: 4,
  duration: '2h 34m',
  location: 'MASJID MUSWALLA, HIGHLANDS',
  dateRange: '24 Oct – 31 Oct 2026',
  dateRangeLong: '24 – 31 October 2026',
  year: '2026',
  day: '24',
  month: 'Oct',
  latestTime: 1793466900000,
};

// A client where the Events list has already loaded its first page, with the event in it.
function clientWithEventsList() {
  const queryClient = createTestQueryClient();
  const firstPage: EventPage = { items: [listedEvent], total: 1, page: 1, hasMore: false };
  queryClient.setQueryData(['events', 'list'], { pages: [firstPage], pageParams: [1] });
  return queryClient;
}

// Every request waits for ever, so the screen stays loading.
function neverAnswerFetch() {
  process.env.EXPO_PUBLIC_API_URL = testApiBaseUrl;
  global.fetch = jest.fn(() => new Promise<Response>(() => {})) as typeof fetch;
}

function answerWithTheEvent() {
  answerFetchWith(() => ({
    status: 200,
    body: { event: apiEvent(), lectures: [apiLecture({ title: 'Zikr & Dua' })] },
  }));
}

beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ slug: eventSlug });
});

describe('Event detail loading', () => {
  it('shows the whole-screen skeleton when nothing about the event is known yet', async () => {
    neverAnswerFetch();

    await renderWithProviders(<EventDetailScreen />);

    expect(screen.getByLabelText('Loading event')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Back' })).toBeOnTheScreen();
  });

  it('shows the real hero card from the Events list while only the lectures load', async () => {
    neverAnswerFetch();

    await renderWithProviders(<EventDetailScreen />, { queryClient: clientWithEventsList() });

    expect(screen.getByText('The Sahaba Radiyyallahu Anhum')).toBeOnTheScreen();
    expect(screen.getByLabelText('Loading lectures')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Loading event')).toBeNull();
  });

  it('shows the lectures once the event has loaded', async () => {
    answerWithTheEvent();

    await renderWithProviders(<EventDetailScreen />, { queryClient: clientWithEventsList() });

    expect(await screen.findByRole('button', { name: 'Play Zikr & Dua' })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Loading lectures')).toBeNull();
  });
});

describe('Event detail errors', () => {
  it('shows "Event didn’t load" when the event fails, and the event once "Try again" works', async () => {
    failFetchWithNoConnection();
    await renderWithProviders(<EventDetailScreen />);

    expect(await screen.findByRole('header', { name: 'Event didn’t load' })).toBeOnTheScreen();

    answerWithTheEvent();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: 'Play Zikr & Dua' })).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Event didn’t load' })).toBeNull();
  });
});
