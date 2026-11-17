import { useEffect, useState } from 'react';
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

// After a tap or a drag, the thumb stays where the user put it until the player reports a
// position this close to it (as a fraction of the track: 1% is about 20 s of a 35-minute lecture,
// more than a seek ever lands off by).
const seekArrivedTolerance = 0.01;

// ...or until this long has passed, so the thumb can't stay stuck there if the seek fails.
const pendingSeekTimeoutMs = 1500;

// True once the player's reported progress has caught up with the place the user seeked to.
export function hasSeekArrived(progress: number, pendingFraction: number): boolean {
  const distance = Math.abs(progress - pendingFraction);
  return distance <= seekArrivedTolerance;
}

type ShownProgressInput = {
  progress: number;
  dragFraction: number | null;
  pendingFraction: number | null;
};

// Where the thumb is drawn: under the finger while dragging, then where the user seeked to until
// the player gets there, otherwise the player's progress.
export function pickShownProgress({ progress, dragFraction, pendingFraction }: ShownProgressInput): number {
  if (dragFraction !== null) {
    return dragFraction;
  }
  if (pendingFraction !== null) {
    return pendingFraction;
  }
  return progress;
}

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
// The same goes for the place a tap or a drag seeked to (pendingFraction): a seek takes about
// 0.25–1 s (the player has to fetch audio at the new place), and the progress prop only changes
// once it's done. Without it, a tap would move the thumb late, and the end of a drag would show
// the old position for a moment before the new one. It's transient touch feedback; the real
// position stays in the player.
export function SeekBar({ progress, elapsed, remaining, accessibilityValue, onSeek, onAccessibilityStep }: SeekBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragFraction, setDragFraction] = useState<number | null>(null);
  const [pendingFraction, setPendingFraction] = useState<number | null>(null);

  // The player has reached the place the user seeked to: follow its progress again. Set during
  // render (React's pattern for state that follows a prop), not in an effect, so the thumb never
  // draws one frame with the stale value.
  if (pendingFraction !== null && hasSeekArrived(progress, pendingFraction)) {
    setPendingFraction(null);
  }

  // The seek never arrived (it failed, or landed further away): give up waiting.
  useEffect(() => {
    if (pendingFraction === null) {
      return;
    }
    const timeout = setTimeout(() => {
      setPendingFraction(null);
    }, pendingSeekTimeoutMs);
    return () => {
      clearTimeout(timeout);
    };
  }, [pendingFraction]);

  function handleTrackLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  function seekTo(x: number) {
    if (!onSeek) {
      return;
    }
    const fraction = fractionAlongTrack(x, trackWidth);
    setPendingFraction(fraction);
    onSeek(fraction);
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

  const shownProgress = pickShownProgress({ progress, dragFraction, pendingFraction });
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
