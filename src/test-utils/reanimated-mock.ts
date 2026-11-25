// TEST ONLY. A stand-in for the few parts of react-native-reanimated the app uses.
// Reanimated 4's own mock loads its native initializer under jest-expo's iOS preset and throws
// ("setCSSEventHandler is not available in JSReanimated"), so jest.setup.ts uses this instead.
// Animations finish at once: assigning withSpring(1) sets the value to 1 and calls the completion
// callback with finished = true. That is what the tests need.
import { View } from 'react-native';

// An animation, as this mock represents it: where it ends, and what to call when it gets there.
type FakeAnimation<Value> = {
  isFakeAnimation: true;
  toValue: Value;
  callback?: (finished?: boolean) => void;
};

function isFakeAnimation<Value>(value: unknown): value is FakeAnimation<Value> {
  return typeof value === 'object' && value !== null && 'isFakeAnimation' in value;
}

type SharedValue<Value> = {
  get: () => Value;
  set: (value: Value | FakeAnimation<Value>) => void;
};

function makeMutable<Value>(initialValue: Value): SharedValue<Value> {
  let currentValue = initialValue;
  return {
    get: () => currentValue,
    set: (value) => {
      if (isFakeAnimation<Value>(value)) {
        currentValue = value.toValue;
        if (value.callback) {
          value.callback(true);
        }
        return;
      }
      currentValue = value;
    },
  };
}

function useSharedValue<Value>(initialValue: Value): SharedValue<Value> {
  return makeMutable(initialValue);
}

function useAnimatedStyle<Style>(makeStyle: () => Style): Style {
  return makeStyle();
}

// The player's resting check (a reaction to the sheet's index). Nothing moves in tests, so it never
// reports; what it reports to (handleSheetSettled) is tested on its own.
function useAnimatedReaction(): void {}

function withTiming<Value>(toValue: Value, _config?: unknown, callback?: (finished?: boolean) => void): FakeAnimation<Value> {
  return { isFakeAnimation: true, toValue, callback };
}

function withSpring<Value>(toValue: Value, _config?: unknown, callback?: (finished?: boolean) => void): FakeAnimation<Value> {
  return { isFakeAnimation: true, toValue, callback };
}

function withDelay<Value>(_delayMs: number, animation: FakeAnimation<Value>): FakeAnimation<Value> {
  return animation;
}

// A sequence ends where its last step ends. Only the last step's callback matters here.
function withSequence<Value>(...animations: FakeAnimation<Value>[]): FakeAnimation<Value> {
  return animations[animations.length - 1];
}

function interpolate(value: number, input: number[], output: number[]): number {
  const [inputStart, inputEnd] = input;
  const [outputStart, outputEnd] = output;
  let progress = (value - inputStart) / (inputEnd - inputStart);
  if (progress < 0) {
    progress = 0;
  }
  if (progress > 1) {
    progress = 1;
  }
  return outputStart + (outputEnd - outputStart) * progress;
}

// Colours aren't checked in tests: the start colour is enough.
function interpolateColor(_value: number, _input: number[], output: string[]): string {
  return output[0];
}

const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };

const Easing = {
  bezier: () => () => 0,
  out: () => () => 0,
  inOut: () => () => 0,
  cubic: () => 0,
  quad: () => 0,
};

function useReducedMotion(): boolean {
  return false;
}

// FadeIn.duration(200) and FadeOut.duration(200) return a layout animation; here, nothing.
const layoutAnimation = {
  duration: () => undefined,
};

const Animated = {
  View,
};

export default Animated;
export {
  Easing,
  Extrapolation,
  layoutAnimation as FadeIn,
  layoutAnimation as FadeOut,
  interpolate,
  interpolateColor,
  makeMutable,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
};
