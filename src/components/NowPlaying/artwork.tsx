import { View } from 'react-native';

import { CoverArt } from '@/components/artwork/cover-art';
import { useThemeShadows } from '@/theme/tokens';

// A full-width square (342 at 390 wide) with radius 28 and the `artwork` shadow (none in dark).
// Two views: the outer one carries the shadow, the inner one clips the image to the radius.
// A single clipping view would clip its own shadow too.
export function Artwork() {
  const shadows = useThemeShadows();

  return (
    <View className="aspect-square w-full rounded-card" style={{ boxShadow: shadows.artwork }}>
      <View className="flex-1 overflow-hidden rounded-card bg-emphasis">
        <CoverArt />
      </View>
    </View>
  );
}
