import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';

// JS tabs, not NativeTabs: a native tab bar can't host the mini player stacked above it (HANDOFF §2).
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="events" />
    </Tabs>
  );
}
