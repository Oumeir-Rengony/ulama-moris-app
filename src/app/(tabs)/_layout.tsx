import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { View } from 'react-native';

import { MINI_PLAYER_GAP_ABOVE_TAB_BAR } from '@/components/MiniPlayer/tokens';
import { TabsFooter } from '@/components/TabBar/tabs-footer';
import { MiniPlayerSlot } from '@/features/player/mini-player-slot';

// JS tabs, not NativeTabs: the mini player has to float just above a tab bar we can measure.
// The mini player is rendered here, once, after <Tabs> so it draws on top of the tab screens.
// Search and Now Playing are root-stack screens drawn over the whole tabs layout, so they cover it.
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
      <MiniPlayerSlot bottomOffset={miniPlayerBottomOffset} />
    </View>
  );
}
