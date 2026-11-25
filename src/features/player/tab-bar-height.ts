import { createContext, use } from 'react';

// The tab bar's measured height (bottom inset included), 0 until it has been laid out. Provided
// by the tabs layout, which draws the tab bar over the screens. The navigator no longer reserves
// room for it, so every tab screen adds it to its bottom padding.
export const TabBarHeightContext = createContext(0);

export function useTabBarHeight(): number {
  return use(TabBarHeightContext);
}
