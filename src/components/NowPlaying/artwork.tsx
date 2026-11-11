import { View } from 'react-native';

import { CoverArt } from '@/components/artwork/cover-art';
import { useThemeShadows } from '@/theme/tokens';

type ArtworkProps = {
  // The side of the square. Leave out for a full-width square (342 at 390 wide).
  size?: number;
};

// A square with radius 28 and the `artwork` shadow (none in dark).
// Two views: the outer one carries the shadow, the inner one clips the image to the radius.
// A single clipping view would clip its own shadow too.
export function Artwork({ size }: ArtworkProps) {
  const shadows = useThemeShadows();

  let sizeStyle = undefined;
  let sizeClass = 'aspect-square w-full';
  if (size !== undefined) {
    sizeStyle = { width: size, height: size };
    sizeClass = '';
  }

  return (
    <View className={`rounded-card ${sizeClass}`} style={[{ boxShadow: shadows.artwork }, sizeStyle]}>
      <View className="flex-1 overflow-hidden rounded-card bg-emphasis">
        <CoverArt />
      </View>
    </View>
  );
}
