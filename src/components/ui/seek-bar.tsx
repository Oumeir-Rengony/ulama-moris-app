import { useState } from 'react';
import { View, type AccessibilityActionEvent, type AccessibilityValue, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';

import { Text } from '@/components/ui/text';

type SeekBarProps = {
  // 0 to 1.
  progress: number;
  // Display-ready times: "16:05" and "-30:16".
  elapsed: string;
  remaining: string;
  // e.g. { min: 0, max: 2781, now: 965, text: "16:05 of 46:21" }.
  accessibilityValue: AccessibilityValue;
  // A tap, or the end of a drag, at this fraction of the track (0 to 1).
  onSeek?: (fraction: number) => void;
  // Screen readers swipe up / down on an adjustable control to step it.
  onAccessibilityStep?: (direction: 'increment' | 'decrement') => void;
};

const thumbSize = 16;

// Where along the track a touch is, from 0 to 1.
export function fractionAlongTrack(x: number, trackWidth: number): number {
  if (trackWidth <= 0) {
    return 0;
  }
  const fraction = x / trackWidth;
  if (fraction < 0) {
    return 0;
  }
  if (fraction > 1) {
    return 1;
  }
  return fraction;
}

// Now Playing slider: a 5px track, primary fill, and a 16px primary thumb with a 2.5px ring in
// the ground colour, on a touch area at least 44 high. Built by hand rather than with @expo/ui's
// Slider, which can't draw this track and thumb in the token colours.
//
// The drag position is kept here, in local state, on purpose: while the finger moves, the thumb
// follows the finger, not the live position (which would make it jump back four times a second).
// It's transient touch feedback; the real position stays in the player.
export function SeekBar({ progress, elapsed, remaining, accessibilityValue, onSeek, onAccessibilityStep }: SeekBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragFraction, setDragFraction] = useState<number | null>(null);

  function handleTrackLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  function seekTo(x: number) {
    if (onSeek) {
      onSeek(fractionAlongTrack(x, trackWidth));
    }
  }

  const tapGesture = useTapGesture({
    runOnJS: true,
    onActivate: (event) => {
      seekTo(event.x);
    },
  });

  // Horizontal only: a vertical movement fails the drag, so the screen can still scroll.
  const dragGesture = usePanGesture({
    runOnJS: true,
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onActivate: (event) => {
      setDragFraction(fractionAlongTrack(event.x, trackWidth));
    },
    onUpdate: (event) => {
      setDragFraction(fractionAlongTrack(event.x, trackWidth));
    },
    onDeactivate: (event) => {
      if (!event.canceled) {
        seekTo(event.x);
      }
      setDragFraction(null);
    },
  });

  const seekGesture = useCompetingGestures(dragGesture, tapGesture);

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    if (!onAccessibilityStep) {
      return;
    }
    if (event.nativeEvent.actionName === 'increment') {
      onAccessibilityStep('increment');
    }
    if (event.nativeEvent.actionName === 'decrement') {
      onAccessibilityStep('decrement');
    }
  }

  let shownProgress = progress;
  if (dragFraction !== null) {
    shownProgress = dragFraction;
  }
  const clamped = Math.min(Math.max(shownProgress, 0), 1);
  const percent: `${number}%` = `${clamped * 100}%`;

  return (
    <View>
      <GestureDetector gesture={seekGesture}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Seek position"
          accessibilityValue={accessibilityValue}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={handleAccessibilityAction}
          onLayout={handleTrackLayout}
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
      </GestureDetector>
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
