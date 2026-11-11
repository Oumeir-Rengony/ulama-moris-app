import Svg, { Path } from 'react-native-svg';

import { useThemeColors, type SemanticColor } from '@/theme/tokens';

// Custom "15" icons: lucide has none (DESIGN-SYSTEM §13). 24 × 24, stroke 2, round caps.
// Back mirrors only the arc and arrow; the digits are not mirrored, so "15" reads normally.
const forwardArc = 'M20 12a8 8 0 1 1-2.3-5.6';
const forwardArrow = 'M20 4v4h-4';
const backArc = 'M4 12a8 8 0 1 0 2.3-5.6';
const backArrow = 'M4 4v4h4';
const digitOne = 'M8.6 10.3l1.3-.9v5.6';
const digitFive = 'M15.5 9.4h-2.8l-.35 2.6c.35-.25.8-.4 1.3-.4a1.7 1.7 0 0 1 0 3.4c-.65 0-1.25-.3-1.55-.75';

type Skip15IconProps = {
  direction: 'back' | 'forward';
  // 26 in the Now Playing buttons, 22 in the mini player.
  size?: number;
  color?: SemanticColor;
};

export function Skip15Icon({ direction, size = 26, color = 'fg' }: Skip15IconProps) {
  const colors = useThemeColors();
  const stroke = colors[color];

  let arc = forwardArc;
  let arrow = forwardArrow;
  if (direction === 'back') {
    arc = backArc;
    arrow = backArrow;
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={arc} />
      <Path d={arrow} />
      <Path d={digitOne} strokeWidth={1.8} />
      <Path d={digitFive} strokeWidth={1.8} />
    </Svg>
  );
}
