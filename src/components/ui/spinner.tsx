import Svg, { Circle, Path } from 'react-native-svg';

import { spinner } from '@/components/Skeleton/tokens';
import { useThemeColors } from '@/theme/tokens';

// Loading spinner: a faint ring (fg at border-strong alpha) with a primary quarter arc.
// Static in this stage; the rotation is added with the other animations later.
export function Spinner({ size = 18 }: { size?: number }) {
  const colors = useThemeColors();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={colors.fg} strokeOpacity={spinner.trackOpacity} strokeWidth={2.5} />
      <Path d="M12 3a9 9 0 0 1 9 9" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}
