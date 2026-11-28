# On web, the hidden half of the player stays visible to screen readers

Status: open. Found on 2026-11-28 while testing the player sheet on web
([player-sheet-test-plan.md](../player-sheet-test-plan.md), results "Screen readers"). Not caused by
the drag fix. iOS is unaffected.

## Summary

The player sheet draws Now Playing and the bar at the same time and hides one of them. On iOS the
hidden one is removed from the accessibility tree. On web it isn't:

- While Now Playing is **closed**, its controls (Minimise player, Back 15 seconds, Play/Pause,
  Seek position, the event pill) are still in the accessibility tree, although they are below the
  screen.
- While Now Playing is **open**, the bar's "Open player: …" and its Play/Pause are still there,
  although the bar's row is invisible.

A screen reader on web can move to controls that aren't on screen, and reads two Play/Pause buttons.

## Why

`src/features/player/now-playing-panel.tsx` hides Now Playing with `accessibilityElementsHidden`
(iOS) and `importantForAccessibility="no-hide-descendants"` (Android). The bar's row in
`mini-player-bar.tsx` does the same. React Native Web doesn't turn either prop into `aria-hidden`,
so the browser still exposes those elements.

## How to reproduce

1. Run the web build with lecture data (the local website: see the test plan's "Web setup").
2. With nothing open, in the browser's dev tools (or Playwright), list elements with
   `aria-label="Minimise player"`: one is there, with its top below the window.
3. Open Now Playing and list `[aria-label^="Open player"]`: it is there, at the top of the window.

## Options

1. **Add `aria-hidden` on web** next to the existing props: `aria-hidden={!isOpen}` on Now Playing's
   panel and the matching value on the bar's row. React Native Web passes `aria-hidden` through.
   Check that it doesn't change iOS or Android (React Native 0.88 also maps `aria-hidden`).
2. **Don't render the hidden half on web.** Simpler for screen readers, but the morph draws both
   halves during a drag, so this would need care.

Option 1 is the small, direct fix.

## Checking a fix

On web: with Now Playing closed, no element of Now Playing is in the accessibility tree; with it
open, the bar's row isn't. On iOS: VoiceOver still reaches the bar while closed and stays inside
Now Playing while open (`accessibilityViewIsModal`). Add a component test that checks the
`aria-hidden` value for both states.
