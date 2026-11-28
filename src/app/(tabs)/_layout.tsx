import { Tabs } from 'expo-router/js-tabs';

// The navigator draws no tab bar: PlayerShell (in the root layout) draws it over the player sheet,
// which would otherwise take its taps.
function renderNoTabBar() {
  return null;
}

// JS tabs, not NativeTabs: the player has to sit between the screens and a tab bar we draw.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={renderNoTabBar}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="events" />
    </Tabs>
  );
}
