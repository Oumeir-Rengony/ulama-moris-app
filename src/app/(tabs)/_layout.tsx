import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { BehindNowPlaying } from '@/features/player/behind-now-playing';
import { NowPlayingPanel } from '@/features/player/now-playing-panel';
import { PlayerTabBar } from '@/features/player/player-tab-bar';
import { TabBarHeightContext } from '@/features/player/tab-bar-height';

// The navigator draws no tab bar: it would sit under the player sheet, which would take its taps.
function renderNoTabBar() {
  return null;
}

// JS tabs, not NativeTabs: the player has to sit between the screens and a tab bar we draw.
//
// The draw order matters, bottom to top:
//   1. the tab screens, which never move. BehindNowPlaying hides them from screen readers while
//      Now Playing is open.
//   2. the player: one sheet that is the mini player at its small size and grows into Now
//      Playing, covering the whole screen.
//   3. the tab bar, over the sheet. It slides down out of the way as the player grows.
// Search is a root-stack screen drawn over this whole layout, so it still covers all three.
export default function TabsLayout() {
  // The player sheet's live index (0 = the bar, 1 = the full player, −1 = gone). The sheet writes
  // it; the tab bar reads it.
  const sheetIndex = useSharedValue(-1);
  // 0 until the tab bar has been laid out; the player waits for it.
  const [tabBarHeight, setTabBarHeight] = useState(0);

  return (
    <TabBarHeightContext value={tabBarHeight}>
      <View className="flex-1 bg-bg">
        <BehindNowPlaying>
          <Tabs screenOptions={{ headerShown: false }} tabBar={renderNoTabBar}>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="events" />
          </Tabs>
        </BehindNowPlaying>
        <NowPlayingPanel sheetIndex={sheetIndex} tabBarHeight={tabBarHeight} />
        <PlayerTabBar sheetIndex={sheetIndex} onHeightChange={setTabBarHeight} />
      </View>
    </TabBarHeightContext>
  );
}
