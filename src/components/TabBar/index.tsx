import { Pressable, View } from 'react-native';

import { EventsTabIcon, HomeTabIcon } from '@/components/icons/tab-icons';
import { Text } from '@/components/ui/text';

import { tabBar } from './tokens';

export type TabKey = 'home' | 'events';

type TabBarItemProps = {
  tab: TabKey;
  label: string;
  isSelected: boolean;
  onPress?: () => void;
};

// Active: filled icon on a 60 × 32 pill, ExtraBold label. Inactive: outline icon, muted label.
export function TabBarItem({ tab, label, isSelected, onPress }: TabBarItemProps) {
  let pillClass = '';
  let labelClass = `font-manrope-semibold ${tabBar.inactiveFg}`;
  let iconColor: 'primarySubtleFg' | 'fgMuted' = 'fgMuted';
  if (isSelected) {
    pillClass = tabBar.activeBg;
    labelClass = 'font-manrope-extrabold text-fg';
    iconColor = 'primarySubtleFg';
  }

  let icon = <HomeTabIcon filled={isSelected} color={iconColor} />;
  if (tab === 'events') {
    icon = <EventsTabIcon filled={isSelected} color={iconColor} />;
  }

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className="min-h-touch flex-1 items-center gap-1 pt-1"
    >
      {/* The key gives the pill a new native view when the tab is selected. On Android, a
          background added to a view that already exists is drawn square, ignoring its rounded corners. */}
      <View
        key={isSelected ? 'selected-pill' : 'pill'}
        className={`h-8 w-[60px] items-center justify-center rounded-full ${pillClass}`}
      >
        {icon}
      </View>
      {/* The tab bar can't grow much, so its label is capped. */}
      <Text variant="caption" maxFontSizeMultiplier={1.3} numberOfLines={1} className={labelClass}>
        {label}
      </Text>
    </Pressable>
  );
}

// The row of tabs. TabsFooter puts it in the footer chrome and owns the bottom inset.
// The selected tab and what a press does are the caller's: the player's tab bar works them out
// from the current route.
type TabBarProps = {
  selectedTab: TabKey | null;
  onTabPress?: (tab: TabKey) => void;
};

export function TabBar({ selectedTab, onTabPress }: TabBarProps) {
  function handleHomePress() {
    onTabPress?.('home');
  }

  function handleEventsPress() {
    onTabPress?.('events');
  }

  return (
    <View accessibilityRole="tablist" className="flex-row gap-1">
      <TabBarItem tab="home" label="Home" isSelected={selectedTab === 'home'} onPress={handleHomePress} />
      <TabBarItem tab="events" label="Events" isSelected={selectedTab === 'events'} onPress={handleEventsPress} />
    </View>
  );
}
