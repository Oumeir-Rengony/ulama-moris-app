import { StatusBar } from 'expo-status-bar';
import { useState, type ReactElement } from 'react';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeListHeader } from '@/components/HomeListHeader';
import { LectureRow, type LectureRowState } from '@/components/LectureRow';
import { LoadingFooter, SkeletonRow } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorCard } from '@/components/ui/error-card';
import { LoadMoreError } from '@/components/ui/load-more-error';
import { QueryBoundary } from '@/features/api/query-boundary';
import { errorAnnouncement, errorCardMessage, loadMoreErrorMessage } from '@/features/errors/error-copy';
import { lectureRowMetaLabel } from '@/features/lectures/lecture-labels';
import { defaultLectureSeries, lectureSeries } from '@/features/lectures/lecture-series';
import type { Lecture, LectureSeries } from '@/features/lectures/lecture.types';
import { joinLecturePages } from '@/features/lectures/lectures.api';
import { useLatestLecturesQuery } from '@/features/lectures/lectures.queries';
import { ContinueListeningSection } from '@/features/player/continue-listening-section';
import { openNowPlaying } from '@/features/player/open-now-playing';
import { selectActiveLectureSlug, usePlayerStore } from '@/features/player/player.store';
import { useTabBarHeight } from '@/features/player/tab-bar-height';
import { useMiniPlayerSpace } from '@/features/player/use-mini-player-space';
import { openSearch } from '@/features/search/open-search';
import { useAnnouncement } from '@/hooks/use-announcement';
import { useRetry } from '@/hooks/use-retry';

const seriesLabels = lectureSeries.map((series) => series.label);

function seriesLabelFor(key: LectureSeries): string {
  for (const series of lectureSeries) {
    if (series.key === key) {
      return series.label;
    }
  }
  return key;
}

function seriesKeyFor(label: string): LectureSeries | undefined {
  for (const series of lectureSeries) {
    if (series.label === label) {
      return series.key;
    }
  }
  return undefined;
}

// "81 lectures", "1 lecture".
function lectureCountText(total: number): string {
  if (total === 1) {
    return '1 lecture';
  }
  return `${total} lectures`;
}

const bottomSpacing = 24;

function handleSearchPress() {
  openSearch('lectures');
}

function lectureKey(lecture: Lecture) {
  return lecture.slug;
}

function RowGap() {
  return <View className="h-2.5" />;
}

function LoadingMoreFooter() {
  return (
    <View className="gap-2.5 px-gutter pt-2.5">
      <SkeletonRow variant="lecture" />
      <LoadingFooter label="Loading more lectures" />
    </View>
  );
}

// The first page of a series is loading: placeholder rows where the lectures will be.
// TODO(design): no full-screen Home skeleton is designed; these are the list's skeleton rows.
function FirstPageLoading() {
  return (
    <View className="gap-2.5 px-gutter" accessibilityLabel="Loading lectures">
      <SkeletonRow variant="lecture" />
      <SkeletonRow variant="lecture" />
      <SkeletonRow variant="lecture" />
    </View>
  );
}

// TODO(design): the empty-series card isn't designed.
function NoLecturesInSeries({ seriesLabel }: { seriesLabel: string }) {
  return (
    <View className="px-gutter">
      <EmptyState title={`No ${seriesLabel} lectures yet`} message="Try another series." />
    </View>
  );
}

function pickRowState(slug: string, activeLectureSlug: string | null, isPlaying: boolean): LectureRowState {
  if (slug !== activeLectureSlug) {
    return 'idle';
  }
  if (isPlaying) {
    return 'active-playing';
  }
  return 'active-paused';
}

type HomeListProps = {
  lectures: Lecture[];
  // "81 lectures". Left out until the first page has loaded.
  lectureCountLabel?: string;
  selectedSeries: LectureSeries;
  onSeriesPress: (label: string) => void;
  // In place of the rows when there are none: the skeleton, the error card or the empty card.
  emptyList?: ReactElement;
  // Under the rows: the next page loading or failed.
  footer?: ReactElement;
  onEndReached?: () => void;
};

