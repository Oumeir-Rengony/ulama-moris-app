import { View } from 'react-native';

import { miniPlayer } from '@/components/MiniPlayer/tokens';

type ProgressBarProps = {
  // 0 to 1.
  progress: number;
  // onEmphasis: 4px ochre bar on the Continue listening card.
  // miniLine: 3px ochre line along the bottom edge of the mini player (absolutely positioned,
  //           so the mini player must be the positioned parent).
  variant: 'onEmphasis' | 'miniLine';
};

function toPercent(progress: number): `${number}%` {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return `${clamped * 100}%`;
}

export function ProgressBar({ progress, variant }: ProgressBarProps) {
  const width = toPercent(progress);
  const accessibilityValue = { min: 0, max: 100, now: Math.round(progress * 100) };

  if (variant === 'miniLine') {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityValue={accessibilityValue}
        className={`absolute bottom-0 left-0 h-[3px] ${miniPlayer.progress}`}
        style={{ width }}
      />
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={accessibilityValue}
      className="h-1 overflow-hidden rounded-full bg-emphasis-fg/[0.18]"
    >
      <View className="h-1 rounded-full bg-secondary" style={{ width }} />
    </View>
  );
}
