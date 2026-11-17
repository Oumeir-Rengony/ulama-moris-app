import AsyncStorage from '@react-native-async-storage/async-storage';

import { initialRecentSearchesState, useRecentSearchesStore } from '@/features/search/recent-searches.store';

beforeEach(async () => {
  useRecentSearchesStore.setState(initialRecentSearchesState);
  await AsyncStorage.clear();
});

function lectureSearches() {
  return useRecentSearchesStore.getState().queriesByScope.lectures;
}

function eventSearches() {
  return useRecentSearchesStore.getState().queriesByScope.events;
}

function addLectureSearch(query: string) {
  useRecentSearchesStore.getState().addRecentSearch('lectures', query);
}

describe('recent searches store', () => {
  it('starts empty in both scopes', () => {
    expect(lectureSearches()).toEqual([]);
    expect(eventSearches()).toEqual([]);
  });

  it('puts the newest search first', () => {
    addLectureSearch('Fire');
    addLectureSearch('Sahaba');
    expect(lectureSearches()).toEqual(['Sahaba', 'Fire']);
  });

  it('keeps only the last 5 searches', () => {
    addLectureSearch('one');
    addLectureSearch('two');
    addLectureSearch('three');
    addLectureSearch('four');
    addLectureSearch('five');
    addLectureSearch('six');
    expect(lectureSearches()).toEqual(['six', 'five', 'four', 'three', 'two']);
  });

  it('moves a repeated search to the top instead of adding it twice', () => {
    addLectureSearch('Fire');
    addLectureSearch('Sahaba');
    addLectureSearch('Fire');
    expect(lectureSearches()).toEqual(['Fire', 'Sahaba']);
  });

  it('treats a different capitalisation as the same search, keeping the newest spelling', () => {
    addLectureSearch('fire');
    addLectureSearch('Fire');
    expect(lectureSearches()).toEqual(['Fire']);
  });

  it('trims spaces and ignores an empty search', () => {
    addLectureSearch('  Fire  ');
    addLectureSearch('   ');
    expect(lectureSearches()).toEqual(['Fire']);
  });

  it('keeps each scope apart', () => {
    addLectureSearch('Fire');
    useRecentSearchesStore.getState().addRecentSearch('events', 'Jummah');
    expect(lectureSearches()).toEqual(['Fire']);
    expect(eventSearches()).toEqual(['Jummah']);
  });

  it('removes one search', () => {
    addLectureSearch('Fire');
    addLectureSearch('Sahaba');
    useRecentSearchesStore.getState().removeRecentSearch('lectures', 'Fire');
    expect(lectureSearches()).toEqual(['Sahaba']);
  });

  it('clears one scope only', () => {
    addLectureSearch('Fire');
    useRecentSearchesStore.getState().addRecentSearch('events', 'Jummah');
    useRecentSearchesStore.getState().clearRecentSearches('lectures');
    expect(lectureSearches()).toEqual([]);
    expect(eventSearches()).toEqual(['Jummah']);
  });

  it('saves the searches to AsyncStorage', async () => {
    addLectureSearch('Fire');
    const saved = await AsyncStorage.getItem('recent-searches');
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved ?? '{}').state.queriesByScope.lectures).toEqual(['Fire']);
  });
});
