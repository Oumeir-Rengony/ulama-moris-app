import {
  makeMutable,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import {
  COLLAPSE_TIMING,
  MINI_DROP_DISTANCE_PX,
  MINI_EXIT_EASING,
  MINI_EXIT_LIFT_PX,
  MINI_EXIT_LIFT_SHARE,
  MINI_EXIT_MS,
  MINI_RISE_SPRING,
  MORPH_SPRING,
  REDUCED_BAR_FADE_MS,
  REDUCED_FADE_MS,
  SHEET_SPRING,
  SNAP_BACK_SPRING,
} from './player-motion-config';
import { emptyRect, type Rect, type SurfaceGeometry } from './player-surface-geometry';

// The player surface's motion: three shared values, plus the commands that animate them.
//
// Created at module scope (like the audio player), so the flows in open-now-playing.ts can drive
// the motion without a component or a context. This file never imports the store or the engine:
// the flows decide *whether* something happens, this file decides *how it moves*, and reports back
// through `onFinished`.
//
// Every frame is computed on the UI thread from these values. React never renders per frame.
// Read and write with .get() / .set(), never the `value` property (the React Compiler can't see through it).

// 0 = the bar, 1 = the full player. Drives the morph. The swipe on Now Playing scrubs it.
export const expand = makeMutable(0);
// The full player's offset during a fresh entrance only: the window height → 0. 0 otherwise.
export const enterY = makeMutable(0);
// 0 = the bar in place, 1 = dropped away (70 px down, transparent). Also the bar's rise.
export const miniDrop = makeMutable(0);
// The whole surface's opacity. 1, except during a Reduce Motion crossfade.
export const surfaceOpacity = makeMutable(1);
// The layout the motion is computed from, written from JS on layout (PlayerSurface) and read in
// worklets. One shared value per measurement, each written whole: on native, a JS write reaches
// the UI thread later, so "read the geometry, change one field, write it back" could read a stale
// copy and erase a field written a moment before.
export const windowSizeValue = makeMutable({ width: 0, height: 0 });
export const miniRectValue = makeMutable<Rect>(emptyRect);
export const coverRectValue = makeMutable<Rect>(emptyRect);

export function readSurfaceGeometry(): SurfaceGeometry {
  'worklet';
  const windowSize = windowSizeValue.get();
  return {
    windowWidth: windowSize.width,
    windowHeight: windowSize.height,
    miniRect: miniRectValue.get(),
    coverRect: coverRectValue.get(),
  };
}

// Set by PlayerSurface from useReducedMotion(). A module variable, so the flows' commands can
// check it without a component, plus a shared value with the same answer for the animated styles
// (a worklet can't read a plain JS variable that changes later).
let prefersReducedMotion = false;
export const reducedMotion = makeMutable(false);

export function setPrefersReducedMotion(isReduced: boolean): void {
  prefersReducedMotion = isReduced;
  reducedMotion.set(isReduced);
}

// Called with true when the animation reached its target, false when a newer animation replaced
// it (a retarget). Callers must only act on true.
export type OnMotionFinished = (finished: boolean) => void;

type MotionCommand = {
  onFinished: OnMotionFinished;
};

// The animation callback runs on the UI thread. It hands the result back to JS once.
function reportTo(onFinished: OnMotionFinished) {
  return (finished?: boolean) => {
    'worklet';
    scheduleOnRN(onFinished, finished === true);
  };
}

// Reduce Motion: fade the surface out, jump the value to its target at the midpoint, fade back in.
function crossfadeTo(value: SharedValue<number>, target: number, onFinished: OnMotionFinished): void {
  const halfFadeMs = REDUCED_FADE_MS / 2;
  surfaceOpacity.set(
    withSequence(
      withTiming(0, { duration: halfFadeMs }),
      withTiming(1, { duration: halfFadeMs }, reportTo(onFinished)),
    ),
  );
  value.set(withDelay(halfFadeMs, withTiming(target, { duration: 0 })));
}

// 6.1: nothing showing → the full player springs up from below the screen.
export function enterFresh({ onFinished }: MotionCommand): void {
  miniDrop.set(0);
  expand.set(1);

  if (prefersReducedMotion) {
    enterY.set(0);
    surfaceOpacity.set(0);
    surfaceOpacity.set(withTiming(1, { duration: REDUCED_FADE_MS }, reportTo(onFinished)));
    return;
  }

  surfaceOpacity.set(1);
  const windowHeight = windowSizeValue.get().height;
  enterY.set(windowHeight);
  enterY.set(withSpring(0, SHEET_SPRING, reportTo(onFinished)));
}

// 6.3: the bar grows into the full player. From a collapse still running, the spring starts from
// the current value and speed (6.9).
export function expandFromMini({ onFinished }: MotionCommand): void {
  miniDrop.set(0);

  if (prefersReducedMotion) {
    crossfadeTo(expand, 1, onFinished);
    return;
  }

  expand.set(withSpring(1, MORPH_SPRING, reportTo(onFinished)));
}

// 6.2: the chevron or Android back. The full player shrinks into the bar.
export function collapseToMini({ onFinished }: MotionCommand): void {
  if (prefersReducedMotion) {
    enterY.set(0);
    crossfadeTo(expand, 0, onFinished);
    return;
  }

  expand.set(withTiming(0, COLLAPSE_TIMING, reportTo(onFinished)));
}

// 6.4 and 6.6: the bar lifts a little, then falls 70 px and fades. Takes MINI_EXIT_MS, which the
// flows wait for. From a drag, it continues from where the finger left it.
export function dropMini(): void {
  if (prefersReducedMotion) {
    miniDrop.set(withTiming(1, { duration: REDUCED_BAR_FADE_MS }));
    return;
  }

  // After a swipe the finger has already pulled the bar down. A lift now would bring it back into
  // view for a moment, so it just keeps falling from where it is.
  const hasAlreadyMoved = miniDrop.get() > 0;
  if (hasAlreadyMoved) {
    miniDrop.set(withTiming(1, { duration: MINI_EXIT_MS, easing: MINI_EXIT_EASING }));
    return;
  }

  const liftAsDropShare = -MINI_EXIT_LIFT_PX / MINI_DROP_DISTANCE_PX;
  const liftMs = MINI_EXIT_MS * MINI_EXIT_LIFT_SHARE;
  const fallMs = MINI_EXIT_MS - liftMs;
  miniDrop.set(
    withSequence(
      withTiming(liftAsDropShare, { duration: liftMs }),
      withTiming(1, { duration: fallMs, easing: MINI_EXIT_EASING }),
    ),
  );
}

// 6.7: the bar appears without a collapse (for example, playing again from the lock screen
// after the queue ended).
export function riseMini(): void {
  expand.set(0);
  enterY.set(0);
  surfaceOpacity.set(1);

  if (prefersReducedMotion) {
    miniDrop.set(0);
    surfaceOpacity.set(0);
    surfaceOpacity.set(withTiming(1, { duration: REDUCED_BAR_FADE_MS }));
    return;
  }

  miniDrop.set(1);
  miniDrop.set(withSpring(0, MINI_RISE_SPRING));
}

// 6.6: a bar swipe released before the threshold.
export function snapMiniBack(): void {
  miniDrop.set(withSpring(0, SNAP_BACK_SPRING));
}

// 6.11: a deep link opens Now Playing during a cold start. No entrance.
export function showNowPlayingWithoutMotion(): void {
  expand.set(1);
  enterY.set(0);
  miniDrop.set(0);
  surfaceOpacity.set(1);
}

// 6.12: the window changed size. Jump to the resting position of the current presentation.
export function snapToRest(isOpen: boolean): void {
  let target = 0;
  if (isOpen) {
    target = 1;
  }
  expand.set(target);
  enterY.set(0);
}
