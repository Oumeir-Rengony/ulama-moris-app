import { StatusBar } from 'expo-status-bar';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeListHeader, type ContinueListeningContent } from '@/components/HomeListHeader';
import { LectureRow } from '@/components/LectureRow';
import { LoadingFooter, SkeletonRow } from '@/components/Skeleton';
import { mockPlayback, mockPlaybackLecture } from '@/data/mock-ui';
import { lectureSeries, type LectureSummary } from '@/data/sample';
import { lectureRowMetaLabel } from '@/features/lectures/lecture-labels';
import { useLatestLecturesQuery } from '@/features/lectures/lectures.queries';
import { openNowPlaying } from '@/features/player/open-now-playing';
import { openSearch } from '@/features/search/open-search';

// TODO(player stage): calculated from progressById + lecture data, hidden on first launch.
const continueListening: ContinueListeningContent = {
  title: mockPlaybackLecture.title,
  author: mockPlaybackLecture.author,
  state: 'paused',
  progress: mockPlayback.progress,
  elapsedLabel: mockPlayback.elapsed,
  minutesLeftLabel: mockPlayback.minutesLeft,
};

// TODO(series stage): useState for the selected chip, plus filtering and the empty-series state.
const seriesLabels = lectureSeries.map((series) => series.label);
const selectedSeriesLabel = lectureSeries[0].label;

const bottomSpacing = 24;

function renderLectureRow({ item }: ListRenderItemInfo<LectureSummary>) {
  // TODO(player stage): the active row comes from the player store.
  let rowState: 'idle' | 'active-paused' = 'idle';
  if (item.slug === mockPlayback.lectureSlug) {
    rowState = 'active-paused';
  }

  // Until the player stage, every tap on a lecture opens Now Playing for it (Stage 5).
  function handleOpen() {
    openNowPlaying(item.slug);
  }

  return (
    <View className="px-gutter">
      <LectureRow
        title={item.title}
        author={item.author}
        metaLabel={lectureRowMetaLabel(item)}
        state={rowState}
        onPress={handleOpen}
        onPlayPress={handleOpen}
      />
    </View>
  );
}

function handleContinueListeningPress() {
  openNowPlaying(mockPlaybackLecture.slug);
}

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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useLatestLecturesQuery();

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
        keyExtractor={lectureKey}
        ItemSeparatorComponent={RowGap}
        ListHeaderComponent={
          <HomeListHeader
            continueListening={continueListening}
            lectureCountLabel={lectureCountLabel}
            seriesLabels={seriesLabels}
            selectedSeriesLabel={selectedSeriesLabel}
            onContinueListeningPress={handleContinueListeningPress}
            onSearchPress={handleSearchPress}
          />
        }
        ListFooterComponent={footer}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        // The tab screen has no header, so it owns the top inset. The tab bar below the screen
        // owns the bottom inset, so the list only adds normal spacing there.
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: bottomSpacing,
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
        }}
      />
    </View>
  );
}
