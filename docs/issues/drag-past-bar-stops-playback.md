# Dragging Now Playing past the bar can stop playback

Status: fixed on `fix/now-playing-drag-past-bar` (checked in the iOS simulator; not yet on Android
or web). Introduced with "swipe the bar down to stop and close" (commit `c38846a`).

The fix takes two rules from Material's `BottomSheetBehavior` (which NewPipe uses):

- **The resting check ignores the sheet while a finger drags it.** gorhom's drag handlers are
  wrapped through its public `gestureEventsHandlersHook` prop (`useDragTrackingHandlers`), which
  sets `isDraggingSheet` when a drag starts and clears it when it ends. Passing through the bar
  mid-drag no longer counts. This replaces the "still for a few frames" idea in option 2 below,
  which would still fire if the finger paused on the bar and then carried on down. Springs need no
  check: with the next rule, a spring from Now Playing only reaches the bar by ending there.
- **Pan down to close is on only while Now Playing is closed.** From Now Playing the bar is the
  lowest point: a drag stops there under the finger, and a hard flick lands on the bar instead of
  dipping below the screen and springing back.

## Summary

If Now Playing is open and the user drags it down in one continuous gesture, past the bar's
position and down to the bottom of the screen, playback usually stops. The intended behaviour
is that nothing started on Now Playing stops playback: the sheet should only shrink back to the
bar. Only a swipe that starts on the bar should stop playback.

## Background: how the sheet reports where it is

The player is one `@gorhom/bottom-sheet` (`src/features/player/now-playing-panel.tsx`) with three
positions, measured by the sheet's index:

| Index | Position |
|---|---|
| 1 | Full Now Playing |
| 0 | The mini player bar |
| −1 | Gone, below the screen |

The app doesn't use gorhom's callbacks (`onChange`, `onAnimate`, `onClose`), because they fire
late, or not at all when a spring is interrupted. Instead a `useAnimatedReaction` watches the index
on every frame and reports when it lands near one of the positions (the thresholds are in
`src/features/player/player-motion-config.ts`):

- index ≥ 0.99 → `'full'`
- −0.01 ≤ index ≤ 0.01 → `'bar'`
- index ≤ −0.99 → `'gone'`

Each report goes to `handleSheetSettled` in `src/features/player/open-now-playing.ts`:

- `'bar'` → Now Playing counts as closed (`nowPlayingPresentation = 'closed'`).
- `'gone'` while Now Playing is closed → the bar was swiped away: `dismissMiniPlayer` stops and
  clears the session.
- `'gone'` while Now Playing is open → only Now Playing closes, and the sheet springs back to the bar.

The check only looks at where the sheet is. It can't tell whether the finger is still on the
screen, so a sheet passing through a position looks the same as a sheet resting there.

## What goes wrong

1. Now Playing is open (index 1).
2. The user drags it down without lifting their finger.
3. On the way down the index passes through 0. If one frame lands inside the −0.01 to 0.01
   window, the check reports `'bar'` while the drag is still going.
4. `handleSheetSettled('bar')` records Now Playing as closed.
5. The user keeps dragging and lets go below the bar. The sheet comes to rest at `'gone'`.
6. `handleSheetSettled('gone')` sees Now Playing closed, treats it as a swipe on the bar, and
   **stops playback**.

If no frame lands inside the window (a fast flick), Now Playing still counts as open at step 6.
It then only closes and the sheet springs back to the bar, which is the intended result.

## How likely it is

The −0.01 to 0.01 window is 2% of the distance between the bar and the full player. On a phone
that distance is roughly 700 pt, so the window is about 14 pt tall. At 60 frames per second, a
drag slower than about 840 pt per second will almost always put a frame inside it. That is a
normal drag speed. Only a quick flick skips the window.

## What is not affected

- Dragging Now Playing down to the bar and letting go: it closes to the bar and keeps playing.
- Swiping the bar itself down: it stops playback, as intended.
- The screen-reader action "Stop and close player": unchanged.

## How to reproduce (iOS simulator)

1. Start Metro (`npx expo start --ios`) and open the app in Expo Go.
2. Tap a lecture's play button. Now Playing opens and the lecture plays.
3. In one gesture, drag from the middle of Now Playing down to the bottom edge of the screen at a
   moderate speed, without stopping at the bar, then let go.
4. Expected: the sheet comes back to the bar and the lecture keeps playing.
   Actual: the bar disappears and playback stops.

With AXe, a drag split into many small steps reproduces the slow case, and
`axe swipe --delta 6` gives a quick flick for comparison.

## Options

### 1. Leave it

Dragging Now Playing all the way off the screen in one gesture stops playback. Some people would
find that natural. If chosen, update the rule "nothing on Now Playing can stop playback" in
`AGENTS.md` and the test comment in `src/features/player/__tests__/player-rules.test.ts`.

### 2. Report `'bar'` only once the sheet is still (recommended)

Count the sheet as resting at the bar only when it actually stops there, not when it passes
through. For example, require the index to stay inside the window for a few frames in a row
before reporting `'bar'`. Then:

- Dragging Now Playing past the bar in one gesture never records it as closed on the way. Coming
  to rest at `'gone'` therefore only closes it and springs it back to the bar.
- Stopping playback always takes a separate swipe that starts on the bar.
- Matches the existing rule that nothing on Now Playing stops playback.

Things to check with this fix:

- The row tap with nothing loaded (`isWaitingAtBarToOpen`): the sheet jumps to the bar and must
  still be reported there before it grows into the full player.
- A drag from Now Playing that ends at the bar must still report `'bar'` once the spring settles.
- The fix must stay on the UI thread (in the reaction's worklet), with `.get()` / `.set()` and
  `scheduleOnRN`, never `runOnJS` or `.value` (enforced by `player-rules.test.ts`).
- Jest can't check it: the Reanimated mock's `useAnimatedReaction` never fires. It has to be
  checked on a device or the simulator with the steps above.
