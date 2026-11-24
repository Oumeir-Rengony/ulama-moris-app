import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { View } from 'react-native';

import { MINI_PLAYER_GAP_ABOVE_TAB_BAR } from '@/components/MiniPlayer/tokens';
import { TabsFooter } from '@/components/TabBar/tabs-footer';
import { BehindNowPlaying } from '@/features/player/behind-now-playing';
import { MiniPlayerBar } from '@/features/player/mini-player-bar';
import { NowPlayingPanel } from '@/features/player/now-playing-panel';

// JS tabs, not NativeTabs: the mini player has to float just above a tab bar we can measure.
//
// The draw order matters:
//   1. the tabs (screens and tab bar), which never move. BehindNowPlaying hides them from screen
//      readers while Now Playing is open.
//   2. the mini player, floating just above the tab bar.
//   3. Now Playing, last: a full-screen panel that slides up over everything, tab bar included.
// Search is a root-stack screen drawn over this whole layout, so it still covers all three.
// See docs/now-playing-animation-migration.md.
export default function TabsLayout() {
  // 0 until the footer has been laid out; the mini player waits for it.
  const [tabBarHeight, setTabBarHeight] = useState(0);

  let miniPlayerBottomOffset = 0;
  if (tabBarHeight > 0) {
    miniPlayerBottomOffset = tabBarHeight + MINI_PLAYER_GAP_ABOVE_TAB_BAR;
  }

  return (
    <View className="flex-1">
      <BehindNowPlaying>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <TabsFooter {...props} onHeightChange={setTabBarHeight} />}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="events" />
        </Tabs>
      </BehindNowPlaying>
      <MiniPlayerBar bottomOffset={miniPlayerBottomOffset} />
      <NowPlayingPanel />
    </View>
  );
}
