import type { ReactNode } from 'react';
import { View } from 'react-native';
import { usePlayerStore } from './player.store';

// The tabs (their screens and the tab bar), behind Now Playing. They stay as they are while the
// panel slides over them: no shrinking, no dimming. They stay mounted, so lists keep their scroll
// position, but screen readers must not reach them while Now Playing is open.
export function BehindNowPlaying({ children }: { children: ReactNode }) {
  const isNowPlayingOpen = usePlayerStore((state) => state.nowPlayingPresentation === 'open');

  return (
    <View
      className="flex-1"
      accessibilityElementsHidden={isNowPlayingOpen}
      importantForAccessibility={isNowPlayingOpen ? 'no-hide-descendants' : 'auto'}
    >
      {children}
    </View>
  );
}
