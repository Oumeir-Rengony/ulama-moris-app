# Now Playing's controls are off-screen at the largest text size

Status: open. Found on 2026-11-28 while testing the player sheet (case G2 in
[player-sheet-test-plan.md](../player-sheet-test-plan.md)). Not caused by the drag fix.

## Summary

At the largest accessibility text size, Now Playing lays out its seek bar and play button below the
bottom of the screen. Touch can't reach them: the user can't play, pause or seek from Now Playing.

## What was measured

iPhone 17 simulator (874 pt tall), text size `accessibility-extra-extra-extra-large`, Expo Go:

| Element | Centre y |
|---|---|
| Seek bar | 877 |
| Play/pause | 1013 |

The title, speaker, venue and date take most of the screen. The artwork has already shrunk to
about a third of its usual size.

## Why

Now Playing (`src/features/player/now-playing-view.tsx`) is a plain view laid out once at the screen's
size and clipped by the player card ("A plain View, not a ScrollView: the artwork shrinks so
everything fits"). At this text size, shrinking the artwork isn't enough, and the rest is cut off.

## How to reproduce

1. `xcrun simctl ui booted content_size accessibility-extra-extra-extra-large`, then restart Expo Go.
2. Open a lecture in Now Playing (a row's play button, or `/player?slug=…`).
3. The controls are below the screen; `axe describe-ui` shows their frames past y 874.

Undo with `xcrun simctl ui booted content_size large`.

## Options

1. **Cap the text in Now Playing's header** (title, speaker, venue, date) with
   `maxFontSizeMultiplier`, as the bar and the tab bar do. Smallest change; the controls stay where
   they are.
2. **Let Now Playing scroll at large sizes.** The sheet's drag would fight a plain `ScrollView`; it
   would need gorhom's scrollable components and a check of the drag rules
   (`enableContentPanningGesture` must not change).
3. **Pin the controls to the bottom** and let the header take what's left (shorten or truncate the
   title). The controls are what the user needs most.

Option 3, with a cap on the title as in option 1, keeps the controls reachable without adding
scrolling to the sheet.

## Checking a fix

Run G2 in the test plan: the sheet still lands on the bar (its height comes from the measured bar),
and every control on Now Playing is on screen and works.
