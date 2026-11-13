// TEST ONLY. A stand-in for the few parts of react-native-reanimated the app uses.
// Reanimated 4's own mock loads its native initializer under jest-expo's iOS preset and throws
// ("setCSSEventHandler is not available in JSReanimated"), so jest.setup.ts uses this instead.
// Values change at once (no animation), which is what the tests need.
import { View } from 'react-native';

type SharedValue<Value> = {
  get: () => Value;
  set: (value: Value) => void;
};

function useSharedValue<Value>(initialValue: Value): SharedValue<Value> {
  let currentValue = initialValue;
  return {
    get: () => currentValue,
    set: (value: Value) => {
      currentValue = value;
    },
  };
}

function useAnimatedStyle<Style>(makeStyle: () => Style): Style {
  return makeStyle();
}

function withTiming<Value>(toValue: Value): Value {
  return toValue;
}

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
  layoutAnimation as FadeIn,
  layoutAnimation as FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
};
