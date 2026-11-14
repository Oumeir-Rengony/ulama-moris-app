import Svg, { Circle, G, Path } from 'react-native-svg';

import { palette } from '@/theme/tokens';

// The decorative rosette on the emphasis cards (Continue listening, Latest event, Event hero):
// six leaves alternating olive / leaf around an ochre centre, inside a faint ivory ring.
// Artwork: fixed `palette` colours, the same in both themes (it always sits on forest).
const leafShape = 'M0 0 C 26 -30 76 -30 106 0 C 76 30 26 30 0 0 Z';

const leaves = [
  { angle: 0, fill: palette.olive },
  { angle: 60, fill: palette.leaf },
  { angle: 120, fill: palette.olive },
  { angle: 180, fill: palette.leaf },
  { angle: 240, fill: palette.olive },
  { angle: 300, fill: palette.leaf },
];

export function Rosette({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 220 220">
      <Circle cx={110} cy={110} r={104} fill="none" stroke={palette.ivory} strokeOpacity={0.08} strokeWidth={1.5} />
      <G transform="translate(110 110)">
        {leaves.map((leaf) => (
          <Path key={leaf.angle} d={leafShape} fill={leaf.fill} transform={`rotate(${leaf.angle})`} />
        ))}
        <Circle r={8} fill={palette.ochre} />
      </G>
    </Svg>
  );
}
