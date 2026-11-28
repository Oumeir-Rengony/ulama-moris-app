import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { TAB_BAR_SLIDE_TIMING } from './player-motion-config';
import { pickTabForPath } from './player-tab-bar';

// 0 while a tab screen is showing, 1 on a screen outside the tabs (Search), animated in between.
// The tab bar slides down out of the way and the mini player drops into its place, both driven
// by this one value so they move together.
export function useOutsideTabsProgress(): SharedValue<number> {
  const pathname = usePathname();
  const isOutsideTabs = pickTabForPath(pathname) === null;

  let startValue = 0;
  if (isOutsideTabs) {
    startValue = 1;
  }
  const progress = useSharedValue(startValue);

  useEffect(() => {
    let target = 0;
    if (isOutsideTabs) {
      target = 1;
    }
    progress.set(withTiming(target, TAB_BAR_SLIDE_TIMING));
  }, [isOutsideTabs, progress]);

  return progress;
}
