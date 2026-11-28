# Player sheet: caveats and risks

The mini player and Now Playing are one `@gorhom/bottom-sheet` (5.2.14) that morphs from the bar
into the full player (`src/features/player/now-playing-panel.tsx`). This note lists what can go
wrong with that setup: things gorhom does on its own, gaps in our fix for
[drag-past-bar-stops-playback](issues/drag-past-bar-stops-playback.md), and the touch conflicts inside
the sheet.

Each item says whether it is **confirmed** (read in the library source or seen in the simulator) or a
**hypothesis** (follows from the code, not yet seen). The IDs in brackets point to cases in
[player-sheet-test-plan.md](player-sheet-test-plan.md).

Positions used below, on the iPhone 17 simulator (402 × 874 pt): the full player's top edge is at
y = 0, the bar's top edge at about y = 705. So the sheet travels about 705 pt between the bar and
the full player, and about 170 pt between the bar and "gone" (below the screen).

## How gorhom decides where a drag ends

### 1. A release goes to the nearest end of a projected point, not "past half way"

Confirmed (`utilities/snapPoint.ts`). On release gorhom works out
`position + 0.2 × velocity` and picks the nearest of: gone (only while pan down to close is on),
the bar, the full player. There is no distance or velocity threshold of its own.

What follows from it:

- A slow release (velocity near 0) goes to whichever end is nearer: past about 350 pt of travel the
  sheet finishes the move, before it springs back.
- A flick of 1,750 pt/s adds 350 pt, so a short fast flick goes all the way.
- **On the bar, a sloppy downward drag can stop playback.** Gone is only about 170 pt below the
  bar. Measured on iOS: a slow drag stops playback somewhere between 85 and 120 pt, a flick between
  20 and 50 pt. Whether a 50 pt flick is too easy to hit by accident is a product decision. [B3]

### 2. The sheet stops at the ends while the finger keeps going

Confirmed (`enableOverDrag={false}`, `useGestureEventsHandlersDefault.tsx`). The sheet is clamped
at the highest and lowest points, but gorhom keeps adding up the finger's movement. After dragging
past an end, the finger has to come all the way back before the sheet moves again. The release
calculation uses the unclamped finger position, so a flick back from far past an end can come out
differently from what the user sees. [D3, D4]

With our fix, while Now Playing is open, the lowest point is the bar. So a drag from Now Playing
that carries on past the bar leaves the sheet pinned at the bar while the finger keeps going (this
is the intended "floor").

### 3. A cancelled drag still ends with a snap

Confirmed (Gesture Handler 3.3, `useAnimatedGesture.ts`): when an active gesture is cancelled or
fails (a system gesture takes over, a call comes in, the app goes to the background), `onEnd`
still runs, then `onFinalize`. gorhom snaps from wherever the finger was, using the velocity at that
moment. Our drag flag clears in both. Where the sheet ends up after an interruption is not tested.
[G3, G4]

### 4. gorhom's callbacks are late or skipped

Confirmed, already handled: `onAnimate`, `onChange` and `onClose` fire late, or not at all when a
spring is interrupted. The app never uses them (`player-rules.test.ts`).

### 5. Changing `enableContentPanningGesture` remounts the player

Confirmed, already handled: gorhom swaps the view around its content. It stays `{true}`.

### 6. Changing `enablePanDownToClose` rebuilds the drag handlers

Confirmed (it is in gorhom's internal context and in the handlers' dependency lists). It doesn't
remount anything, and the simulator showed no blink. It does mean the drag's callbacks are
replaced each time Now Playing opens or closes. If that ever happens during a drag (only when
something else changes the store mid-drag: the queue ending, a deep link), the new handlers take
over half-way. Not tested. [E6]

### 7. Snap points move when the bar's height or the tab bar changes

Confirmed: the bar's position is `tabBarHeight + gap + measured bar height`. It changes when the
bar is first measured, when the text size changes, and when the tab bar is measured. gorhom then
animates the sheet to the new position on its own. The resting check doesn't mind (the index stays
0), but a change during a drag or a spring is untested. [G2]

### 8. Reduce Motion

Confirmed, no problem found. gorhom leaves Reanimated's Reduce Motion setting at "follow the
system". With iOS Reduce Motion on, opening jumps to Now Playing in one frame instead of growing.
gorhom's source warns a sheet may not appear at all with Reduce Motion; that didn't happen: the row
tap, the chevron, the bar tap and the drags all ended at the right end. [G1]

### 9. The keyboard

Confirmed: gorhom only moves the sheet for a keyboard opened from its own `BottomSheetTextInput`.
Search's keyboard doesn't move it, and the app's own `useKeyboardHeight` lifts the bar instead.
Dragging the bar while the keyboard is open is untested. [F2]

### 10. Android and web

- Android: gorhom's default is a timing curve; the app passes a spring (`SHEET_SPRING`) so both
  platforms match. Known and accepted: a slow drag down that starts near the top of the full player
  springs back on Android. With gesture navigation, a drag that *starts* at the bottom edge goes to
  the home screen instead of moving the bar. Nothing has been tried on an Android device. [H1–H4]
