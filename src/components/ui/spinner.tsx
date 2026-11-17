import Svg, { Circle, Path } from 'react-native-svg';

import { spinner } from '@/components/Skeleton/tokens';
import { useThemeColors, type SemanticColor } from '@/theme/tokens';

type SpinnerProps = {
  size?: number;
  // For a spinner on a coloured button ("Try again" on bg-primary): the arc and its ring both take
  // this colour, with a stronger ring. Left out, the arc is primary on a faint fg ring, for the ground.
  color?: SemanticColor;
};

// Loading spinner: a faint ring with a quarter arc.
// Static in this stage; the rotation is added with the other animations later.
export function Spinner({ size = 18, color }: SpinnerProps) {
  const colors = useThemeColors();

  let arcColor = colors.primary;
  let ringColor = colors.fg;
  let ringOpacity: number = spinner.trackOpacity;
  if (color !== undefined) {
    arcColor = colors[color];
    ringColor = colors[color];
    ringOpacity = spinner.onColorTrackOpacity;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={ringColor} strokeOpacity={ringOpacity} strokeWidth={2.5} />
      <Path d="M12 3a9 9 0 0 1 9 9" stroke={arcColor} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}
