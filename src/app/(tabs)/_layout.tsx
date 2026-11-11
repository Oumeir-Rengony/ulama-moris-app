import { Tabs } from 'expo-router/js-tabs';

import { TabsFooter, type MiniPlayerContent } from '@/components/TabBar/tabs-footer';
import { mockPlayback, mockPlaybackLecture } from '@/data/mock-ui';

// TODO(player stage): read this from the player store, and hide the mini player until something
// has been played. Shown paused, like the Continue listening card and the active Home row.
const miniPlayerContent: MiniPlayerContent = {
  title: mockPlaybackLecture.title,
  author: mockPlaybackLecture.author,
  state: 'paused',
  progress: mockPlayback.progress,
};

// JS tabs, not NativeTabs: a native tab bar can't host the mini player stacked above it (HANDOFF §2).
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabsFooter {...props} miniPlayer={miniPlayerContent} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="events" />
    </Tabs>
  );
}
