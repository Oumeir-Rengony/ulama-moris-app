import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventDetailHeader, type EventHeroContent } from '@/components/EventDetailHeader';
import { NumberedLectureRow } from '@/components/NumberedLectureRow';
import type { EventSummary, Lecture } from '@/data/sample';
import {
  eventLectureMetaLabel,
  eventVenueLabel,
  lectureNumberLabel,
  recordedLecturesLabel,
} from '@/features/events/event-labels';
import { useEventQuery } from '@/features/events/events.queries';
import { ActiveNumberedLectureRow } from '@/features/player/active-numbered-lecture-row';
import { openNowPlaying } from '@/features/player/open-now-playing';
import { selectActiveLectureSlug, usePlayerStore, type QueueSource } from '@/features/player/player.store';
import { useMiniPlayerSpace } from '@/features/player/use-mini-player-space';

const bottomSpacing = 24;

function goBack() {
  router.back();
}

function RowGap() {
  return <View className="h-2.5" />;
}

function lectureKey(lecture: Lecture) {
  return lecture.slug;
}

function buildHeroContent(event: EventSummary): EventHeroContent {
  return {
    title: event.title,
    dateLabel: event.dateRangeLong,
    lectureCountLabel: recordedLecturesLabel(event),
    durationLabel: event.duration,
    venue: eventVenueLabel(event),
  };
}

// Event detail: the event's lectures in data order. A lecture opens Now Playing with the event's
// lectures as its queue, and the event as its "Playing from" source.
export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const miniPlayerSpace = useMiniPlayerSpace();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isSuccess } = useEventQuery(slug);
  const activeLectureSlug = usePlayerStore(selectActiveLectureSlug);

  // An unknown event (for example a bad deep link): back to the list.
  if (isSuccess && data === null) {
    return <Redirect href="/events" />;
  }

  // Headerless screen in the Events tab stack: it owns the top inset; the tab bar owns the
  // bottom. While the stub resolves (instantly) only the ground shows.
  if (!data) {
    return <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }} />;
  }

  const { event, lectures } = data;

  const queueSource: QueueSource = { kind: 'event', eventSlug: event.slug, eventTitle: event.title };

  function renderLectureRow({ item, index }: ListRenderItemInfo<Lecture>) {
    // The row body opens Now Playing. The play button also resumes the lecture if it's the
    // loaded one and paused; if it's playing, it opens Now Playing without pausing.
    function handleOpen() {
      openNowPlaying({ lecture: item, queue: lectures, source: queueSource, resumeIfPaused: false });
    }

    function handlePlayPress() {
      openNowPlaying({ lecture: item, queue: lectures, source: queueSource, resumeIfPaused: true });
    }

    const number = lectureNumberLabel(index);

    if (item.slug === activeLectureSlug) {
      return (
        <View className="px-gutter">
          <ActiveNumberedLectureRow number={number} lecture={item} onPress={handleOpen} onPlayPress={handlePlayPress} />
        </View>
      );
    }

    return (
      <View className="px-gutter">
        <NumberedLectureRow
          number={number}
          title={item.title}
          author={item.author}
          metaLabel={eventLectureMetaLabel(item)}
          state="idle"
          onPress={handleOpen}
          onPlayPress={handlePlayPress}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <StatusBar style="auto" />
      <FlatList
        data={lectures}
        renderItem={renderLectureRow}
        // Which row is active comes from the player, not from `data`.
        extraData={activeLectureSlug}
        keyExtractor={lectureKey}
        ItemSeparatorComponent={RowGap}
        ListHeaderComponent={
          <EventDetailHeader hero={buildHeroContent(event)} lectureCount={`${event.total}`} onBackPress={goBack} />
        }
        // Normal spacing, plus room for the floating mini player so the last row scrolls clear.
        contentContainerStyle={{
          paddingBottom: bottomSpacing + miniPlayerSpace,
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
        }}
      />
    </View>
  );
}
