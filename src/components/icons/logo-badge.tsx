import { Image } from 'expo-image';

// The Ulama Moris logo: the island, dome and minaret on a transparent background.
// A bitmap, the same in both themes. The asset is 160 px square, enough for 40 pt at 3×.
const logoSource = require('@/assets/images/logo.png');

export function LogoBadge({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={logoSource}
      contentFit="contain"
      style={{ width: size, height: size }}
      accessibilityRole="image"
      accessibilityLabel="Ulama Moris"
    />
  );
}
