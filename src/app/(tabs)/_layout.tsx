import { Tabs } from 'expo-router/js-tabs';

import { TabsFooter } from '@/components/TabBar/tabs-footer';

// JS tabs, not NativeTabs: a native tab bar can't host the mini player stacked above it (HANDOFF §2).
// The footer (mini player + tab bar) picks which lecture the mini player shows from the focused route.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabsFooter {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="events" />
    </Tabs>
  );
}
