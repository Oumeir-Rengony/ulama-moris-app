import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type AccessibilityActionEvent } from 'react-native';

import { Skip15Icon } from '@/components/icons/skip-15-icon';
import { IconButton } from '@/components/ui/icon-button';
import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { Text } from '@/components/ui/text';
import { useThemeColors, useThemeShadows, type SemanticColor } from '@/theme/tokens';

import { miniPlayer } from './tokens';

type MiniPlayerProps = {
  title: string;
  author: string;
  playState: 'playing' | 'paused' | 'loading';
  // The 3px line on the bottom edge. Passed in as an element, so the line can follow the live
  // position without re-rendering the rest of the bar several times a second.
  progressLine: ReactNode;
  onOpenPress?: () => void;
  onTogglePress?: () => void;
  onSkipForwardPress?: () => void;
  // The screen-reader way to dismiss (the swipe down isn't reachable with VoiceOver / TalkBack).
  onDismiss?: () => void;
};

const dismissActionName = 'dismiss';

// The floating bar above the tab bar on every tab screen (HANDOFF §4.6). Charcoal in light,
// forest with a hairline outline in dark (miniPlayer tokens). Deliberate difference from the
// artboard: no cover thumbnail, so the text starts near the left edge.
export function MiniPlayer({
  title,
  author,
  playState,
  progressLine,
  onOpenPress,
  onTogglePress,
  onSkipForwardPress,
  onDismiss,
}: MiniPlayerProps) {
  const { colorScheme } = useColorScheme();
  const colors = useThemeColors();
  const shadows = useThemeShadows();

  // Same colour as miniPlayer.fg: inverse-fg on the light bar, emphasis-fg on the dark bar.
  let iconColor: SemanticColor = 'inverseFg';
  if (colorScheme === 'dark') {
    iconColor = 'emphasisFg';
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    if (event.nativeEvent.actionName === dismissActionName && onDismiss) {
      onDismiss();
    }
  }

  let buttonState: 'play' | 'pause' = 'play';
  let buttonLabel = 'Play';
  if (playState === 'playing') {
    buttonState = 'pause';
    buttonLabel = 'Pause';
  }

  let toggleControl = (
    <PlayPauseButton state={buttonState} variant="mini" accessibilityLabel={buttonLabel} onPress={onTogglePress} />
  );
  if (playState === 'loading') {
    // TODO(design): the loading look isn't designed. A small spinner where play/pause sits.
    toggleControl = (
      <View accessible accessibilityLabel="Loading" className="h-touch w-touch items-center justify-center">
        <ActivityIndicator size="small" color={colors[iconColor]} />
      </View>
    );
  }

  return (
    <View
      className={`flex-row items-center gap-1 overflow-hidden rounded-mini pb-2.5 pl-2 pr-2 pt-2 ${miniPlayer.bg} ${miniPlayer.outline}`}
      style={{ boxShadow: shadows.miniPlayer }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open player: ${title}, ${author}`}
        accessibilityActions={[{ name: dismissActionName, label: 'Stop and close player' }]}
        onAccessibilityAction={handleAccessibilityAction}
        onPress={onOpenPress}
        className="min-h-touch flex-1 justify-center gap-0.5 pl-2 active:opacity-80"
      >
        {/* The bar is always on screen above the tabs, so its text is capped like the tab labels
            (AGENTS.md "Text & font scaling"); uncapped, it would cover too much of the list. */}
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
      {toggleControl}
      <IconButton accessibilityLabel="Skip forward 15 seconds" tone="ghost" onPress={onSkipForwardPress}>
        <Skip15Icon direction="forward" size={22} color={iconColor} />
      </IconButton>
      {progressLine}
    </View>
  );
}
