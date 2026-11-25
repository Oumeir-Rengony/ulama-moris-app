import { StatusBar } from 'expo-status-bar';
import { SectionList, View, type SectionListData, type SectionListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventRow } from '@/components/EventRow';
import { EventsListHeader, type LatestEventContent } from '@/components/EventsListHeader';
import { LoadingFooter, SkeletonRow } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorCard } from '@/components/ui/error-card';
import { LoadMoreError } from '@/components/ui/load-more-error';
import { Text } from '@/components/ui/text';
import type { EventSummary } from '@/features/events/event.types';
import {
  eventLectureCountLabel,
  eventStatsLabel,
  eventVenueLabel,
  latestEventMetaLabel,
} from '@/features/events/event-labels';
import { joinEventPages } from '@/features/events/events.api';
import { useEventsQuery } from '@/features/events/events.queries';
import { groupEventsByYear, type EventListItem, type EventYearSection } from '@/features/events/group-by-year';
import { openEvent } from '@/features/events/open-event';
import { useTabBarHeight } from '@/features/player/tab-bar-height';
import { useMiniPlayerSpace } from '@/features/player/use-mini-player-space';
import { errorAnnouncement, errorCardMessage, loadMoreErrorMessage } from '@/features/errors/error-copy';
import { openSearch } from '@/features/search/open-search';
import { useAnnouncement } from '@/hooks/use-announcement';
import { useRetry } from '@/hooks/use-retry';
import { catAt } from '@/theme/tokens';

const bottomSpacing = 24;

function renderEventRow({ item }: SectionListRenderItemInfo<EventListItem, EventYearSection>) {
  const { event, position } = item;

  function handlePress() {
    openEvent(event.slug);
  }

  return (
    <View className="px-gutter">
      <EventRow
        title={event.title}
        statsLabel={eventStatsLabel(event)}
        venue={eventVenueLabel(event)}
        // An event without a dated lecture has no day or month: its tile stays blank.
        day={event.day ?? ''}
        month={event.month ?? ''}
        // By position in the whole list, so the colours keep rotating across years.
        category={catAt(position)}
        onPress={handlePress}
      />
    </View>
  );
}

function handleSearchPress() {
  openSearch('events');
}

function eventKey(item: EventListItem) {
  return item.event.slug;
}

function RowGap() {
  return <View className="h-2.5" />;
}

// The year header sticks while its rows scroll under it, so it needs the ground colour behind it.
// 16 above the first year and 22 above the others; 10 below each.
function YearHeader({ title, isFirstYear }: { title: string; isFirstYear: boolean }) {
  let topSpacingClass = 'pt-[22px]';
  if (isFirstYear) {
    topSpacingClass = 'pt-4';
  }

  return (
    <View className={`bg-bg px-gutter pb-2.5 ${topSpacingClass}`}>
      <Text variant="label" accessibilityRole="header" className="text-fg-muted">
        {title}
      </Text>
    </View>
  );
}

function LoadingMoreFooter() {
  return (
    <View className="gap-2.5 px-gutter pt-2.5">
      <SkeletonRow variant="event" />
      <LoadingFooter label="Loading more events" />
    </View>
  );
}

// The first page is loading: placeholder rows where the events will be.
// TODO(design): no full-screen Events skeleton is designed; these are the list's skeleton rows.
function FirstPageLoading() {
  return (
    <View className="gap-2.5 px-gutter pt-4" accessibilityLabel="Loading events">
      <SkeletonRow variant="event" />
      <SkeletonRow variant="event" />
      <SkeletonRow variant="event" />
    </View>
  );
}

// TODO(design): the no-events card isn't designed.
function NoEvents() {
  return (
    <View className="px-gutter pt-4">
      <EmptyState title="No events yet" message="Recorded events will appear here." />
    </View>
  );
}

// "9 events", "1 event".
function eventCountText(total: number): string {
  if (total === 1) {
    return '1 event';
  }
  return `${total} events`;
}

function buildLatestEventContent(event: EventSummary): LatestEventContent {
  return {
    title: event.title,
    metaLabel: latestEventMetaLabel(event),
    lectureCountLabel: eventLectureCountLabel(event),
    durationLabel: event.duration,
  };
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const miniPlayerSpace = useMiniPlayerSpace();
  const tabBarHeight = useTabBarHeight();
  const eventsQuery = useEventsQuery();
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage, refetch } =
    eventsQuery;
  // One "Try again" for the first page (reloads the list), one for a later page.
  const firstPageRetry = useRetry(eventsQuery, refetch);
  const nextPageRetry = useRetry(eventsQuery, fetchNextPage);

  let loadedEvents: EventSummary[] = [];
  let eventCountLabel: string | undefined = undefined;
  if (data) {
    loadedEvents = joinEventPages(data.pages);
    // The total comes from the API; the app never counts.
    eventCountLabel = eventCountText(data.pages[0].total);
  }

  const sections = groupEventsByYear(loadedEvents);

  // The newest event is the first one the API returns.
  let latestEvent: EventSummary | undefined = undefined;
  if (loadedEvents.length > 0) {
    latestEvent = loadedEvents[0];
  }

  function handleLatestEventPress() {
    if (latestEvent) {
      openEvent(latestEvent.slug);
    }
  }

  function renderYearHeader({ section }: { section: SectionListData<EventListItem, EventYearSection> }) {
    const isFirstYear = sections.length > 0 && section.title === sections[0].title;
    return <YearHeader title={section.title} isFirstYear={isFirstYear} />;
  }

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
    const title = 'More events didn’t load';
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
    const title = 'Events didn’t load';
    const message = errorCardMessage;
    emptyList = (
      <View className="px-gutter pt-4">
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
    emptyList = <NoEvents />;
  }
  useAnnouncement(announcement);

  return (
    // The top inset is padding on the screen, not on the list content: sticky year headers pin to
    // the top of the list, and would otherwise hide under the status bar.
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <StatusBar style="auto" />
      <SectionList
        testID="events-list"
        sections={sections}
        renderItem={renderEventRow}
        renderSectionHeader={renderYearHeader}
        keyExtractor={eventKey}
        ItemSeparatorComponent={RowGap}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <EventsListHeader
            eventCountLabel={eventCountLabel}
            latestEvent={latestEvent ? buildLatestEventContent(latestEvent) : undefined}
            onLatestEventPress={handleLatestEventPress}
            onSearchPress={handleSearchPress}
          />
        }
        ListEmptyComponent={emptyList}
        ListFooterComponent={footer}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        // Headerless tab-stack screen: it owns the top inset (above). The tabs footer owns the bottom.
        contentContainerStyle={{
          // Room for the floating mini player, so the last row scrolls clear of it.
          paddingBottom: bottomSpacing + tabBarHeight + miniPlayerSpace,
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
        }}
      />
    </View>
  );
}
