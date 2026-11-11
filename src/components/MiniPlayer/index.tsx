import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';

import { Skip15Icon } from '@/components/icons/skip-15-icon';
import { IconButton } from '@/components/ui/icon-button';
import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';
import type { SemanticColor } from '@/theme/tokens';

import { miniPlayer } from './tokens';

type MiniPlayerProps = {
  title: string;
  author: string;
  state: 'playing' | 'paused';
  // 0 to 1.
  progress: number;
  onOpenPress?: () => void;
  onTogglePress?: () => void;
  onSkipForwardPress?: () => void;
};

// The bar above the tabs on every tab screen (HANDOFF §4.6). Charcoal in light, forest with a
// hairline outline in dark (miniPlayer tokens). Deliberate difference from the artboard: no cover
// thumbnail, so the text starts near the left edge and `miniPlayer.thumbBg` stays unused.
export function MiniPlayer({
  title,
  author,
  state,
  progress,
  onOpenPress,
  onTogglePress,
  onSkipForwardPress,
}: MiniPlayerProps) {
  const { colorScheme } = useColorScheme();

  // Same colour as miniPlayer.fg: inverse-fg on the light bar, emphasis-fg on the dark bar.
  let iconColor: SemanticColor = 'inverseFg';
  if (colorScheme === 'dark') {
    iconColor = 'emphasisFg';
  }

  let buttonState: 'play' | 'pause' = 'play';
  let buttonLabel = 'Play';
  if (state === 'playing') {
    buttonState = 'pause';
    buttonLabel = 'Pause';
  }

  return (
    <View
      className={`flex-row items-center gap-1 overflow-hidden rounded-mini pb-2.5 pl-2 pr-2 pt-2 ${miniPlayer.bg} ${miniPlayer.outline}`}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open player"
        accessibilityHint={`${title}, ${author}`}
        onPress={onOpenPress}
        className="min-h-touch flex-1 justify-center gap-0.5 pl-2 active:opacity-80"
      >
        {/* The bar is always on screen above the tabs, so its text is capped like the tab labels
            (AGENTS.md "Text & font scaling"); uncapped, it would take over the footer. */}
        <Text
          variant="bodySm"
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          className={`font-manrope-bold ${miniPlayer.fg}`}
        >
          {title}
        </Text>
        <Text
          variant="caption"
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          className={`font-manrope-semibold ${miniPlayer.fgMuted}`}
        >
          {author}
        </Text>
      </Pressable>
      <PlayPauseButton state={buttonState} variant="mini" accessibilityLabel={buttonLabel} onPress={onTogglePress} />
      <IconButton accessibilityLabel="Skip forward 15 seconds" tone="ghost" onPress={onSkipForwardPress}>
        <Skip15Icon direction="forward" size={22} color={iconColor} />
      </IconButton>
      <ProgressBar progress={progress} variant="miniLine" />
    </View>
  );
}
