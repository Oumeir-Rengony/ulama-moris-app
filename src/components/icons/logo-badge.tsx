import Svg, { Path, Rect } from 'react-native-svg';

import { palette } from '@/theme/tokens';

// The Ulama Moris badge from html/screens/home.html (L10): olive rounded square, ivory arch,
// ochre crescent and base bar. Artwork: fixed `palette` colours, the same in light and dark.
export function LogoBadge({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityRole="image" accessibilityLabel="Ulama Moris">
      <Rect width={40} height={40} rx={12} fill={palette.oliveDeep} />
      <Path d="M11 30 V21 a9 9 0 0 1 18 0 V30 Z" fill={palette.ivory} />
      <Path d="M20 12.5 a3.6 3.6 0 1 0 3.2 5.2 a2.8 2.8 0 1 1 -3.2 -5.2 Z" fill={palette.ochre} />
      <Rect x={8} y={30} width={24} height={2.5} rx={1.25} fill={palette.ochre} />
    </Svg>
  );
}
