import { View } from 'react-native';

import { HeroCard } from '@/components/HeroCard';
import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';

type ContinueListeningCardProps = {
  title: string;
  // Hidden when the lecture has no author.
  author?: string;
  state: 'playing' | 'paused';
  // 0 to 1.
  progress: number;
  // Display-ready: "16:05" and "31 min left".
  elapsedLabel: string;
  minutesLeftLabel: string;
  onTogglePress?: () => void;
};

// Deliberate difference from the artboard: no rosette in the top-right corner, for now.
export function ContinueListeningCard({
  title,
  author,
  state,
  progress,
  elapsedLabel,
  minutesLeftLabel,
  onTogglePress,
}: ContinueListeningCardProps) {
  const isPlaying = state === 'playing';

  let buttonState: 'play' | 'pause' = 'play';
  let buttonLabel = `Play ${title}`;
  if (isPlaying) {
    buttonState = 'pause';
    buttonLabel = `Pause ${title}`;
  }

  return (
    <HeroCard preset="continueListening" overline="Continue listening" title={title} subtitle={author}>
      <View className="mt-1 flex-row items-center gap-3.5">
        <PlayPauseButton state={buttonState} variant="hero" accessibilityLabel={buttonLabel} onPress={onTogglePress} />
        <View className="flex-1 gap-2">
          <ProgressBar progress={progress} variant="onEmphasis" />
          <View className="flex-row justify-between">
            <Text variant="caption" tabular className="font-manrope-semibold text-emphasis-fg-muted">
              {elapsedLabel}
            </Text>
            <Text variant="caption" tabular className="font-manrope-semibold text-emphasis-fg-muted">
              {minutesLeftLabel}
            </Text>
          </View>
        </View>
      </View>
    </HeroCard>
  );
}
