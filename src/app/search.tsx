import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecentSearchList } from '@/components/Search/recent-search-list';
import { SearchInput } from '@/components/Search/search-input';
import { SearchResultRow } from '@/components/Search/search-result-row';
import { LoadingFooter } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorCard } from '@/components/ui/error-card';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { LoadMoreError } from '@/components/ui/load-more-error';
import { SectionHeader, SectionHeaderAction } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { errorAnnouncement, errorCardMessage, loadMoreErrorMessage } from '@/features/errors/error-copy';
import { latestEventMetaLabel } from '@/features/events/event-labels';
import { openEvent } from '@/features/events/open-event';
import { openNowPlaying } from '@/features/player/open-now-playing';
import { useRecentSearchesStore } from '@/features/search/recent-searches.store';
import { parseSearchScope, type SearchScope } from '@/features/search/scope';
import {
  joinSearchPages,
  type EventSearchResult,
  type LectureSearchResult,
  type SearchResult,
  type SearchResults,
} from '@/features/search/search.api';
import { useSearchQuery } from '@/features/search/search.queries';
import {
  lectureResultMetaLabel,
  noResultsMessage,
  noResultsTitle,
  resultsHeadingLabel,
  searchPlaceholder,
} from '@/features/search/search-labels';
import { pickSearchView, type SearchView } from '@/features/search/search-view';
import { useAnnouncement } from '@/hooks/use-announcement';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useRetry } from '@/hooks/use-retry';
import { catAt, catForTopic } from '@/theme/tokens';

// A live filter that waits for a pause in typing, so a fast typist doesn't send a request for
// every letter.
const searchDebounceMs = 300;
const bottomSpacing = 24;
const contentMaxWidth = 600;

function goBack() {
  router.back();
}

function resultKey(result: SearchResult) {
  if (result.kind === 'lecture') {
    return result.lecture.id;
  }
  return result.event.slug;
}

function RowGap() {
  return <View className="h-2" />;
}

type RecentSearchesProps = {
  queries: string[];
  onQueryPress: (query: string) => void;
  onRemovePress: (query: string) => void;
  onClearAllPress: () => void;
};

// The last searches the user committed to in this scope (see recent-searches.store.ts).
function RecentSearches({ queries, onQueryPress, onRemovePress, onClearAllPress }: RecentSearchesProps) {
  // Nothing to clear while the list is empty.
  let clearAllAction = null;
  if (queries.length > 0) {
    clearAllAction = <SectionHeaderAction label="Clear all" onPress={onClearAllPress} />;
  }

  return (
    <View className="mt-[22px] px-gutter">
      <SectionHeader title="Recent searches" size="small" trailing={clearAllAction} />
      <View className="mt-1">
        <RecentSearchList queries={queries} onQueryPress={onQueryPress} onRemovePress={onRemovePress} />
      </View>
    </View>
  );
}

function ResultsHeading({ label }: { label: string }) {
  return (
    <View className="mb-2 mt-[18px] px-gutter">
      <Text variant="bodySm" accessibilityRole="header" className="font-manrope-bold text-fg-muted">
        {label}
      </Text>
    </View>
  );
}

// TODO(design): the no-results card isn't designed.
function NoResults({ title, message }: { title: string; message: string }) {
  return (
    <View className="mt-[18px] px-gutter">
      <EmptyState title={title} message={message} />
    </View>
  );
}

type ListHeaderProps = {
  view: SearchView;
  scope: SearchScope;
  recentQueries: string[];
  onRecentQueryPress: (query: string) => void;
  onRecentRemovePress: (query: string) => void;
  onRecentClearAllPress: () => void;
  // The "Results didn’t load" card, shown in the failed view.
  errorCard: ReactNode;
};

