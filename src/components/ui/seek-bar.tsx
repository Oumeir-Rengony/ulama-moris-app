import { View, type AccessibilityValue } from 'react-native';

import { Text } from '@/components/ui/text';

type SeekBarProps = {
  // 0 to 1.
  progress: number;
  // Display-ready times: "16:05" and "-30:16".
  elapsed: string;
  remaining: string;
  // e.g. { min: 0, max: 2781, now: 965, text: "16:05 of 46:21" }.
  accessibilityValue: AccessibilityValue;
  onSeek?: (progress: number) => void;
};

const thumbSize = 16;

// Now Playing slider. Visual only in this stage: tap and drag come with the player stage.
// 5px track, primary fill, a 16px primary thumb with a 2.5px ring in the ground colour,
// and a touch area at least 44 high.
export function SeekBar({ progress, elapsed, remaining, accessibilityValue }: SeekBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const percent: `${number}%` = `${clamped * 100}%`;

  return (
    <View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Seek position"
        accessibilityValue={accessibilityValue}
        className="min-h-touch justify-center"
      >
        <View className="h-[5px] rounded-full bg-track">
          <View className="h-[5px] rounded-full bg-primary" style={{ width: percent }} />
        </View>
        <View
          className="absolute rounded-full border-[2.5px] border-bg bg-primary"
          style={{
            width: thumbSize,
            height: thumbSize,
            left: percent,
            marginLeft: -thumbSize / 2,
            top: '50%',
            marginTop: -thumbSize / 2,
          }}
        />
      </View>
      <View className="flex-row justify-between">
        <Text variant="caption" tabular className="font-manrope-semibold text-fg-muted">
          {elapsed}
        </Text>
        <Text variant="caption" tabular className="font-manrope-semibold text-fg-muted">
          {remaining}
        </Text>
      </View>
    </View>
  );
}
