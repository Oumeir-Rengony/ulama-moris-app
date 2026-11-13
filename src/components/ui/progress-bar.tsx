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

function clampProgress(progress: number): number {
  return Math.min(Math.max(progress, 0), 1);
}

export function ProgressBar({ progress, variant }: ProgressBarProps) {
  const clampedProgress = clampProgress(progress);
  const width: `${number}%` = `${clampedProgress * 100}%`;
  const accessibilityValue = { min: 0, max: 100, now: Math.round(clampedProgress * 100) };

  // `accessible` makes the bar one element a screen reader can find and read. A View with only
  // a role is skipped by VoiceOver.
  if (variant === 'miniLine') {
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={accessibilityValue}
        className={`absolute bottom-0 left-0 h-[3px] ${miniPlayer.progress}`}
        style={{ width }}
      />
    );
  }

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={accessibilityValue}
      className="h-1 overflow-hidden rounded-full bg-emphasis-fg/[0.18]"
    >
      <View className="h-1 rounded-full bg-secondary" style={{ width }} />
    </View>
  );
}
