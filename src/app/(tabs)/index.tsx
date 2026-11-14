import { StatusBar } from 'expo-status-bar';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeListHeader } from '@/components/HomeListHeader';
import { LectureRow, type LectureRowState } from '@/components/LectureRow';
import { LoadingFooter, SkeletonRow } from '@/components/Skeleton';
import { lectureSeries, type LectureSummary } from '@/data/sample';
import { lectureRowMetaLabel } from '@/features/lectures/lecture-labels';
import { useLatestLecturesQuery } from '@/features/lectures/lectures.queries';
import { ContinueListeningSection } from '@/features/player/continue-listening-section';
import { openNowPlaying } from '@/features/player/open-now-playing';
import { selectActiveLectureSlug, usePlayerStore } from '@/features/player/player.store';
import { useMiniPlayerSpace } from '@/features/player/use-mini-player-space';
import { openSearch } from '@/features/search/open-search';

// TODO(series stage): useState for the selected chip, plus filtering and the empty-series state.
const seriesLabels = lectureSeries.map((series) => series.label);
const selectedSeriesLabel = lectureSeries[0].label;

const bottomSpacing = 24;

function handleSearchPress() {
  openSearch('lectures');
}

function lectureKey(lecture: LectureSummary) {
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
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useLatestLecturesQuery();

  // Read once here and passed to the rows, rather than each row subscribing to the store.
  const activeLectureSlug = usePlayerStore(selectActiveLectureSlug);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const loadedLectures: LectureSummary[] = [];
  let lectureCountLabel: string | undefined = undefined;
  if (data) {
    for (const page of data.pages) {
      loadedLectures.push(...page.items);
    }
    // The total comes from the API; the app never counts.
    lectureCountLabel = `${data.pages[0].total} lectures`;
  }

  function handleEndReached() {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }

  function renderLectureRow({ item }: ListRenderItemInfo<LectureSummary>) {
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

  let footer = undefined;
  if (isFetchingNextPage) {
    footer = <LoadingMoreFooter />;
  }

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
            selectedSeriesLabel={selectedSeriesLabel}
            onSearchPress={handleSearchPress}
          />
        }
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
