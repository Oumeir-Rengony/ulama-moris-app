import { StatusBar } from 'expo-status-bar';
import { SectionList, View, type SectionListData, type SectionListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventRow } from '@/components/EventRow';
import { EventsListHeader, type LatestEventContent } from '@/components/EventsListHeader';
import { LoadingFooter, SkeletonRow } from '@/components/Skeleton';
import { Text } from '@/components/ui/text';
import type { EventSummary } from '@/data/sample';
import {
  eventLectureCountLabel,
  eventStatsLabel,
  eventVenueLabel,
  latestEventMetaLabel,
} from '@/features/events/event-labels';
import { useEventsQuery } from '@/features/events/events.queries';
import { groupEventsByYear, type EventListItem, type EventYearSection } from '@/features/events/group-by-year';
import { openEvent } from '@/features/events/open-event';
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
        day={event.day}
        month={event.month}
        // By position in the whole list, so the colours keep rotating across years.
        category={catAt(position)}
        onPress={handlePress}
      />
    </View>
  );
}

function eventKey(item: EventListItem) {
  return item.event.slug;
}

function RowGap() {
  return <View className="h-2.5" />;
}

// The year header sticks while its rows scroll under it, so it needs the ground colour behind it.
// 16 above the first year and 22 above the others (ARTBOARD-MAP §2); 10 below each.
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
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useEventsQuery();

  const loadedEvents: EventSummary[] = [];
  let eventCountLabel: string | undefined = undefined;
  if (data) {
    for (const page of data.pages) {
      loadedEvents.push(...page.items);
    }
    // The total comes from the API; the app never counts.
    eventCountLabel = `${data.pages[0].total} events`;
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
    // The top inset is padding on the screen, not on the list content: sticky year headers pin to
    // the top of the list, and would otherwise hide under the status bar.
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <StatusBar style="auto" />
      <SectionList
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
          />
        }
        ListFooterComponent={footer}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        // Headerless tab-stack screen: it owns the top inset (above). The tabs footer owns the bottom.
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
