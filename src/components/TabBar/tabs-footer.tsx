import { useGlobalSearchParams, useSegments } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/MiniPlayer';
import { mockPlayback } from '@/data/mock-ui';
import { useEventQuery } from '@/features/events/events.queries';
import { pickMiniPlayerLecture } from '@/features/player/mini-player-lecture';

import { TabBar } from './index';
import { tabBar } from './tokens';

// True on /events/[slug]: the route segments end in "events", "[slug]".
function isOnEventDetail(segments: string[]): boolean {
  const lastSegment = segments[segments.length - 1];
  const secondToLastSegment = segments[segments.length - 2];
  return secondToLastSegment === 'events' && lastSegment === '[slug]';
}

// The tabs layout's footer on every tab screen: the mini player stacked above the tab bar
// (HANDOFF §4.6). The bottom safe-area inset is applied here, once.
export function TabsFooter(tabBarProps: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { slug } = useGlobalSearchParams<{ slug?: string }>();

  let eventSlug: string | undefined = undefined;
  if (isOnEventDetail(segments)) {
    eventSlug = slug;
  }
  const { data: eventDetail } = useEventQuery(eventSlug);

  let eventFirstLecture = undefined;
  if (eventSlug !== undefined && eventDetail) {
    eventFirstLecture = eventDetail.lectures[0];
  }
  const lecture = pickMiniPlayerLecture(eventFirstLecture);

  return (
    <View className={`gap-2 bg-bg px-bar ${tabBar.divider}`} style={{ paddingBottom: insets.bottom }}>
      <View className="mt-2.5">
        {/* Static until the player stage: shown paused, and its controls do nothing. */}
        <MiniPlayer title={lecture.title} author={lecture.author} state="paused" progress={mockPlayback.progress} />
      </View>
      <TabBar {...tabBarProps} />
    </View>
  );
}
