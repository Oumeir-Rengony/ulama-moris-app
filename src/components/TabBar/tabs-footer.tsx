import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar, type TabKey } from './index';
import { tabBar } from './tokens';

type TabsFooterProps = {
  selectedTab: TabKey | null;
  onTabPress?: (tab: TabKey) => void;
};

// The footer at the bottom of every tab screen: the tab bar, with the bottom safe-area inset
// applied here, once.
export function TabsFooter({ selectedTab, onTabPress }: TabsFooterProps) {
  const insets = useSafeAreaInsets();

  // The background and the divider run edge to edge. The tabs sit in the same centred column as
  // the screens' content (at most 600 wide) with the mini player's side inset, so on a wide window
  // (web, tablets) they line up under the bar instead of drifting to the window's edges. On a phone
  // the column is the whole width.
  return (
    <View className={`bg-bg pt-2 ${tabBar.divider}`} style={{ paddingBottom: insets.bottom }}>
      <View className="w-full max-w-[600px] self-center px-bar">
        <TabBar selectedTab={selectedTab} onTabPress={onTabPress} />
      </View>
    </View>
  );
}
