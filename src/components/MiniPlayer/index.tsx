import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { ActivityIndicator, View, type AccessibilityActionEvent } from 'react-native';

import { PlayPauseButton } from '@/components/ui/play-pause-button';
import { Text } from '@/components/ui/text';
import { useThemeColors, useThemeShadows, type SemanticColor } from '@/theme/tokens';

import { miniPlayer } from './tokens';

type MiniPlayerProps = {
  title: string;
  // Hidden when the lecture has no author.
  author?: string;
  // failed: the lecture's audio didn't load. The scholar line says so, and play/pause is disabled.
  // Tapping the bar opens the lecture again, which loads it again.
  playState: 'playing' | 'paused' | 'loading' | 'failed';
  // The 3px line on the bottom edge. Passed in as an element, so the line can follow the live
  // position without re-rendering the rest of the bar several times a second.
  progressLine: ReactNode;
  // Screen readers only: "Open player" is activated with VoiceOver / TalkBack. A finger's tap is
  // the player surface's: it puts a tap area under the bar (see below).
  onOpenPress?: () => void;
  onTogglePress?: () => void;
  // The screen-reader way to stop playback and close the bar (others swipe it down).
  onDismiss?: () => void;
  // The 44 px square on the left. The player surface passes an empty space of that size and
  // draws the cover over it (the cover morphs into Now Playing's artwork). Leave out for no thumb.
  thumbnail?: ReactNode;
  // 'filled' draws the bar's own background, outline and shadow. 'transparent' leaves them to the
  // player surface, whose background view grows into Now Playing.
  background?: 'filled' | 'transparent';
};

const activateActionName = 'activate';
const dismissActionName = 'dismiss';

// The bar above the tab bar on every tab screen. Charcoal in light, forest with a hairline outline
// in dark (miniPlayer tokens).
//
// Touches: only play/pause takes them. Everything else (the thumbnail and the text) lets them
// through to whatever the player surface draws underneath, its tap area. That tap is a Gesture
// Handler tap, not a Pressable, so it never fights the drag that grows the bar into Now Playing,
// and a press on play/pause never reaches it.
export function MiniPlayer({
  title,
  author,
  playState,
  progressLine,
  onOpenPress,
  onTogglePress,
  onDismiss,
  thumbnail,
  background = 'filled',
}: MiniPlayerProps) {
  let openPlayerLabel = `Open player: ${title}`;
  if (author) {
    openPlayerLabel = `Open player: ${title}, ${author}`;
  }

  const { colorScheme } = useColorScheme();
  const colors = useThemeColors();
  const shadows = useThemeShadows();

  // Same colour as miniPlayer.fg: inverse-fg on the light bar, emphasis-fg on the dark bar.
  let iconColor: SemanticColor = 'inverseFg';
  if (colorScheme === 'dark') {
    iconColor = 'emphasisFg';
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    const actionName = event.nativeEvent.actionName;
    if (actionName === activateActionName && onOpenPress) {
      onOpenPress();
      return;
    }
    if (actionName === dismissActionName && onDismiss) {
      onDismiss();
    }
  }

  let buttonState: 'play' | 'pause' = 'play';
  let buttonLabel = 'Play';
  if (playState === 'playing') {
    buttonState = 'pause';
    buttonLabel = 'Pause';
  }

  const hasAudioFailed = playState === 'failed';

  let toggleControl = (
    <PlayPauseButton
      state={buttonState}
      variant="mini"
      accessibilityLabel={buttonLabel}
      disabled={hasAudioFailed}
      onPress={onTogglePress}
    />
  );
  if (playState === 'loading') {
    // TODO(design): the loading look isn't designed. A small spinner where play/pause sits.
    toggleControl = (
      <View accessible accessibilityLabel="Loading" className="h-touch w-touch items-center justify-center">
        <ActivityIndicator size="small" color={colors[iconColor]} />
      </View>
    );
  }

  // The line under the title: the scholar, or what happened to the audio.
  let secondLine = null;
  if (hasAudioFailed) {
    secondLine = (
      <Text
        variant="caption"
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        accessibilityLiveRegion="polite"
        className={`font-manrope-semibold ${miniPlayer.errorFg}`}
      >
        Didn’t load. Tap to open again.
      </Text>
    );
  } else if (author) {
    secondLine = (
      <Text
        variant="caption"
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        className={`font-manrope-semibold ${miniPlayer.fgMuted}`}
      >
        {author}
      </Text>
    );
  }

  let backgroundClass = '';
  let backgroundStyle = undefined;
  if (background === 'filled') {
    backgroundClass = `${miniPlayer.bg} ${miniPlayer.outline}`;
    backgroundStyle = { boxShadow: shadows.miniPlayer };
  }

  return (
    <View
      pointerEvents="box-none"
      className={`flex-row items-center gap-1 overflow-hidden rounded-mini pb-2.5 pl-2 pr-2 pt-2 ${backgroundClass}`}
      style={backgroundStyle}
    >
      {thumbnail}
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={openPlayerLabel}
        accessibilityActions={[
          { name: activateActionName },
          { name: dismissActionName, label: 'Stop and close player' },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
        pointerEvents="none"
        className="min-h-touch flex-1 justify-center gap-0.5 pl-2"
      >
        {/* The bar is always on screen above the tabs, so its text is capped like the tab labels
            at 1.3×; uncapped, it would cover too much of the list. */}
        <Text
          variant="bodySm"
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          className={`font-manrope-bold ${miniPlayer.fg}`}
        >
          {title}
        </Text>
        {secondLine}
      </View>
      {toggleControl}
      {progressLine}
    </View>
  );
}
