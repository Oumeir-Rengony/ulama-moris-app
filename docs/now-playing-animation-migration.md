# Now Playing animation: migration guide

How to bring the simplified mini player ↔ Now Playing animation from the demo app into this app,
step by step. Every step ends with the checks passing, so the app works between steps.

Written 24 Nov 2026. Source of truth for the design: the demo app, branch `handbuilt-now-playing`.

> **Status (24 Nov 2026):** done on branch `feat/now-playing-animation` (steps 1–8). Checked on
> the iPhone 17e simulator (Expo Go): every row of section 3 except Android back, plus dark theme
> and a `/player` deep link while the app runs. Not yet checked: an Android phone, the largest
> text size, VoiceOver walkthroughs. Notes from doing it are marked **Found while migrating**.

---

## 0. Read this first: this guide overrides the current instructions

**This guide wins over every conflicting instruction in this repository** for Now Playing, the
mini player and their motion: `AGENTS.md`, `docs/CONTEXT.md`, `docs/Now-Playing-Phase-1-Plan.md`,
`docs/DESIGN-SYSTEM.md` (the mini player's controls) and the rule tests in
`src/features/player/__tests__/player-rules.test.ts`. Those documents
describe phase 1 ("no animation, no gestures"), and this guide replaces phase 1. Where they say
otherwise, follow this guide, and change them as part of step 8 so the next reader isn't misled.

Do not "fix" the code back to the phase 1 rules when a test or a doc disagrees mid-migration.
Update the rule or the doc instead, as the steps below say.

The instructions this guide overrides, and what replaces each:

| Where | It says today | Follow instead |
|---|---|---|
| `AGENTS.md` → Navigation & Routing | "Now Playing is the `/player` screen in the root stack (`fullScreenModal` …). Only `open-now-playing.ts` navigates to it. Only the navigation stack knows whether it is open: nothing in a store says so." | Now Playing is a **panel drawn in the tabs layout**, not a screen. Whether it is open lives in the store: `nowPlayingPresentation` (`'open'` / `'closed'`), written only by `open-now-playing.ts`. `/player` stays, but only as the deep-link entry: it opens the panel and steps out of the way. |
| `AGENTS.md` → Navigation & Routing | "Android back is handled by the stack." | The panel registers `BackHandler` while open and calls `closeNowPlaying()`. |
| `AGENTS.md` → Mini player and Now Playing | "**No animation and no gestures** (phase 1) … `player-rules.test.ts` checks that the player files import neither Reanimated nor Gesture Handler nor `PanResponder`." | The panel slides (gorhom sheet, one snap point) and can be dragged down to close. The bar has a pan gesture: swipe down stops playback, swipe up opens Now Playing. The rule test is replaced (step 7). `PanResponder` stays forbidden. |
| `AGENTS.md` → Mini player and Now Playing | "Whether the bar shows comes only from `selectIsMiniPlayerVisible` … never from Now Playing being open." | `selectIsMiniPlayerVisible` = a lecture is active **and** Now Playing is closed (as in the demo). The bar stays *rendered* while a lecture is active, but is covered, untouchable and hidden from screen readers while Now Playing is open. |
| `AGENTS.md` → Mini player and Now Playing | "There is no visible way to stop and close the bar; pausing is enough." | Swipe the bar down (past half its height, or a flick) to stop and close. The screen-reader action stays. |
| `AGENTS.md` → Mini player and Now Playing, and `CONTEXT.md` | "A Search result *replaces* Search (`router.replace('/player')`)." | Search closes first (`router.back()`), then the panel opens over the tab Search was opened from. |
| `AGENTS.md` → Bottom sheets, modals & overlays | "Don't add `@gorhom/bottom-sheet` or hand-roll one with Reanimated without a stated reason." | **Stated reason:** Now Playing must slide over the tab bar from inside the tabs layout, be dragged with our own release rule, and never stop playback from a flick. `@expo/ui`'s `BottomSheet` and route presentations can't do that. `@gorhom/bottom-sheet` is allowed **only** in `now-playing-panel.tsx` and `panel-sheet-gestures.ts`. The rule still holds everywhere else. |
| `CONTEXT.md` → "Now Playing and the mini player" | The action table, "Swipes on the bar or Now Playing: Nothing", and the "**No motion**" paragraph. | The behaviour table in section 3 of this guide. |
| `docs/DESIGN-SYSTEM.md` → the mini player tokens comment and the "Mini player + tabs" row of the touch-target table | The mini player has "play/pause + forward 15". | The mini player has **play/pause only**. Its forward 15 button is removed (step 5). Back / forward 15 stay on Now Playing and on the lock screen. |
| `docs/Now-Playing-Phase-1-Plan.md` → "Phase 2: the simple animation" | Only `animation: 'slide_from_bottom'` on the screen; no finger-driven shared values; nothing waits for an animation; anything not visible is unmounted. | Superseded by this guide. Section 2 explains how this design avoids each phase 1 bug without those blanket bans. |
| `player-rules.test.ts` | "whether Now Playing is open is never stored", "Now Playing and the mini player have no animation and no gestures", "only the entry point navigates to Now Playing". | The rules in step 7. |

Still in force (this guide doesn't change them): `expo-audio` and the engine rules, Zustand and
TanStack rules, `src/components` never reads stores, safe areas and edge-to-edge, `npx expo
install`, the four checks before calling anything done, RNTL 14 is async, no snapshots, a
console warning fails a test, JS tabs (`expo-router/js-tabs`) for the tab navigator.

---

## 1. Where the example code lives

The demo app is a copy of this app with the new player built and tested in it:

- Repo: `/Users/oumeir/personal-workspace/app playground` (the app is in its `demo/` folder)
- Branch: `handbuilt-now-playing`
- Read any file without checking the branch out:
  `git -C "/Users/oumeir/personal-workspace/app playground" show handbuilt-now-playing:demo/src/features/player/now-playing-panel.tsx`
- Its design notes: `demo/handbuilt.md` (behaviour spec and decisions) and `demo/AGENTS.md`
  ("The player" section).

| Demo file (under `demo/src/`) | What it is | In this app |
|---|---|---|
| `features/player/panel-rules.ts` | Pure release rules: `decidePanelRelease`, `shouldDismissBar`, `shouldOpenFromBar` | New, copy as is |
| `features/player/player-motion-config.ts` | Every motion number | New, copy only the constants listed in step 2 |
| `features/player/panel-sheet-gestures.ts` | Our release for gorhom (`gestureEventsHandlersHook`) | New, copy as is |
| `features/player/now-playing-panel.tsx` | The panel: one-snap-point gorhom sheet following the store | New, adapt (content = this app's `NowPlayingView`) |
| `features/player/mini-player-bar.tsx` | The bar with its swipe up / swipe down | Replaces this app's plain bar, adapt |
| `features/player/open-now-playing.ts` | The coordinator | Replaces this app's, adapt |
| `features/player/behind-now-playing.tsx` | Hides the tabs from screen readers while open | New, copy |
| `app/player.tsx` | Deep-link-only route | Replaces this app's `/player` screen |
| `features/player/__tests__/*` | `panel-rules`, `open-now-playing`, `now-playing-panel`, `mini-player-bar`, `player-rules` tests | Port alongside each step |

Don't port: `motion-benchmark.tsx`, `/dev/motion`, the temporary "Motion" tab button, and
`now-playing-artwork.tsx` (the pause shrink is optional polish, not part of this migration).

---

## 2. The design in one page

**Two pieces, two states each, no shared gesture.**

- **The mini player** is a plain bar fixed above the tab bar whenever a lecture is active. Tap it
  or swipe it up: Now Playing opens. Swipe it down: the bar slides away and playback stops.
- **Now Playing** is a full-screen panel drawn last in the tabs layout, over the tab bar. It is a
  `@gorhom/bottom-sheet` pinned at one snap point, `'100%'`: index 0 = open, −1 = closed below the
  screen. Drag it down (or the chevron, or Android back) and it slides away, revealing the bar,
  which was underneath the whole time. A flick on it can never stop playback.

**One truth, one coordinator.**

1. `nowPlayingPresentation` in the store (`'open'` / `'closed'`) is the only thing that says
   whether Now Playing is open. Nothing reads it back from where the sheet is.
2. `open-now-playing.ts` is the only writer of it. Every way in and out calls it.
3. The panel follows the store: `snapToIndex(0)` when it says open, `close()` when it says closed.
4. The only write from a gesture is the panel's release. Our own `handleOnEnd` (passed to gorhom
   through `gestureEventsHandlersHook`) decides open or closed with `decidePanelRelease`, starts
   the spring, and hands the decision to `handlePanelReleased()` in the coordinator.
5. **No gorhom callbacks.** No `onAnimate`, `onChange`, `onClose`. Gorhom skips `onAnimate` when a
   spring was interrupted and fires `onChange` late; that is what let the store and the sheet drift
   apart in the demo's first version.

**Why this doesn't bring back the phase 1 bugs** (`Now-Playing-Phase-1-Plan.md` → "Why"):

| Phase 1 problem | How this design avoids it |
|---|---|
| A refused dismiss left the bar where the finger left it | The bar's slide-away calls `dismissMiniPlayer()`, then checks the store: if the session is still active (the flow refused), the bar springs back to 0. |
| Swiping up from the bar opened Now Playing without the open flow | A swipe up on the bar calls `openNowPlayingForLoadedLecture()`, the same flow as a tap. The closed panel is below the screen, so it can't catch the swipe. |
| Two sources of truth (5-state presentation + four shared values) | One 2-state store field. Gorhom's index is never read. |
| State waited on animations; a timer copied an animation's length | The store changes at once and the sheet follows. No timers. The only completion callback (the bar's slide-away) re-checks the store and recovers. |
| Hidden layers stayed mounted and touchable | The closed panel is off-screen and hidden from screen readers; the bar is `pointerEvents="none"` and hidden from screen readers while Now Playing is open. |
| What shows was several values multiplied across layers | One driver per piece (gorhom's position for the panel, `translateY` for the bar). No morph. |

What it gives up: the bar-to-card morph. Read-only effects can be added later without breaking
rule 1.

---

## 3. Behaviour (also the device checklist for step 9)

| Interaction | Result |
|---|---|
| Tap a row, nothing loaded | Now Playing slides up from the bottom. No mini player stage first. |
| Tap a row while the bar shows | Now Playing slides up over the bar. |
| Tap the bar | Now Playing slides up. |
| Swipe the bar up past half its height, or flick it up | Same as a tap. The bar itself doesn't move. |
| Swipe the bar up a little and let go | Nothing. |
| Drag Now Playing down past 25 % of the screen, or flick down | It closes; the bar is revealed; playback continues. |
| Drag Now Playing down a little and let go | Springs back open. |
| Flick Now Playing down as hard as possible | Closes to the bar. Playback **never** stops. |
| Grab Now Playing while it opens or closes | Follows the finger from where it is; release decides. |
| Chevron / Android back | Closes; playback continues. |
| Swipe the bar down past half its height, or flick it down | The bar slides off and playback stops (`stopAndClear`). |
| Swipe the bar down a little and let go | The bar springs back. |
| Screen-reader "Stop and close player" on the bar | Same as swiping it away. |
| The bar's buttons | Play/pause only. There is no forward 15 on the bar any more (Now Playing and the lock screen keep back / forward 15). |
| Drag the seek bar sideways | Seeks; the panel doesn't move. |
| Buttons inside Now Playing | Work; the panel doesn't move. |
| Queue ends while Now Playing is open | Panel stays open; no bar underneath; closing just slides it away. |
| Event pill | Now Playing slides away while the event opens in the Events tab. |
| Search result | Search closes, then Now Playing slides up over the tab Search was opened from. |
| Deep link / reminder tap `/player?slug=…` | Loads the lecture (paused) if nothing is loaded; Now Playing slides up. |
| Tap a row right after any of the above | Always opens Now Playing (the store can't get stuck). |

---

## 4. Before you start

1. Commit (or stash) the current phase 1 work on `feat/now-playing-phase-1`, then branch from it,
   e.g. `feat/now-playing-animation`. Don't mix this migration into the phase 1 commit.
2. Read `demo/handbuilt.md` and the demo files in section 1.
3. Commands for every step: `npx tsc --noEmit`, `npx expo lint`, `npm run check:theme`, `npm test`.
   Behind Netskope, npm and expo commands need `NODE_EXTRA_CA_CERTS` (see `AGENTS.md`).
4. Code style: this repo's `AGENTS.md` coding guidelines (explicit over clever, early returns, named
   variables). The demo code already follows them; keep that when adapting it.

---

## 5. Steps

### Step 1: dependency and test setup

1. Install the version the demo was tested with:
   ```bash
   npx expo install @gorhom/bottom-sheet@5.2.14
   ```
   It is JavaScript on top of Reanimated and Gesture Handler (both already installed), so it still
   runs in Expo Go. No development build is needed.
2. `jest.setup.ts`: add gorhom's mock. The mock sets `default` without `__esModule`, so add it:
   ```ts
   // The Now Playing sheet (@gorhom/bottom-sheet) runs on Reanimated and Gesture Handler internals
   // Jest can't load. Its own mock renders the sheet's children and ignores the motion.
   jest.mock('@gorhom/bottom-sheet', () => ({ __esModule: true, ...require('@gorhom/bottom-sheet/mock') }));
   ```
3. `src/test-utils/reanimated-mock.ts`: add what the new code imports and the mock lacks:
   `cancelAnimation` (a no-op) and `clamp`. Copy them from the demo's mock. Add more only when a
   test fails without it (the repo rule).

Checks pass (nothing uses the new code yet).

### Step 2: motion numbers and release rules

1. Create `src/features/player/player-motion-config.ts` with these constants from the demo's file
   (same values and comments): `PANEL_SPRING`, `PANEL_BLEED`, `PANEL_ACTIVE_OFFSET_Y`,
   `PANEL_FAIL_OFFSET_X`, `PANEL_CLOSE_DISTANCE_SHARE`, `PANEL_CLOSE_VELOCITY`,
   `BAR_SWIPE_ACTIVE_OFFSET_Y`, `BAR_DISMISS_FAIL_OFFSET_X`, `BAR_DISMISS_DISTANCE_SHARE`,
   `BAR_DISMISS_VELOCITY`, `BAR_OPEN_DISTANCE_SHARE`, `BAR_OPEN_VELOCITY`,
   `BAR_DISMISS_DURATION_MS`, `BAR_SPRING`, `ESTIMATED_BAR_HEIGHT`. Every motion number lives here
   and nowhere else.
2. Copy `panel-rules.ts` and `__tests__/panel-rules.test.ts` as they are. They are pure functions
   marked `'worklet'` so the gestures can call them on the UI thread, and Jest can call them
   directly. Example:

   ```ts
   // Now Playing was let go: does it close to the bar, or spring back open? A flick wins over the
   // distance, in either direction, so a quick flick up from low down still re-opens it.
   export function decidePanelRelease({ offset, velocityY, height }: PanelReleaseInput): PanelDecision {
     'worklet';
     const isFlickDown = velocityY > PANEL_CLOSE_VELOCITY;
     if (isFlickDown) {
       return 'closed';
     }
     const isFlickUp = velocityY < -PANEL_CLOSE_VELOCITY;
     if (isFlickUp) {
       return 'open';
     }
     const isPastCloseDistance = offset > height * PANEL_CLOSE_DISTANCE_SHARE;
     if (isPastCloseDistance) {
       return 'closed';
     }
     return 'open';
   }
   ```

Checks pass.

### Step 3: the store holds whether Now Playing is open (two states)

This brings back a presentation field, deliberately, with two states instead of phase 1's five.

1. `player.store.ts`:
   ```ts
   // Where Now Playing is heading: 'open' or 'closed'. Written only by open-now-playing.ts; the
   // panel animates to it. There are no in-between states: a spring can be grabbed or turned
   // around at any time, and the store already holds where it is going.
   export type NowPlayingPresentation = 'closed' | 'open';
   ```
   Add `nowPlayingPresentation: NowPlayingPresentation` to the data (initial `'closed'`) and a
   `setNowPlayingPresentation` setter.
2. `selectIsMiniPlayerVisible` becomes "a lecture is active **and** Now Playing is closed":
   ```ts
   export function selectIsMiniPlayerVisible(state: PlayerState): boolean {
     const hasActiveLecture = selectActiveLectureSlug(state) !== null;
     const isClosed = state.nowPlayingPresentation === 'closed';
     return hasActiveLecture && isClosed;
   }
   ```
   `useMiniPlayerSpace` keeps following "a lecture is active", so lists don't jump when Now Playing
   closes.
3. `player-rules.test.ts`: replace "whether Now Playing is open is never stored" with "only
   `open-now-playing.ts` calls `setNowPlayingPresentation`" (the demo's test "only the entry point
   sets the Now Playing presentation"). Update `player.store.test.ts`.

Nothing writes the field yet, so the app behaves exactly as before. Checks pass.

### Step 4: the Now Playing panel (built, not mounted yet)

1. Copy `panel-sheet-gestures.ts` as is. It keeps gorhom's start / change / finalize handlers (the
   sheet follows the finger, clamped between open and closed) and replaces only the release:

   ```ts
   const handleOnEnd: GestureEventHandlerCallbackType = useCallback(
     function handleOnEnd(_source, { velocityY }) {
       'worklet';
       const { highestDetentPosition, closedDetentPosition } = animatedDetentsState.get();
       if (highestDetentPosition === undefined || closedDetentPosition === undefined) {
         return;
       }
       // Gorhom's positions are the sheet's top edge: open = highestDetentPosition,
       // closed = closedDetentPosition (just below the bottom edge).
       const height = closedDetentPosition - highestDetentPosition;
       const offset = animatedPosition.get() - highestDetentPosition;
       const decision = decidePanelRelease({ offset, velocityY, height });

       let targetPosition = closedDetentPosition;
       if (decision === 'open') {
         targetPosition = highestDetentPosition;
       }
       // The spring carries on at the finger's speed, so a flick doesn't stall at the release.
       animateToPosition(targetPosition, GESTURE_ANIMATION_SOURCE, velocityY);
       scheduleOnRN(onPanelReleased, decision);
     },
     [animatedDetentsState, animatedPosition, animateToPosition, onPanelReleased],
   );
   ```

2. Create `now-playing-panel.tsx` from the demo's, with one change: the content is this app's
   `NowPlayingView` (it already pads both safe-area insets) instead of the demo's `NowPlayingCard`.
   Drop the `MotionBenchmarkRunner`. The essential parts:

   - The outer view measures the area and mounts the sheet only while a lecture is loaded:
     ```tsx
     <View testID="now-playing-area" pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={handleAreaLayout}>
       {canShow ? <SlidingPanel height={height} /> : null}
     </View>
     ```
   - Following the store, with `headingTo` so the effect never restarts a spring the release
     already started:
     ```tsx
     const [initialIndex] = useState(isOpen ? 0 : -1);
     const headingTo = useRef<PanelDecision>(isOpen ? 'open' : 'closed');

     useEffect(() => {
       let target: PanelDecision = 'closed';
       if (isOpen) {
         target = 'open';
       }
       const isAlreadyHeadingThere = headingTo.current === target;
       if (isAlreadyHeadingThere) {
         return;
       }
       headingTo.current = target;
       if (target === 'open') {
         sheetRef.current?.snapToIndex(0);
         return;
       }
       sheetRef.current?.close();
     }, [isOpen]);

     // The sheet's drag was let go: its spring has already started.
     const handleSheetReleased = useCallback((decision: PanelDecision) => {
       headingTo.current = decision;
       handlePanelReleased(decision);
     }, []);
     ```
   - The sheet's props. Every one of them matters:
     ```tsx
     <PanelReleaseContext value={handleSheetReleased}>
       <BottomSheet
         ref={sheetRef}
         index={initialIndex}
         animateOnMount
         snapPoints={SNAP_POINTS} // ['100%'], at module scope
         enableDynamicSizing={false} // otherwise gorhom adds a snap point and the indexes shift
         enablePanDownToClose // lets the drag reach closed; our release decides
         enableOverDrag={false} // never past fully open
         handleComponent={null}
         backgroundComponent={null} // the card colour is on the content, with its bleed strip
         animationConfigs={animationConfigs} // useBottomSheetSpringConfigs(PANEL_SPRING)
         gestureEventsHandlersHook={usePanelSheetGestures}
         activeOffsetY={PANEL_ACTIVE_OFFSET_Y}
         failOffsetX={PANEL_FAIL_OFFSET_X} // the seek bar (activeOffsetX ±4) wins sideways drags
         accessible={false} // see the pitfall below
       >
         <View
           testID="now-playing-panel"
           accessibilityViewIsModal={isOpen}
           accessibilityElementsHidden={!isOpen}
           importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
           style={{ height, backgroundColor: cardColor }}
         >
           <NowPlayingView />
           <View pointerEvents="none" style={[styles.bleed, { backgroundColor: cardColor }]} />
         </View>
       </BottomSheet>
     </PanelReleaseContext>
     ```
   - Android back while open: `BackHandler.addEventListener('hardwareBackPress', …)` calls
     `closeNowPlaying()` and returns `true`.
   - The card colour: `bg` in light, `surface1` in dark.

3. Port `__tests__/now-playing-panel.test.tsx` (renders nothing with nothing loaded; hidden from
   screen readers while closed; reachable and modal while open; the chevron and Android back call
   `closeNowPlaying`; unmounts when the session is cleared).

Not mounted anywhere yet.

**Found while migrating:** the panel imports `handlePanelReleased`, which only exists once the
coordinator is rewritten in step 6, so step 4 doesn't typecheck on its own. Build it here, but
commit it together with step 6. Step 5 doesn't depend on it.

### Step 5: the mini player bar gets its swipes, and loses forward 15

**5a. Remove the mini player's forward 15 button.** Only the bar's button goes. Keep the engine's
`skipForward15()`, `Skip15Icon`, Now Playing's back / forward 15 and the lock screen's ±15 skip.

1. `src/components/MiniPlayer/index.tsx`:
   - delete the `onSkipForwardPress` prop (type, destructuring) and the `<IconButton
     accessibilityLabel="Skip forward 15 seconds" …>` with its `Skip15Icon`;
   - delete the `IconButton` and `Skip15Icon` imports (nothing else in the file uses them);
   - keep `iconColor`: the loading spinner still uses it;
   - the right side of the bar is now just the play/pause control, before `progressLine`.
2. `src/features/player/mini-player-bar.tsx`: delete `handleSkipForwardPress`, the
   `skipForward15` import and the `onSkipForwardPress` prop. (The demo's bar still passes
   `onSkipForwardPress`: don't copy that line in 5b.)
3. Tests:
   - `src/components/MiniPlayer/__tests__/mini-player.test.tsx`: "has the open button,
     play/pause and 'Skip forward 15 seconds'" becomes "has the open button and play/pause, and
     no forward 15" (assert `queryByRole('button', { name: 'Skip forward 15 seconds' })` is not
     on the screen). Remove the forward 15 press test. In the failed-audio test, only play/pause
     is disabled.
   - `src/features/player/__tests__/mini-player-bar.test.tsx`: "play/pause and forward 15 never
     open Now Playing" becomes "play/pause never opens Now Playing". Drop `skipForward15` from
     its engine mock.
4. Look at the bar in light and dark at the normal and the largest text size: the title gets
   the freed width, and the bar's height doesn't change.

Checks pass.

**5b. The swipes.** Replace this app's plain `mini-player-bar.tsx` with the demo's, adapted to
this app's props:

- **Props:** this app passes `bottomOffset` (tab bar height + gap); the demo passes `tabBarHeight`
  and adds the gap itself. Keep this app's `bottomOffset` and drop the demo's gap arithmetic.
- **Rendering:** the bar renders while a lecture is active (`selectActiveLectureSlug`), not only
  while `selectIsMiniPlayerVisible`. While Now Playing is open it is `pointerEvents="none"` and
  hidden from screen readers, so it's already in place when the panel slides away.
- **Mounted under an open Now Playing** (a row opened it with nothing loaded): the bar stays
  invisible until Now Playing first closes, so it never shows above the rising panel
  (`hasBeenRevealed`, set during render).
- **The swipe:** one `usePanGesture` with `enabled: !isNowPlayingOpen`,
  `activeOffsetY: BAR_SWIPE_ACTIVE_OFFSET_Y`, `failOffsetX: BAR_DISMISS_FAIL_OFFSET_X`:

  ```ts
  onUpdate: (event) => {
    'worklet';
    // Only downward drags move the bar; upward, it stays put.
    translateY.set(Math.max(0, event.translationY));
  },
  onDeactivate: (event) => {
    'worklet';
    const endedAboveStart = event.translationY < 0;
    if (endedAboveStart) {
      translateY.set(0);
      const isOpening = shouldOpenFromBar({ translationY: event.translationY, velocityY: event.velocityY, barHeight });
      if (isOpening) {
        scheduleOnRN(openNowPlayingForLoadedLecture);
      }
      return;
    }
    const isDismissed = shouldDismissBar({ translationY: Math.max(0, event.translationY), velocityY: event.velocityY, barHeight });
    if (!isDismissed) {
      translateY.set(withSpring(0, { ...BAR_SPRING, velocity: event.velocityY }));
      return;
    }
    translateY.set(
      withTiming(slideAwayDistance, { duration: BAR_DISMISS_DURATION_MS, easing: EASE_OUT }, (finished) => {
        if (finished) {
          scheduleOnRN(handleSlideAwayFinished);
        }
      }),
    );
  },
  ```

  and the recovery that fixes phase 1's "cause 1":

  ```ts
  // The bar has slid away. Dismissing stops playback, and the bar unmounts with the session. If
  // the flow refused (Now Playing was opened in the meantime), bring the bar back.
  function handleSlideAwayFinished() {
    dismissMiniPlayer();
    const isStillActive = selectActiveLectureSlug(usePlayerStore.getState()) !== null;
    if (isStillActive) {
      translateY.set(withSpring(0, BAR_SPRING));
    }
  }
  ```

- **Animated view:** plain styles on it (NativeWind classes don't reach `Animated.View`), and the
  bar's `boxShadow` stays on `MiniPlayer`'s own plain view, never on the animated one.
- **Draw order difference:** in the demo the tab bar is drawn over the bar, so the dismissed bar
  slides *behind* it. Here (JS tabs, bar rendered after `<Tabs>`), the bar slides *over* the tab
  bar while it fades to 0. Accept that, or check it on a device (step 9). Don't switch the
  navigator to make it go behind.
- Port `__tests__/mini-player-bar.test.tsx` from the demo (stays rendered while open but hidden and
  untouchable; invisible when mounted under an open Now Playing; the screen-reader dismiss action;
  play/pause never opens; no forward 15 button; position updates don't re-render the bar).

The flows still navigate to `/player` at this point, so a swipe up opens the old screen and a swipe
down stops playback. Both work. Checks pass.

### Step 6: the swap (coordinator, layout, routes)

Do all of this in one step: the coordinator and the layout change together.

1. **Coordinator** (`open-now-playing.ts`): replace it with the demo's, renaming
   `replacesSearch` → `leaveSearchFirst` (in `search.tsx` too). The order is store → engine;
   nothing in it navigates to `/player` or moves anything. The panel follows the store.

   | Function | Behaviour |
   |---|---|
   | `openNowPlaying(request)` | Ignored unless closed (a double tap opens one). With `leaveSearchFirst`: `router.back()` first. Set `'open'`, then load or resume. If loading throws: set `'closed'` and rethrow. |
   | `openNowPlayingForLoadedLecture()` | Ignored with nothing loaded or unless closed. Set `'open'`; reload if the audio had failed. |
   | `closeNowPlaying()` | Ignored unless open. Set `'closed'`. Never stops playback. |
   | `handlePanelReleased(decision)` | `'closed'` → `closeNowPlaying()`. `'open'` → set `'open'` if closed and a lecture is loaded (a closing panel grabbed and pushed back up). |
   | `dismissMiniPlayer()` | Ignored unless closed and the bar is visible. `stopAndClear()`. |
   | `openEventFromNowPlaying(slug)` | Ignored unless open. `closeNowPlaying()`, then `router.navigate` to the event. |
   | `showNowPlayingFromDeepLink()` | Ignored unless closed and a lecture is loaded. Set `'open'`. |

2. **Tabs layout** (`src/app/(tabs)/_layout.tsx`): keep JS tabs. Wrap `<Tabs>` in
   `BehindNowPlaying` (screen readers skip the tabs and the tab bar while open), and draw the panel
   last, so it covers everything, tab bar included:
   ```tsx
   <View className="flex-1">
     <BehindNowPlaying>
       <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabsFooter {...props} onHeightChange={setTabBarHeight} />}>
         <Tabs.Screen name="index" />
         <Tabs.Screen name="events" />
       </Tabs>
     </BehindNowPlaying>
     <MiniPlayerBar bottomOffset={miniPlayerBottomOffset} />
     <NowPlayingPanel />
   </View>
   ```
   `BehindNowPlaying` comes from the demo. Remove its `useTabBarFollowStyle` if you copy an older
   version: the tab bar never moves.
3. **`/player` route** (`src/app/player.tsx`): it becomes the deep-link entry only, like the
   demo's. It loads the linked lecture paused if nothing is loaded, calls
   `showNowPlayingFromDeepLink()`, and leaves (`router.back()`, or `router.replace('/')` when there
   is nothing to go back to). Reminder taps (`router.push(openPath)`) keep working through it.
   Move the deep-link tests from `now-playing-screen.test.tsx` to a test of this route; the screen
   tests themselves move to `now-playing-panel.test.tsx` (step 4).
4. **Root stack** (`src/app/_layout.tsx`): the `player` screen no longer shows content. Use
   `options={{ animation: 'none' }}`, drop `presentation: 'fullScreenModal'` and
   `dangerouslySingular`, and change its comment to "Deep links only".
5. **Tests**: rewrite `open-now-playing.test.ts` from the demo's: it asserts store transitions,
   not navigation. Include: closed from open, kept open, re-opened while closing, no-ops with
   nothing loaded, a double tap opens one, a load error resets to closed, the bar dismiss refused
   while open, Search leaves first, and "tap a row right after a release always opens".

Checks pass, and the app now has the new behaviour.

### Step 7: guard rails (`player-rules.test.ts`)

Replace the phase 1 rules with the demo's:

- Only `open-now-playing.ts` calls `setNowPlayingPresentation`.
- Nothing in the app navigates to `/player` (`router.navigate|push|replace('/player…')`). The route
  is only for deep links and reminder taps.
- Only `now-playing-panel.tsx` and `panel-sheet-gestures.ts` import `@gorhom/bottom-sheet`.
- The panel uses none of gorhom's callbacks: no `onAnimate=`, `onChange=`, `onClose=` in
  `now-playing-panel.tsx`.
- The panel sets `accessible={false}` on the sheet.
- Only `now-playing-panel.tsx` uses `PANEL_SPRING`.
- Now Playing has no path to stopping playback: `now-playing-panel.tsx` and
  `now-playing-view.tsx` never mention `dismissMiniPlayer` or `stopAndClear`.
- Player motion files use `.get()` / `.set()`, never `.value`, and `scheduleOnRN`, never
  `runOnJS`.
- No `boxShadow` in player files that import Reanimated (Android didn't draw animated views with a
  shadow).
- `PanResponder` stays forbidden in the player files.
- Keep every non-motion rule (one player, selectors only, no persisted live store, …).

### Step 8: update the docs (they must not contradict the code)

1. `AGENTS.md`:
   - In "Navigation & Routing", replace the "Now Playing is the `/player` screen …" bullet.
   - Rewrite "Mini player and Now Playing" from section 2 of this guide: two pieces, one truth, one
     coordinator, no gorhom callbacks, the bar's swipes, the panel's drag, Android back.
   - In "Bottom sheets, modals & overlays", add the exception for the Now Playing panel with its
     reason.
   - Point the "Now Playing and the mini player" row of "Where to look" to this guide.
2. `docs/CONTEXT.md` → "Now Playing and the mini player": replace the table and the "No motion"
   paragraph with section 3's behaviour table and a short summary of section 2.
3. `docs/DESIGN-SYSTEM.md`: the mini player tokens comment becomes "play/pause, ochre progress
   line on the bottom edge", and the "Mini player + tabs" touch-target row becomes "Open player
   (text area), play/pause, Home tab, Events tab". Keep `skipButton` and the Skip15 icon section:
   Now Playing still uses them.
4. `docs/Now-Playing-Phase-1-Plan.md`: add a note at the top: "Superseded by
   `now-playing-animation-migration.md` (24 Nov 2026). Phase 2 was replaced by a gesture-driven
   panel; the bugs listed under 'Why' are addressed there."

### Step 9: check on a device

1. iOS simulator (Expo Go; see `AGENTS.md` → Verifying). Gesture Handler gestures receive
   `axe swipe`. Use `--delta 3` to `--delta 5` for quick flicks, or AXe sends too few touch points
   and the pan never activates (seen in the demo). Each AXe command takes about a second to land
   before it touches, so don't read that as app latency.
   `axe type` didn't reach the Search field in this app; to test a Search result, tap a recent
   search instead.
2. Go through section 3's table. Then check:
   - dark theme;
   - the largest text size;
   - three-button Android navigation (on the web build if there's no phone);
   - VoiceOver: the chevron is reachable when open, and the tabs aren't.
3. Tune only in `player-motion-config.ts`: `PANEL_CLOSE_VELOCITY`, `PANEL_CLOSE_DISTANCE_SHARE`,
   `PANEL_SPRING`, and the bar's thresholds.

---

## 6. Pitfalls the demo already hit (don't rediscover them)

- **Gorhom groups the sheet for screen readers.** By default `BottomSheet` is `accessible`, with
  label "Bottom Sheet" and role "adjustable", which on iOS makes the whole panel one element:
  VoiceOver can't reach the chevron. Always pass `accessible={false}`.
- **`onAnimate` is skipped** when the target equals where the last *finished* spring ended. With
  two states, "grab a closing panel and push it back up" never reports. Never use it. The release
  hook is the only report.
- **`enableDynamicSizing` defaults to true** and adds a content-sized snap point, shifting the
  indexes. Set it to `false`.
- **Android springs:** gorhom's Android default is a timing curve. Pass
  `useBottomSheetSpringConfigs(PANEL_SPRING)` so both platforms match.
- **The opening spring overshoots** a little; the `PANEL_BLEED` strip below the content keeps the
  screen's bottom covered.
- **`ANIMATION_SOURCE` isn't exported** from gorhom's entry point; the gesture hook uses the
  number `2` (GESTURE) with a comment.
- **Search must leave first:** the panel lives in the tabs layout and Search is a root-stack screen
  above it, so a panel opened from Search would open *under* Search.
- **Expo Go cold-start deep links** land on Home (already noted in `AGENTS.md`). Check reminder taps
  on a cold start in a development build.
- **Opening a screen while the panel closes** (the event pill) stalls the panel for about 0.3 s
  in a development build, while the new screen mounts, then it finishes. Seen on the iOS
  simulator in Expo Go; check it in a release build before changing anything.
- **Reanimated in Jest:** the mock finishes animations at once and `useAnimatedReaction` does
  nothing; gestures aren't simulated. Keep every decision in `panel-rules.ts` or the coordinator,
  where it is testable.
