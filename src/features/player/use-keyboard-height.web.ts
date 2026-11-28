import { useSharedValue, type SharedValue } from 'react-native-reanimated';

// Web: Reanimated can't follow the keyboard there (it only logs a warning), and a phone browser
// already shrinks the page above its keyboard. So the height is always 0.
export function useKeyboardHeight(): SharedValue<number> {
  return useSharedValue(0);
}