// The Home list as it looks in every state: the header (greeting, search, Continue listening,
// series chips) and the lecture rows, or `emptyList` when there are none.
function HomeList({
  lectures,
  lectureCountLabel,
  selectedSeries,
  onSeriesPress,
  emptyList,
  footer,
  onEndReached,
}: HomeListProps) {
  const insets = useSafeAreaInsets();
  const miniPlayerSpace = useMiniPlayerSpace();
  const tabBarHeight = useTabBarHeight();
  // Read once here and passed to the rows, rather than each row subscribing to the store.
  const activeLectureSlug = usePlayerStore(selectActiveLectureSlug);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  function renderLectureRow({ item }: ListRenderItemInfo<Lecture>) {
    // The row body opens Now Playing. The play button also resumes the lecture if it's the
    // loaded one and paused.
    function handleOpen() {
      openNowPlaying({ lecture: item, queue: lectures, source: { kind: 'latest' }, resumeIfPaused: false });
    }

    function handlePlayPress() {
      openNowPlaying({ lecture: item, queue: lectures, source: { kind: 'latest' }, resumeIfPaused: true });
    }

    return (
      <View className="px-gutter">
        <LectureRow
          title={item.title}
          author={item.author}
          metaLabel={lectureRowMetaLabel(item)}
          state={pickRowState(item.slug, activeLectureSlug, isPlaying)}
          onPress={handleOpen}
          onPlayPress={handlePlayPress}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <StatusBar style="auto" />
      <FlatList
        data={lectures}
        renderItem={renderLectureRow}
        // The rows' look depends on the player, which isn't part of `data`.
        extraData={`${activeLectureSlug}:${isPlaying}`}
        keyExtractor={lectureKey}
        ItemSeparatorComponent={RowGap}
        ListHeaderComponent={
          <HomeListHeader
            continueListening={<ContinueListeningSection queue={lectures} />}
            lectureCountLabel={lectureCountLabel}
            seriesLabels={seriesLabels}
            selectedSeriesLabel={seriesLabelFor(selectedSeries)}
            onSeriesPress={onSeriesPress}
            onSearchPress={handleSearchPress}
          />
        }
        ListEmptyComponent={emptyList}
        ListFooterComponent={footer}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        // The tab screen has no header, so it owns the top inset. The tab bar below the screen
        // owns the bottom inset. The list adds normal spacing, plus room for the floating mini
        // player so the last row scrolls clear of it.
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: bottomSpacing + tabBarHeight + miniPlayerSpace,
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
        }}
      />
    </View>
  );
}

type HomeSeriesProps = {
  selectedSeries: LectureSeries;
  onSeriesPress: (label: string) => void;
};

// The series' first page is loading (the QueryBoundary shows this while the query suspends).
function HomeLoading({ selectedSeries, onSeriesPress }: HomeSeriesProps) {
  return (
    <HomeList
      lectures={[]}
      selectedSeries={selectedSeries}
      onSeriesPress={onSeriesPress}
      emptyList={<FirstPageLoading />}
    />
  );
}

type HomeLoadErrorProps = HomeSeriesProps & {
  retry: () => void;
};

// The series' first page didn't load. "Try again" goes back to the skeleton while it reloads.
function HomeLoadError({ selectedSeries, onSeriesPress, retry }: HomeLoadErrorProps) {
  const title = 'Lectures didn’t load';
  const message = errorCardMessage;
  useAnnouncement(errorAnnouncement(title, message));

  return (
    <HomeList
      lectures={[]}
      selectedSeries={selectedSeries}
      onSeriesPress={onSeriesPress}
      emptyList={
        <View className="px-gutter">
          <ErrorCard title={title} message={message} isRetrying={false} onRetryPress={retry} />
        </View>
      }
    />
  );
}

// The series' lectures. Suspends until the first page has loaded; later pages load under the rows.
function HomeLoadedList({ selectedSeries, onSeriesPress }: HomeSeriesProps) {
  const lecturesQuery = useLatestLecturesQuery(selectedSeries);
  const { data, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = lecturesQuery;
  const nextPageRetry = useRetry(lecturesQuery, fetchNextPage);

  const loadedLectures = joinLecturePages(data.pages);
  // The total comes from the API; the app never counts. The first page's total is used:
  // past the last page the API reports 0.
  const lectureCountLabel = lectureCountText(data.pages[0].total);

  // After a failed page, scrolling doesn't ask again (no retry loops): only "Try again" does.
  function handleEndReached() {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      fetchNextPage();
    }
  }

  // Under the rows: the next page loading, or the next page failed (the rows stay).
  let footer = undefined;
  let announcement: string | null = null;
  if (nextPageRetry.isRetrying || (isFetchNextPageError && !isFetchingNextPage)) {
    const title = 'More lectures didn’t load';
    const message = loadMoreErrorMessage;
    footer = (
      <View className="px-gutter pt-2.5">
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
    footer = <LoadingMoreFooter />;
  }
  useAnnouncement(announcement);

  return (
    <HomeList
      lectures={loadedLectures}
      lectureCountLabel={lectureCountLabel}
      selectedSeries={selectedSeries}
      onSeriesPress={onSeriesPress}
      emptyList={<NoLecturesInSeries seriesLabel={seriesLabelFor(selectedSeries)} />}
      footer={footer}
      onEndReached={handleEndReached}
    />
  );
}

export default function HomeScreen() {
  // Home always shows one series; every request sends it.
  const [selectedSeries, setSelectedSeries] = useState<LectureSeries>(defaultLectureSeries);

  function handleSeriesPress(label: string) {
    const series = seriesKeyFor(label);
    if (series !== undefined) {
      setSelectedSeries(series);
    }
  }

  function renderLoadError(retry: () => void) {
    return <HomeLoadError selectedSeries={selectedSeries} onSeriesPress={handleSeriesPress} retry={retry} />;
  }

  // A series that isn't loaded yet suspends the list, so the skeleton rows show under the
  // header. Switching series clears a load error.
  return (
    <QueryBoundary
      loading={<HomeLoading selectedSeries={selectedSeries} onSeriesPress={handleSeriesPress} />}
      renderError={renderLoadError}
      resetKeys={[selectedSeries]}
    >
      <HomeLoadedList selectedSeries={selectedSeries} onSeriesPress={handleSeriesPress} />
    </QueryBoundary>
  );
}
