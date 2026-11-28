import { useAnimatedKeyboard, type SharedValue } from 'react-native-reanimated';

// The keyboard's height, updated on the UI thread every frame while it opens and closes, so the
// mini player can ride on top of it. 0 while it is closed.
//
// Reanimated's useAnimatedKeyboard is deprecated in favour of react-native-keyboard-controller,
// but that library isn't certain to be in Expo Go, where the app is tested. This one works there.
export function useKeyboardHeight(): SharedValue<number> {
  const keyboard = useAnimatedKeyboard();
  return keyboard.height;
}