// Everything above the result rows. In the recent and no-results views it is the whole body.
function SearchListHeader({
  view,
  scope,
  recentQueries,
  onRecentQueryPress,
  onRecentRemovePress,
  onRecentClearAllPress,
  errorCard,
}: ListHeaderProps) {
  if (view.kind === 'recent') {
    return (
      <RecentSearches
        queries={recentQueries}
        onQueryPress={onRecentQueryPress}
        onRemovePress={onRecentRemovePress}
        onClearAllPress={onRecentClearAllPress}
      />
    );
  }
  if (view.kind === 'no-results') {
    return <NoResults title={noResultsTitle(view.query)} message={noResultsMessage(scope)} />;
  }
  if (view.kind === 'results') {
    return <ResultsHeading label={resultsHeadingLabel(scope, view.results.total)} />;
  }
  if (view.kind === 'failed') {
    return <View className="mt-[18px] px-gutter">{errorCard}</View>;
  }
  if (view.kind === 'waiting') {
    // TODO(design): the searching state isn't designed.
    return (
      <View className="mt-[18px]">
        <LoadingFooter label="Searching" />
      </View>
    );
  }
  return null;
}

type LectureResultProps = {
  result: LectureSearchResult;
  query: string;
  // Called just before the lecture opens, so the screen can save the search.
  onOpen: () => void;
};

function LectureResult({ result, query, onOpen }: LectureResultProps) {
  const { lecture } = result;
  // A lecture without a topic falls back to cat-1.
  const firstTopic = lecture.category[0] ?? '';

  function handlePress() {
    onOpen();
    // Just this lecture, with the query as its "Playing from" source. Search closes first, so Now
    // Playing slides up over the tab Search was opened from, and minimising it returns there.
    openNowPlaying({
      lecture,
      queue: [lecture],
      source: { kind: 'search', query },
      resumeIfPaused: true,
      leaveSearchFirst: true,
    });
  }

  return (
    <SearchResultRow
      kind="lecture"
      titleParts={result.titleParts}
      author={lecture.author}
      metaLabel={lectureResultMetaLabel(lecture)}
      category={catForTopic(firstTopic)}
      accessibilityLabel={`Play ${lecture.title}`}
      onPress={handlePress}
    />
  );
}

// TODO(design): the event result row isn't designed.
type EventResultProps = {
  result: EventSearchResult;
  position: number;
  // Called just before the event opens, so the screen can save the search.
  onOpen: () => void;
};

function EventResult({ result, position, onOpen }: EventResultProps) {
  const { event } = result;

  function handlePress() {
    onOpen();
    openEvent(event.slug, { replaceSearch: true });
  }

  return (
    <SearchResultRow
      kind="event"
      titleParts={result.titleParts}
      metaLabel={latestEventMetaLabel(event)}
      // An event without a dated lecture has no day or month: its tile stays blank.
      day={event.day ?? ''}
      month={event.month ?? ''}
      category={catAt(position)}
      accessibilityLabel={`Open ${event.title}`}
      onPress={handlePress}
    />
  );
}

