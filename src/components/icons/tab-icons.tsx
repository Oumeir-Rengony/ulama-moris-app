import Svg, { Path, Rect } from 'react-native-svg';

import { useThemeColors, type SemanticColor } from '@/theme/tokens';

// Tab bar icons, copied from the designs (html/screens/home.html, events.html). They are custom
// because the active tab shows a FILLED icon: filling lucide's Calendar would hide its header
// line, and lucide's House has no door cut-out when filled.

type TabIconProps = {
  filled: boolean;
  color: SemanticColor;
  size?: number;
};

const houseShape = 'M3.5 10.6 12 3.5l8.5 7.1V20a1 1 0 0 1-1 1H15v-6h-6v6H4.5a1 1 0 0 1-1-1z';

export function HomeTabIcon({ filled, color, size = 22 }: TabIconProps) {
  const colors = useThemeColors();
  const colorValue = colors[color];

  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={colorValue}>
        <Path d={houseShape} />
      </Svg>
    );
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colorValue}
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <Path d={houseShape} />
    </Svg>
  );
}

const filledCalendarShape =
  'M7 2.5a1 1 0 0 1 1 1V5h8V3.5a1 1 0 1 1 2 0V5h.5A2.5 2.5 0 0 1 21 7.5V9H3V7.5A2.5 2.5 0 0 1 5.5 5H6V3.5a1 1 0 0 1 1-1zM3 10.5h18v8A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5z';

export function EventsTabIcon({ filled, color, size = 22 }: TabIconProps) {
  const colors = useThemeColors();
  const colorValue = colors[color];

  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={colorValue}>
        <Path d={filledCalendarShape} />
      </Svg>
    );
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colorValue}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={3.5} y={5} width={17} height={15.5} rx={3} />
      <Path d="M3.5 10h17" />
      <Path d="M8 3v4" />
      <Path d="M16 3v4" />
    </Svg>
  );
}
