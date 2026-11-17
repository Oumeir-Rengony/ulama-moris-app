import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeListHeader } from '@/components/HomeListHeader';
import { LectureRow, type LectureRowState } from '@/components/LectureRow';
import { LoadingFooter, SkeletonRow } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorCard } from '@/components/ui/error-card';
import { LoadMoreError } from '@/components/ui/load-more-error';
import { errorAnnouncement, errorCardMessage, loadMoreErrorMessage } from '@/features/errors/error-copy';
import { lectureRowMetaLabel } from '@/features/lectures/lecture-labels';
import { defaultLectureSeries, lectureSeries } from '@/features/lectures/lecture-series';
import type { Lecture, LectureSeries } from '@/features/lectures/lecture.types';
import { joinLecturePages } from '@/features/lectures/lectures.api';
import { useLatestLecturesQuery } from '@/features/lectures/lectures.queries';
import { ContinueListeningSection } from '@/features/player/continue-listening-section';
import { openNowPlaying } from '@/features/player/open-now-playing';
import { selectActiveLectureSlug, usePlayerStore } from '@/features/player/player.store';
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const miniPlayerSpace = useMiniPlayerSpace();
  // Home always shows one series; every request sends it.
  const [selectedSeries, setSelectedSeries] = useState<LectureSeries>(defaultLectureSeries);
  const lecturesQuery = useLatestLecturesQuery(selectedSeries);
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage, refetch } =
    lecturesQuery;
  // One "Try again" for the first page (reloads the list), one for a later page.
  const firstPageRetry = useRetry(lecturesQuery, refetch);
  const nextPageRetry = useRetry(lecturesQuery, fetchNextPage);

  // Read once here and passed to the rows, rather than each row subscribing to the store.
  const activeLectureSlug = usePlayerStore(selectActiveLectureSlug);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  let loadedLectures: Lecture[] = [];
  let lectureCountLabel: string | undefined = undefined;
  if (data) {
    loadedLectures = joinLecturePages(data.pages);
    // The total comes from the API; the app never counts. The first page's total is used:
    // past the last page the API reports 0.
    lectureCountLabel = lectureCountText(data.pages[0].total);
  }

  function handleSeriesPress(label: string) {
    const series = seriesKeyFor(label);
    if (series !== undefined) {
      setSelectedSeries(series);
    }
  }

  // After a failed page, scrolling doesn't ask again (no retry loops): only "Try again" does.
  function handleEndReached() {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      fetchNextPage();
    }
  }

  function renderLectureRow({ item }: ListRenderItemInfo<Lecture>) {
    // The row body opens Now Playing. The play button also resumes the lecture if it's the
    // loaded one and paused.
    function handleOpen() {
      openNowPlaying({ lecture: item, queue: loadedLectures, source: { kind: 'latest' }, resumeIfPaused: false });
    }

    function handlePlayPress() {
      openNowPlaying({ lecture: item, queue: loadedLectures, source: { kind: 'latest' }, resumeIfPaused: true });
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

  // In place of the rows when there are none: the first page loading, failed, or empty.
  let emptyList = undefined;
  const hasNoData = data === undefined;
  if (hasNoData && (firstPageRetry.isRetrying || isError)) {
    const title = 'Lectures didn’t load';
    const message = errorCardMessage;
    emptyList = (
      <View className="px-gutter">
        <ErrorCard
          title={title}
          message={message}
          isRetrying={firstPageRetry.isRetrying}
          onRetryPress={firstPageRetry.retry}
        />
      </View>
    );
    if (!firstPageRetry.isRetrying) {
      announcement = errorAnnouncement(title, message);
    }
  } else if (isPending) {
    emptyList = <FirstPageLoading />;
  } else if (data) {
    emptyList = <NoLecturesInSeries seriesLabel={seriesLabelFor(selectedSeries)} />;
  }
  useAnnouncement(announcement);

  return (
    <View className="flex-1 bg-bg">
      <StatusBar style="auto" />
      <FlatList
        data={loadedLectures}
        renderItem={renderLectureRow}
        // The rows' look depends on the player, which isn't part of `data`.
        extraData={`${activeLectureSlug}:${isPlaying}`}
        keyExtractor={lectureKey}
        ItemSeparatorComponent={RowGap}
        ListHeaderComponent={
          <HomeListHeader
            continueListening={<ContinueListeningSection queue={loadedLectures} />}
            lectureCountLabel={lectureCountLabel}
            seriesLabels={seriesLabels}
            selectedSeriesLabel={seriesLabelFor(selectedSeries)}
            onSeriesPress={handleSeriesPress}
            onSearchPress={handleSearchPress}
          />
        }
        ListEmptyComponent={emptyList}
        ListFooterComponent={footer}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        // The tab screen has no header, so it owns the top inset. The tab bar below the screen
        // owns the bottom inset. The list adds normal spacing, plus room for the floating mini
        // player so the last row scrolls clear of it.
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: bottomSpacing + miniPlayerSpace,
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
        }}
      />
    </View>
  );
}
