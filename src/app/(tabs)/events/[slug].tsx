import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventDetailHeader, type EventHeroContent } from '@/components/EventDetailHeader';
import { NumberedLectureRow } from '@/components/NumberedLectureRow';
import { mockPlayback } from '@/data/mock-ui';
import type { EventSummary, Lecture } from '@/data/sample';
import {
  eventLectureMetaLabel,
  eventVenueLabel,
  lectureNumberLabel,
  pausedLectureMetaLabel,
  recordedLecturesLabel,
} from '@/features/events/event-labels';
import { useEventQuery } from '@/features/events/events.queries';
import { openNowPlaying } from '@/features/player/open-now-playing';

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

// Event detail: the event's lectures in data order. Visual only, except that Back works and a
// lecture opens Now Playing (with the event as its "Playing from" source).
export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isSuccess } = useEventQuery(slug);

  // An unknown event (for example a bad deep link): back to the list.
  if (isSuccess && data === null) {
    return <Redirect href="/events" />;
  }

  // Headerless screen in the Events tab stack: it owns the top inset; the tabs footer owns the
  // bottom. While the stub resolves (instantly) only the ground shows.
  if (!data) {
    return <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }} />;
  }

  const { event, lectures } = data;

  function renderLectureRow({ item, index }: ListRenderItemInfo<Lecture>) {
    function handleOpen() {
      openNowPlaying(item.slug, { fromEventSlug: event.slug });
    }

    // TODO(player stage): the active row is whichever lecture is loaded in the player. For now the
    // first row is shown paused, matching the mini player on this screen.
    const isActiveRow = index === 0;
    let metaLabel = eventLectureMetaLabel(item);
    if (isActiveRow) {
      metaLabel = pausedLectureMetaLabel(item, mockPlayback.elapsed);
    }

    return (
      <View className="px-gutter">
        <NumberedLectureRow
          number={lectureNumberLabel(index)}
          title={item.title}
          author={item.author}
          metaLabel={metaLabel}
          state={isActiveRow ? 'active-paused' : 'idle'}
          onPress={handleOpen}
          onPlayPress={handleOpen}
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
        keyExtractor={lectureKey}
        ItemSeparatorComponent={RowGap}
        ListHeaderComponent={
          <EventDetailHeader hero={buildHeroContent(event)} lectureCount={`${event.total}`} onBackPress={goBack} />
        }
        contentContainerStyle={{
          paddingBottom: bottomSpacing,
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
        }}
      />
    </View>
  );
}
