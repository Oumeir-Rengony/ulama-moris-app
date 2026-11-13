import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { View } from 'react-native';

import { MINI_PLAYER_GAP_ABOVE_TAB_BAR } from '@/components/MiniPlayer/tokens';
import { TabsFooter } from '@/components/TabBar/tabs-footer';
import { PlayerSurface } from '@/features/player/player-surface';
import { TuckedContent } from '@/features/player/tucked-content';

// JS tabs, not NativeTabs: the mini player has to float just above a tab bar we can measure.
//
// Now Playing is not a route. It is an overlay drawn here, over the tabs, together with the mini
// player: they are one surface (PlayerSurface), so the bar can grow into Now Playing and the tabs
// behind can shrink and dim (TuckedContent). A native modal can't morph into a view of another
// screen. Search is a root-stack screen drawn over this whole layout, so it still covers both.
export default function TabsLayout() {
  // 0 until the footer has been laid out; the mini player waits for it.
  const [tabBarHeight, setTabBarHeight] = useState(0);

  let miniPlayerBottomOffset = 0;
  if (tabBarHeight > 0) {
    miniPlayerBottomOffset = tabBarHeight + MINI_PLAYER_GAP_ABOVE_TAB_BAR;
  }

  return (
    <View className="flex-1">
      <TuckedContent>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <TabsFooter {...props} onHeightChange={setTabBarHeight} />}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="events" />
        </Tabs>
      </TuckedContent>
      <PlayerSurface bottomOffset={miniPlayerBottomOffset} />
    </View>
  );
}