// Search: a root-stack screen sliding in from the right. Typing searches the lectures (every
// series) or the events by title, 10 results at a time. A search is saved to the recent searches
// when the user presses the keyboard's Search key or opens one of its results.
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope = parseSearchScope(params.scope);

  // The input text stays local and updates on every keystroke; only the debounced value fetches.
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, searchDebounceMs);
  const searchQuery = useSearchQuery(scope, debouncedQuery);
  const recentQueries = useRecentSearchesStore((state) => state.queriesByScope[scope]);
  const addRecentSearch = useRecentSearchesStore((state) => state.addRecentSearch);
  const removeRecentSearch = useRecentSearchesStore((state) => state.removeRecentSearch);
  const clearRecentSearches = useRecentSearchesStore((state) => state.clearRecentSearches);
  const { data, isError, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage, refetch } = searchQuery;
  // One "Try again" for the results, one for a later page of them.
  const resultsRetry = useRetry(searchQuery, refetch);
  const nextPageRetry = useRetry(searchQuery, fetchNextPage);

  let results: SearchResults | undefined = undefined;
  if (data) {
    results = joinSearchPages(data.pages);
  }

  const hasFailed = isError || resultsRetry.isRetrying;
  const view = pickSearchView({ query, debouncedQuery, results, hasFailed });

  // Recent searches still work offline: they are stored on the device.
  const resultsErrorTitle = 'Results didn’t load';
  const resultsErrorMessage = errorCardMessage;
  const errorCard = (
    <ErrorCard
      title={resultsErrorTitle}
      message={resultsErrorMessage}
      isRetrying={resultsRetry.isRetrying}
      onRetryPress={resultsRetry.retry}
    />
  );

  let resultItems: SearchResult[] = [];
  if (view.kind === 'results') {
    resultItems = view.results.items;
  }

  // The query the results belong to, shown on Now Playing as "Playing from “…”".
  const resultsQuery = debouncedQuery.trim();

  function clearQuery() {
    setQuery('');
  }

  // The keyboard's Search key saves what is typed, even before its results arrive.
  function saveTypedSearch(typedText: string) {
    addRecentSearch(scope, typedText);
  }

  // Opening a result saves the query those results belong to.
  function saveResultsSearch() {
    addRecentSearch(scope, resultsQuery);
  }

  function removeRecentQuery(recentQuery: string) {
    removeRecentSearch(scope, recentQuery);
  }

  function clearRecentQueries() {
    clearRecentSearches(scope);
  }

  // After a failed page, scrolling doesn't ask again (no retry loops): only "Try again" does.
  function handleEndReached() {
    if (view.kind === 'results' && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      fetchNextPage();
    }
  }

  let announcement: string | null = null;
  if (view.kind === 'failed' && !resultsRetry.isRetrying) {
    announcement = errorAnnouncement(resultsErrorTitle, resultsErrorMessage);
  }

  // Under the results: the next page loading, or the next page failed (the results stay).
  // TODO(design): the search footers aren't designed; they reuse the lists' footers.
  let footer = undefined;
  const nextPageFailed = view.kind === 'results' && isFetchNextPageError && !isFetchingNextPage;
  if (nextPageRetry.isRetrying || nextPageFailed) {
    const title = 'More results didn’t load';
    const message = loadMoreErrorMessage;
    footer = (
      <View className="px-gutter pt-2">
        <LoadMoreError
          title={title}
          message={message}
          isRetrying={nextPageRetry.isRetrying}
          onRetryPress={nextPageRetry.retry}
        />
      </View>
    );
    if (!nextPageRetry.isRetrying) {
      announcement = errorAnnouncement(title, message);
    }
  } else if (isFetchingNextPage) {
    footer = <LoadingFooter label="Loading more results" />;
  }
  useAnnouncement(announcement);

  function renderResult({ item, index }: ListRenderItemInfo<SearchResult>) {
    let row = null;
    if (item.kind === 'lecture') {
      row = <LectureResult result={item} query={resultsQuery} onOpen={saveResultsSearch} />;
    } else {
      row = <EventResult result={item} position={index} onOpen={saveResultsSearch} />;
    }
    return <View className="px-gutter">{row}</View>;
  }

  // No header and no tab bar, so this screen owns the top inset, and the list owns the bottom one.
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <StatusBar style="auto" />

      <View className="w-full self-center" style={{ maxWidth: contentMaxWidth }}>
        <View className="flex-row items-center gap-1.5 px-bar">
          <IconButton accessibilityLabel="Back" tone="ghost" onPress={goBack}>
            <Icon icon={ChevronLeft} size={22} strokeWidth={2.2} />
          </IconButton>
          <SearchInput
            value={query}
            placeholder={searchPlaceholder(scope)}
            autoFocus
            onChangeText={setQuery}
            onSubmit={saveTypedSearch}
            onClearPress={clearQuery}
          />
        </View>
      </View>

      {/* The list ends above the keyboard, so the last result can be scrolled into view while
          the keyboard is open. */}
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={resultItems}
          renderItem={renderResult}
          keyExtractor={resultKey}
          ItemSeparatorComponent={RowGap}
          ListHeaderComponent={
            <SearchListHeader
              view={view}
              scope={scope}
              recentQueries={recentQueries}
              onRecentQueryPress={setQuery}
              onRecentRemovePress={removeRecentQuery}
              onRecentClearAllPress={clearRecentQueries}
              errorCard={errorCard}
            />
          }
          ListFooterComponent={footer}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          // A tap on a result works with the keyboard open, and dragging the list closes it.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingBottom: insets.bottom + bottomSpacing,
            width: '100%',
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
