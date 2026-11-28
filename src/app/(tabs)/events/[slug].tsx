import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactElement } from 'react';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventDetailHeader, type EventHeroContent } from '@/components/EventDetailHeader';
import { NumberedLectureRow } from '@/components/NumberedLectureRow';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { EventDetailSkeleton, EventLecturesSkeleton } from '@/components/Skeleton';
import { ErrorCard } from '@/components/ui/error-card';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { QueryBoundary } from '@/features/api/query-boundary';
import { errorAnnouncement, errorCardMessage } from '@/features/errors/error-copy';
import type { EventSummary } from '@/features/events/event.types';
import type { Lecture } from '@/features/lectures/lecture.types';
import {
  eventLectureMetaLabel,
  eventVenueLabel,
  lectureNumberLabel,
  recordedLecturesLabel,
} from '@/features/events/event-labels';
import { useEventQuery, useEventSummaryFromList } from '@/features/events/events.queries';
import { ActiveNumberedLectureRow } from '@/features/player/active-numbered-lecture-row';
import { openNowPlaying } from '@/features/player/open-now-playing';
import { selectActiveLectureSlug, usePlayerStore, type QueueSource } from '@/features/player/player.store';
import { useTabBarHeight } from '@/features/player/tab-bar-height';
import { useMiniPlayerSpace } from '@/features/player/use-mini-player-space';
import { useAnnouncement } from '@/hooks/use-announcement';

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

function BackButton() {
  return (
    <IconButton accessibilityLabel="Back" tone="surface" onPress={goBack}>
      <Icon icon={ChevronLeft} size={22} strokeWidth={2.2} />
    </IconButton>
  );
}

type TopBarOnlyProps = {
  children: ReactElement;
};

// The back button over the skeleton or the error card, before anything about the event is known.
// Headerless screen in the Events tab stack: it owns the top inset; the tab bar owns the bottom.
function TopBarOnly({ children }: TopBarOnlyProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="w-full self-center" style={{ maxWidth: 600 }}>
        <ScreenTopBar left={<BackButton />} />
        {children}
      </View>
    </View>
  );
}

type EventDetailViewProps = {
  event: EventSummary;
  lectures: Lecture[];
  // In place of the rows when there are none: the rows' skeleton while they load.
  emptyList?: ReactElement;
};

// Event detail as it looks with the event known: the header (top bar, hero card, "Lectures from
// this event") and the numbered rows. A lecture opens Now Playing with the event's lectures as
// its queue, and the event as its "Playing from" source.
function EventDetailView({ event, lectures, emptyList }: EventDetailViewProps) {
  const insets = useSafeAreaInsets();
  const miniPlayerSpace = useMiniPlayerSpace();
  const tabBarHeight = useTabBarHeight();
  const activeLectureSlug = usePlayerStore(selectActiveLectureSlug);

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

  // Headerless screen in the Events tab stack: it owns the top inset; the tab bar owns the bottom.
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
        ListEmptyComponent={emptyList}
        ListHeaderComponent={
          <EventDetailHeader hero={buildHeroContent(event)} lectureCount={`${event.total}`} onBackPress={goBack} />
        }
        // Normal spacing, plus room for the floating mini player so the last row scrolls clear.
        contentContainerStyle={{
          paddingBottom: bottomSpacing + tabBarHeight + miniPlayerSpace,
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
        }}
      />
    </View>
  );
}

// The event is loading (the QueryBoundary shows this while the query suspends). Opened from the
// Events list, the list already has the event, so the real header shows at once and only the
// rows are skeletons. Opened from a link, the whole screen is a skeleton.
// TODO(design): no Event detail skeleton is designed; it follows the loaded screen's shapes.
function EventDetailLoading({ slug }: { slug: string }) {
  const eventFromList = useEventSummaryFromList(slug);

  if (eventFromList) {
    return <EventDetailView event={eventFromList} lectures={[]} emptyList={<EventLecturesSkeleton />} />;
  }

  return (
    <TopBarOnly>
      <EventDetailSkeleton />
    </TopBarOnly>
  );
}

// The event didn't load: the back button and the shared error card. "Try again" goes back to the
// skeleton while it reloads.
// TODO(design): Event detail's error state isn't designed; it reuses the lists' card.
function EventDetailLoadError({ retry }: { retry: () => void }) {
  const title = 'Event didn’t load';
  const message = errorCardMessage;
  useAnnouncement(errorAnnouncement(title, message));

  return (
    <TopBarOnly>
      <View className="mt-3.5 px-gutter">
        <ErrorCard title={title} message={message} isRetrying={false} onRetryPress={retry} />
      </View>
    </TopBarOnly>
  );
}

function renderEventDetailLoadError(retry: () => void) {
  return <EventDetailLoadError retry={retry} />;
}

// The event and its lectures. Suspends until they have loaded.
function EventDetailLoaded({ slug }: { slug: string }) {
  const { data } = useEventQuery(slug);

  // An unknown event (for example a bad deep link): back to the list.
  if (data === null) {
    return <Redirect href="/events" />;
  }

  return <EventDetailView event={data.event} lectures={data.lectures} />;
}

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <QueryBoundary
      loading={<EventDetailLoading slug={slug} />}
      renderError={renderEventDetailLoadError}
      resetKeys={[slug]}
    >
      <EventDetailLoaded slug={slug} />
    </QueryBoundary>
  );
}
