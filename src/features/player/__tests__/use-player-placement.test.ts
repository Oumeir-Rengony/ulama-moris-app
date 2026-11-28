import { renderHook } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';

import { usePlayerPlacementStyle } from '@/features/player/use-player-morph';

const tabBarHeight = 83;
const bottomInset = 34;

type Placement = {
  sheetIndex: number;
  outsideTabs: number;
  keyboardHeight: number;
};

// The style is { transform: [{ translateY }] }: how far the player moves down (positive) or up.
async function shiftFor({ sheetIndex, outsideTabs, keyboardHeight }: Placement): Promise<number> {
  const { result } = await renderHook(() =>
    usePlayerPlacementStyle({
      sheetIndex: makeMutable(sheetIndex),
      outsideTabsProgress: makeMutable(outsideTabs),
      keyboardHeight: makeMutable(keyboardHeight),
      tabBarHeight,
      bottomInset,
    }),
  );
  // The mock's useAnimatedStyle returns the plain style object.
  const style = result.current as unknown as { transform: { translateY: number }[] };
  // `+ 0` turns −0 (a zero shift multiplied by a negative number) into 0.
  return style.transform[0].translateY + 0;
}

describe('usePlayerPlacementStyle', () => {
  it('on a tab screen, the bar stays where the sheet puts it: above the tab bar', async () => {
    expect(await shiftFor({ sheetIndex: 0, outsideTabs: 0, keyboardHeight: 0 })).toBe(0);
  });

  it('outside the tabs (Search), the bar drops into the tab bar’s place, above the safe area', async () => {
    expect(await shiftFor({ sheetIndex: 0, outsideTabs: 1, keyboardHeight: 0 })).toBe(tabBarHeight - bottomInset);
  });

  it('with the keyboard open on Search, the bar rides on top of the keyboard', async () => {
    const keyboardHeight = 336;
    // The sheet places the bar on top of the tab bar; it moves up by the rest of the keyboard.
    expect(await shiftFor({ sheetIndex: 0, outsideTabs: 1, keyboardHeight })).toBe(tabBarHeight - keyboardHeight);
  });

  it('the full player is never moved, so it always fills the screen', async () => {
    expect(await shiftFor({ sheetIndex: 1, outsideTabs: 1, keyboardHeight: 336 })).toBe(0);
  });

  it('on a tab screen, a keyboard no taller than the tab bar doesn’t move the bar', async () => {
    expect(await shiftFor({ sheetIndex: 0, outsideTabs: 0, keyboardHeight: 60 })).toBe(0);
  });

  it('on a tab screen, a taller keyboard lifts the bar to just above it', async () => {
    expect(await shiftFor({ sheetIndex: 0, outsideTabs: 0, keyboardHeight: 336 })).toBe(tabBarHeight - 336);
  });

  it('while the tab bar is halfway out of the way, the bar has dropped halfway', async () => {
    const halfTheDrop = (tabBarHeight - bottomInset) / 2;
    expect(await shiftFor({ sheetIndex: 0, outsideTabs: 0.5, keyboardHeight: 0 })).toBe(halfTheDrop);
  });

  it('halfway to the full player, half the shift is left', async () => {
    const halfTheDrop = (tabBarHeight - bottomInset) / 2;
    expect(await shiftFor({ sheetIndex: 0.5, outsideTabs: 1, keyboardHeight: 0 })).toBe(halfTheDrop);
  });

  it('below the bar (gone, or swiped down), the whole shift applies', async () => {
    expect(await shiftFor({ sheetIndex: -1, outsideTabs: 1, keyboardHeight: 0 })).toBe(tabBarHeight - bottomInset);
  });
});
