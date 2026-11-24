import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { View } from 'react-native';

import { MINI_PLAYER_GAP_ABOVE_TAB_BAR } from '@/components/MiniPlayer/tokens';
import { TabsFooter } from '@/components/TabBar/tabs-footer';
import { MiniPlayerBar } from '@/features/player/mini-player-bar';

// JS tabs, not NativeTabs: the mini player has to float just above a tab bar we can measure.
//
// The mini player is drawn here, over the tabs. Now Playing is the /player screen in the root
// stack, so it covers the tabs and the bar while it is open. Search is a root-stack screen too.
export default function TabsLayout() {
  // 0 until the footer has been laid out; the mini player waits for it.
  const [tabBarHeight, setTabBarHeight] = useState(0);

  let miniPlayerBottomOffset = 0;
  if (tabBarHeight > 0) {
    miniPlayerBottomOffset = tabBarHeight + MINI_PLAYER_GAP_ABOVE_TAB_BAR;
  }

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <TabsFooter {...props} onHeightChange={setTabBarHeight} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="events" />
      </Tabs>
      <MiniPlayerBar bottomOffset={miniPlayerBottomOffset} />
    </View>
  );
}
