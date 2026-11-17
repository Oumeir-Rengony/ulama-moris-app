import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventDetailHeader, type EventHeroContent } from '@/components/EventDetailHeader';
import { NumberedLectureRow } from '@/components/NumberedLectureRow';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { LoadingFooter } from '@/components/Skeleton';
import { ErrorCard } from '@/components/ui/error-card';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { errorAnnouncement, errorCardMessage } from '@/features/errors/error-copy';
import type { EventSummary } from '@/features/events/event.types';
import type { Lecture } from '@/features/lectures/lecture.types';
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
import { useAnnouncement } from '@/hooks/use-announcement';
import { useRetry } from '@/hooks/use-retry';

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
  const eventQuery = useEventQuery(slug);
  const { data, isSuccess, isError, refetch } = eventQuery;
  const loadRetry = useRetry(eventQuery, refetch);

  const hasLoadFailed = data === undefined && (isError || loadRetry.isRetrying);
  const loadErrorTitle = 'Event didn’t load';
  const loadErrorMessage = errorCardMessage;
  let announcement: string | null = null;
  if (hasLoadFailed && !loadRetry.isRetrying) {
    announcement = errorAnnouncement(loadErrorTitle, loadErrorMessage);
  }
  useAnnouncement(announcement);
  const activeLectureSlug = usePlayerStore(selectActiveLectureSlug);

  // An unknown event (for example a bad deep link): back to the list.
  if (isSuccess && data === null) {
    return <Redirect href="/events" />;
  }

  // The event didn't load: the back button and the shared error card.
  // TODO(design): Event detail's error state isn't designed; it reuses the lists' card.
  if (hasLoadFailed) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="w-full self-center" style={{ maxWidth: 600 }}>
          <ScreenTopBar
            left={
              <IconButton accessibilityLabel="Back" tone="surface" onPress={goBack}>
                <Icon icon={ChevronLeft} size={22} strokeWidth={2.2} />
              </IconButton>
            }
          />
          <View className="mt-3.5 px-gutter">
            <ErrorCard
              title={loadErrorTitle}
              message={loadErrorMessage}
              isRetrying={loadRetry.isRetrying}
              onRetryPress={loadRetry.retry}
            />
          </View>
        </View>
      </View>
    );
  }

  // Headerless screen in the Events tab stack: it owns the top inset; the tab bar owns the
  // bottom. While the event loads, a loading line shows on the ground.
  // TODO(design): no Event detail skeleton is designed.
  if (!data) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 40 }}>
        <LoadingFooter label="Loading event" />
      </View>
    );
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
