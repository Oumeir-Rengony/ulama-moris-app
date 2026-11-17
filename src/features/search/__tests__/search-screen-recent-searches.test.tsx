// The Search screen's recent searches with the fake API: which actions save a search, and what
// the recent list's buttons do.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen } from '@testing-library/react-native';

import SearchScreen from '@/app/search';
import { initialRecentSearchesState, useRecentSearchesStore } from '@/features/search/recent-searches.store';
import { answerFetchWith, apiLecture, apiPage } from '@/test-utils/fake-fetch';
import { renderWithProviders } from '@/test-utils/render-with-providers';

// expo-router can't load under Jest here. The screen reads the scope param and goes back with it;
// opening a result goes through these two helpers, which navigate.
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/features/player/open-now-playing', () => ({ openNowPlaying: jest.fn() }));
jest.mock('@/features/events/open-event', () => ({ openEvent: jest.fn() }));

const lectureTitle = "Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum";

beforeEach(async () => {
  useRecentSearchesStore.setState(initialRecentSearchesState);
  await AsyncStorage.clear();
  answerFetchWith(() => ({
    status: 200,
    body: apiPage([apiLecture()], { total: 1, page: 1, hasMore: false }),
  }));
});

function savedLectureSearches() {
  return useRecentSearchesStore.getState().queriesByScope.lectures;
}

describe('Search screen recent searches', () => {
  it('starts with an empty list and no "Clear all"', async () => {
    await renderWithProviders(<SearchScreen />);
    expect(screen.getByText('Your searches will appear here.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeOnTheScreen();
  });

  it('does not save a search just because it was typed', async () => {
    await renderWithProviders(<SearchScreen />);
    await fireEvent.changeText(screen.getByLabelText('Search'), 'sahaba');
    await screen.findByRole('button', { name: `Play ${lectureTitle}` });
    expect(savedLectureSearches()).toEqual([]);
  });

  it("saves the typed search when the keyboard's Search key is pressed", async () => {
    await renderWithProviders(<SearchScreen />);
    const input = screen.getByLabelText('Search');
    await fireEvent.changeText(input, ' sahaba ');
    await fireEvent(input, 'submitEditing', { nativeEvent: { text: ' sahaba ' } });
    expect(savedLectureSearches()).toEqual(['sahaba']);
  });

  it('saves the text the Search key reports, even if the last letter has not re-rendered yet', async () => {
    await renderWithProviders(<SearchScreen />);
    const input = screen.getByLabelText('Search');
    await fireEvent.changeText(input, 'fir');
    await fireEvent(input, 'submitEditing', { nativeEvent: { text: 'fire' } });
    expect(savedLectureSearches()).toEqual(['fire']);
  });

  it('saves the search when one of its results is opened', async () => {
    await renderWithProviders(<SearchScreen />);
    await fireEvent.changeText(screen.getByLabelText('Search'), 'sahaba');
    const result = await screen.findByRole('button', { name: `Play ${lectureTitle}` });
    await fireEvent.press(result);
    expect(savedLectureSearches()).toEqual(['sahaba']);
  });

  it('shows the saved searches, and a tap on one searches it again', async () => {
    useRecentSearchesStore.getState().addRecentSearch('lectures', 'sahaba');
    await renderWithProviders(<SearchScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Search for sahaba' }));
    expect(screen.getByLabelText('Search')).toHaveDisplayValue('sahaba');
  });

  it('removes one search with its ✕, and every search with "Clear all"', async () => {
    useRecentSearchesStore.getState().addRecentSearch('lectures', 'fire');
    useRecentSearchesStore.getState().addRecentSearch('lectures', 'sahaba');
    await renderWithProviders(<SearchScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Remove “fire” from recent searches' }));
    expect(screen.queryByRole('button', { name: 'Search for fire' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Search for sahaba' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getByText('Your searches will appear here.')).toBeOnTheScreen();
  });
});