- Web: the same import resolves to gorhom's `.web.tsx` handlers, which our wrapper also wraps. Mouse
  drags use pointer events. Tested: drags, holds, direction changes and grabs mid-spring all end
  right. Testing needs the local website (the live API doesn't allow `localhost:8081`). [Web section]

## Gaps in our fix

The fix has two rules: the resting check ignores the sheet while a finger drags it
(`isDraggingSheet`, set by `useDragTrackingHandlers` through gorhom's public `gestureEventsHandlersHook`),
and `enablePanDownToClose` is off while Now Playing is open.

### 11. Letting go exactly at an end while flicking towards the other end

Hypothesis, not reproduced. On web, the store's state was logged every frame through D3 and D4
(drag past an end, hold, flick back, at seven flick lengths): it changed once, at the end, every
time. When the finger lets go while the sheet is still pinned at an end, gorhom keeps it there, so
the double report never came up. Keep the case in the plan. The drag flag clears on release, but the spring starts on the same frame. If the sheet
is still within 1% of an end at that moment (for example, it is pinned at the bar because the finger
went past it, and the user flicks back up), the resting check reports that end once, and then the
other end when the spring stops.

Example: from Now Playing, drag past the bar, keep the finger down, flick back up. The check reports
`'bar'` (Now Playing recorded as closed), then `'full'` (open again). The end result is right, but
for about a third of a second the store says closed: the tab screens are shown behind the sheet
and the bar's row becomes touchable.

The earlier version of the fix also checked gorhom's internal "spring running" flag, which covered
this. If it shows up in testing, the fix that keeps to public API is to also need the index to be
unchanged between two frames before reporting. [D3, D4]

### 12. Grabbing the sheet while it shrinks after the chevron or Android back

Hypothesis, not reproduced: on web, grabs 60, 120 and 200 ms after the chevron followed by a hard
flick down all ended at the bar, still playing. Android back is untested. The chevron writes "closed" to the store first, so pan down to close turns back on
straight away, while the sheet is still shrinking from the full player. If the user grabs it during
that spring and flicks down hard, it can reach `'gone'`, which stops playback. Visually the user
grabbed Now Playing. This may be acceptable (they had asked to close it), but it breaks the rule
"nothing on Now Playing stops playback" in a narrow case. [E3]

### 13. The store follows the sheet one render later

Confirmed, harmless so far. The resting check runs on the UI thread, but the store update and the
new `enablePanDownToClose` value need a React render. If the JS thread is busy (a long list
rendering), a swipe on the bar right after it lands may be held at the bar because pan down to close
is still off. The next swipe works. [E7]

### 14. Jest never runs the drag wrapper

Confirmed. gorhom's Jest mock never calls `gestureEventsHandlersHook`, and the Reanimated mock's
`useAnimatedReaction` never fires. The rules test only checks the wiring (the prop is passed, the
check reads `isDraggingSheet`, `useBottomSheetInternal` is never used). A mistake in the wrapper
only shows on a device or in the browser.

### 15. Upgrading gorhom

The wrapper depends on `useGestureEventsHandlersDefault` and the shape of its return value
(`handleOnStart`, `handleOnChange`, `handleOnEnd`, `handleOnFinalize`). Both are public and typed,
so a change should fail the type check. Still re-run the core cases [A1–A4, B1–B3] after any upgrade.

## Touches inside the sheet

### 16. The seek bar and the sheet compete for the same finger

Confirmed (settings): the seek bar's drag starts after 4 pt sideways and fails after 12 pt up or
down. The sheet's drag starts after 8 pt up or down and fails after 12 pt sideways. A diagonal drag
that starts on the seek bar is decided by which threshold the finger crosses first. A vertical drag
started on the seek bar moves the sheet and doesn't seek (tested). Measured: over a 200 pt scrub,
up to about 36 pt of vertical drift (10°) still seeks; 54 pt (15°) hands the touch to the sheet and
the seek is lost. Reasonable, but a sloppy scrub can be dropped. [C4, C5]

### 17. Buttons under a drag

Confirmed fine: a drag that starts on play/pause, skip 15, the chevron, the event pill or the bar's
play button moves the sheet, and the button doesn't fire. [C1–C3, C6, C7]

### 18. The bar's tap and the sheet's drag

Confirmed (settings): the bar's tap allows 10 pt of movement; the sheet's drag starts at 8 pt.
Between 8 and 10 pt both could claim the finger. Tested with a 9 pt move: nothing happens (neither
opens), which is acceptable. [C7]

### 19. Now Playing can't scroll

Now Playing is a plain view laid out at screen size (the artwork shrinks so everything fits).
**Confirmed problem, not caused by the drag fix:** at the largest text size the seek bar and the
play button are laid out below the bottom of the screen (y 877 and 1013 on an 874 pt screen), so
touch can't reach them. Adding a scroll view later would fight the
sheet's drag unless it uses gorhom's own scrollable components. [G2]

### 20. Speed and frame rate

The morph is a function of the sheet's index, so it looks the same at any speed; at very high speed
frames are simply skipped. With the drag flag, the resting check no longer depends on a frame
landing inside the ±1% window, so 60 Hz and 120 Hz screens behave the same. Only checked at 60 Hz
(the simulator).

### 21. On web, the hidden half of the player stays in the accessibility tree

Confirmed, not caused by the drag fix. `accessibilityElementsHidden` and `importantForAccessibility`
have no effect on web, so while Now Playing is closed its controls are still in the accessibility
tree, and while it is open the bar's "Open player" and Pause are. A screen reader on web can reach
controls that aren't on screen. iOS is unaffected.
