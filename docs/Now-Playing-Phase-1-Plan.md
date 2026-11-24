# Now Playing, phase 1: a plain screen and a plain bar

> **Superseded (24 Nov 2026)** by [now-playing-animation-migration.md](now-playing-animation-migration.md).
> Phase 1 shipped (commit `bf494cb`); phase 2 below was replaced by a sliding Now Playing panel with
> drag-to-close and a swipeable mini player. The bugs listed under "Why" are addressed there
> (section 2). Kept for history.

A plan to replace the animated player surface with something that can't get stuck. Phase 1 has
**no animation and no gestures**. Phase 2 (at the end) adds one simple, native animation.

Written 23 Nov 2026. Branch: `docs/now-playing-phase-1-plan`.

## Why

The bug video `docs/bugs/WhatsApp Video 2026-11-17 at 18.21.18.mp4` (Android) shows three
symptoms:

- Now Playing appears with no background and no artwork. Its text floats over the tabs.
- The mini player disappears. It leaves a faint square sitting on the tab bar.
- The mini player stays half transparent and too low.

All three come from the same thing: the shared value `miniDrop` is left stuck between 0 and 1.

- **Cause 1: a refused dismiss leaves the bar where the finger left it.**
  - Dragging the bar writes `miniDrop` straight from the finger.
  - On release, `dismissMiniPlayer()` can refuse silently: its guard needs `closed`, but the bar is draggable while `closing`.
  - When it refuses, nothing springs the bar back.
- **Cause 2: swiping up from the bar opens Now Playing without going through the open flow.**
  - Now Playing's collapse swipe stays enabled while Now Playing is closed.
  - At rest, Now Playing's layer is shifted down over the bar and the tab bar, so it catches the swipe.
  - The presentation stays `closed` and `miniDrop` is never reset, so the background and artwork stay transparent.

Fixing these two bugs would leave the design that produced them. Its weak points:

- **Two sources of truth.** The store holds a 5-state `nowPlayingPresentation`. Four shared values hold what is on screen. They can disagree.
- **State waits on animations.** The presentation moves on only when an animation reports back. An interrupted animation can leave the state stuck.
- **A timer copies an animation's length.** `waitForMiniExit` waits 320 ms because the bar's drop lasts 320 ms.
- **Hidden layers stay mounted and touchable.** Now Playing is always mounted, and its swipe stays live while it is closed.
- **The finger writes shared values directly**, as an absolute amount, so re-grabbing the bar makes it jump.
- **What shows on screen is several values multiplied across separate layers.** One stuck value hides half of a screen.
- **Geometry must be measured before anything can move.** The bar, the cover and the window are all zero until laid out.

All of it exists to support the bar-to-artwork morph and the tuck behind it. Phase 1 gives those
up.

## The design in one paragraph

Now Playing is a real screen, the existing `/player` route in the root stack. The mini player is
an ordinary view in the tabs layout, shown whenever a lecture is active. Only the navigation
stack knows whether Now Playing is open: the store no longer has a presentation. Opening is
"load the audio if needed, then `router.push('/player')`". The caret down is `router.back()`.
Android back is handled by the native stack. Nothing waits for an animation, nothing hidden stays
mounted, and no finger moves a value.

## What the user sees in phase 1

| Action | Phase 1 behaviour |
|---|---|
| Tap a lecture row (Home, Event detail) | The lecture loads and Now Playing appears at once |
| Tap a row's play button | Same, and a paused lecture resumes if it is the loaded one |
| Tap Continue listening | Same as a play button |
| Tap a Search result | Now Playing replaces Search, so closing it returns to the tab Search was opened from (as today) |
| Tap the mini player | Now Playing appears at once. No reload; a lecture whose audio failed loads again |
| Caret down (top left) | Now Playing closes at once. The mini player is there. Playback continues |
| Android back on Now Playing | Same as the caret |
| Event pill on Now Playing | Now Playing closes and the event opens in the Events tab |
| Notification or deep link `/player?slug=…` | Now Playing appears. Closing it shows the tabs (cold start included) |
| Queue ends | The mini player goes away |
| Swipe Now Playing down, swipe the bar | **Nothing.** No gestures in phase 1 |

## Not in phase 1

- Any animation of Now Playing or the bar: no morph, no tuck, no drop, no rise.
- Swipe down to close Now Playing.
- Swipe the bar down to stop and close. Screen readers keep the "Stop and close player" action. See open decision 1 for sighted users.
- Changes to audio behaviour (`audio-engine.ts`, `PlayerStatusBridge`), the Now Playing controls, the seek bar or the bar's progress line.

## Decisions (confirmed 23 Nov 2026)

1. **Stopping the bar:** pausing is enough for phase 1. There is no visible way to stop and close the bar; screen readers keep the "Stop and close player" action.
2. **Search results:** Now Playing *replaces* Search (`router.replace('/player')`), as today.
3. **iOS presentation:** `fullScreenModal`, with no swipe-to-dismiss.
4. **A reminder for lecture X while lecture Y is loaded** still shows Y, as today. Out of scope; noted so nobody is surprised.

## Steps

Do them in order. Each step leaves the app building and the tests passing.

### Step 1: make `/player` the Now Playing screen

- `src/app/_layout.tsx`: change the `player` screen to:

  ```tsx
  <Stack.Screen
    name="player"
    dangerouslySingular
    options={{ presentation: 'fullScreenModal', animation: 'none', gestureEnabled: false }}
  />
  ```

  - `dangerouslySingular` keeps one Now Playing in the stack however many times it is pushed. That replaces today's double-tap guards.
  - `unstable_settings.anchor: '(tabs)'` is already set, so a cold-start deep link has the tabs underneath and the caret has somewhere to go back to.
  - These options were checked against the installed versions (expo-router 58.0.31, react-native-screens 4.30.1). `fullScreenModal` falls back to `modal` on Android.
- `src/app/player.tsx`: render Now Playing instead of stepping out of the way.
  - Move the top bar (caret, "Playing from") and `NowPlayingBody` out of `player-surface-full-layer.tsx`.
  - Draw the artwork inline with `CoverArt` at the size `fitArtworkSize` gives. The `coverRect` reporting goes away.
  - Remove `FadingBlock`, the collapse swipe, the translate style and the manual accessibility props (`accessibilityViewIsModal`, the focus-the-caret effect). The native screen handles modality.
  - Keep the deep-link logic: with nothing loaded and a `slug`, load that lecture paused (`autoplay: false`). With nothing to show, `router.replace('/')`. Remove `showNowPlayingFromDeepLink` and `leaveToTabs`, because the screen now stays.
  - Keep the screen's own insets: there is no header, so pad top and bottom with the safe-area insets as the layer does today.
- The caret calls `closeNowPlaying()` (step 3).

Done when: navigating to `/player` by hand shows Now Playing for the loaded lecture, and the
caret and Android back return to the tabs.

### Step 2: make the mini player a plain bar

- New `src/features/player/mini-player-bar.tsx`:
  - Rendered by `(tabs)/_layout.tsx` next to `<Tabs>`, absolutely positioned. Keep `bottom` at the tab bar's measured height plus `MINI_PLAYER_GAP_ABOVE_TAB_BAR`, and keep the current horizontal rule (`getBarHorizontalPosition`).
  - Shown when a lecture is active (`selectActiveLectureSlug(state) !== null`). Nothing else decides it.
  - Renders `MiniPlayer` with `background="filled"`, so the bar draws its own colour, outline and shadow. Pass a 44 px `CoverArt` thumbnail with radius 10.
  - `onOpenPress` → `openNowPlayingForLoadedLecture()`. `onDismiss` (screen-reader action) → `dismissMiniPlayer()`.
  - The play state, toggle, skip and progress line are unchanged.
  - No `PanResponder`, no Reanimated, no `pointerEvents` switching.
- `src/app/(tabs)/_layout.tsx`: remove the `TuckedContent` wrapper and `PlayerSurface`, and render `<MiniPlayerBar bottomOffset={…} />` instead.
- `useMiniPlayerSpace` is unchanged: it already follows "a lecture is active".

Done when: the bar shows above the tab bar while a lecture is active, tapping it opens Now
Playing, and it is gone after the queue ends.

### Step 3: simplify `open-now-playing.ts`

It stays the one place that decides "load" and "show". Nothing in it waits or is async.

| Function | New body |
|---|---|
| `openNowPlaying(request)` | Audio first: the loaded lecture → resume (if `resumeIfPaused`) or reload a failed one, as today. Otherwise → `playLecture(lecture, queue, source)`. Then `router.replace('/player')` when `leaveSearchFirst`, else `router.push('/player')` |
| `openNowPlayingForLoadedLecture()` | Nothing loaded → return. Failed audio → `reloadFailedLecture()`. Then `router.push('/player')` |
| `closeNowPlaying()` | `router.canGoBack()` → `router.back()`, else `router.replace('/')` |
| `openEventFromNowPlaying(slug)` | `closeNowPlaying()`, then `router.navigate({ pathname: '/events/[slug]', params: { slug } })` |
| `dismissMiniPlayer()` | `stopAndClear()` |

- Delete: `waitForMiniExit`, `markNowPlayingOpen`, `markNowPlayingClosed`, `beginCloseAfterSwipe`, `finishCloseAfterSwipe`, `showNowPlayingFromDeepLink`, and every presentation guard.
- A different lecture while one plays needs no special case. `playLecture` already saves the outgoing lecture's progress and loads the new one. Today's "pause, drop the bar, wait" goes away.

### Step 4: remove the presentation from the store

- `player.store.ts`: delete `nowPlayingPresentation`, `setNowPlayingPresentation` and the `NowPlayingPresentation` type.
- Delete `selectIsMiniPlayerVisible`, or reduce it to "a lecture is active" if keeping the name reads better at the call sites.

### Step 5: delete the old surface

- Delete these files:
  - `player-surface.tsx`
  - `player-surface-background.tsx`
  - `player-surface-cover.tsx`
  - `player-surface-full-layer.tsx` (after step 1 moved its content)
  - `player-surface-mini-layer.tsx`
  - `player-surface-motion.ts`
  - `player-surface-geometry.ts`
  - `tucked-content.tsx`
  - `player-motion-config.ts`
- If a size constant is still needed (thumbnail 44 / radius 10, cover radius 28), move it next to the component that uses it.
- `src/test-utils/reanimated-mock.ts` stays: `jest.setup.ts` loads it, and the launch screen still uses Reanimated.

That removes about 1,600 lines, including `open-now-playing.ts`'s state machine.

### Step 6: tests

- **Delete:** `player-surface.test.tsx`, `player-surface-motion.test.ts`, `player-surface-geometry.test.ts`.
- **Rewrite `open-now-playing.test.ts`.** Mock `expo-router`'s `router` (`push`, `replace`, `back`, `canGoBack`, `navigate`) and the engine. Assert the audio call and the navigation call for each case:
  - a new lecture → `playLecture` then `push('/player')`
  - the loaded lecture from a play button → `resume`, with no `playLecture`
  - the loaded lecture from a row body → neither `resume` nor `playLecture`
  - failed audio → `reloadFailedLecture`
  - from Search → `replace('/player')`
  - caret with history → `back`; caret without history → `replace('/')`
  - event pill → close, then `navigate` to the event
  - dismiss → `stopAndClear`
  - a double tap → `playLecture` once for the same lecture. `dangerouslySingular` covers the stack itself.
- **`player-rules.test.ts`:**
  - Remove the rules that no longer apply:
    - "never pushed"
    - "nothing navigates to /player"
    - "only the entry point sets the presentation"
    - the motion-module import rule
    - the `scheduleOnRN` / `.get()` rule
    - the `onUpdate` rule
    - the `boxShadow` rule
  - Add:
    - only `features/player/open-now-playing.ts` navigates to `/player`;
    - `nowPlayingPresentation` appears nowhere;
    - `app/player.tsx`, `mini-player-bar.tsx` and `open-now-playing.ts` import neither `react-native-reanimated` nor `react-native-gesture-handler`.
- **`player.store.test.ts`, `use-mini-player-space.test.ts`:** drop the presentation cases.
- **New `now-playing-screen.test.tsx`:**
  - renders the loaded lecture;
  - the caret calls `closeNowPlaying`;
  - a deep link with nothing loaded loads the lecture paused;
  - no lecture and no slug → `replace('/')`.
- **New `mini-player-bar.test.tsx`:**
  - hidden with no active lecture, shown with one;
  - a tap calls `openNowPlayingForLoadedLecture`;
  - the screen-reader dismiss calls `dismissMiniPlayer`.
- Unchanged: the Search, Continue listening, `MiniPlayer` component and Now Playing wiring tests.

### Step 7: docs

- `docs/CONTEXT.md`:
  - **Routes:** `player.tsx` is now Now Playing itself.
  - **Now Playing and the mini player:** rewrite it as the design above, with the phase 1 table.
  - **Motion:** replace it with one short paragraph: phase 1 has none; phase 2 is a native screen animation.
  - Move the old motion spec into git history rather than leaving it to mislead.
- `docs/Audio-Player-Animations.md`: add a note at the top that it describes the retired morph and is not the current behaviour.
- `AGENTS.md`: point the "Player motion" row of the task table at the new CONTEXT.md section.
- Delete this plan once CONTEXT.md holds what it decided, as with the earlier build stages.

## Verifying

Run `npx expo lint`, `npx tsc --noEmit`, `npm run check:theme` and `npm test`. All must pass.

Then, on an **Android development build** (where the bugs were filmed) and on iOS, report each
check as pass, fail or not checked:

- [ ] Open and close Now Playing 20 times quickly, mixing the caret, Android back and the bar. It is never half drawn, and the bar is always fully solid in its place afterwards.
- [ ] Swipe up and down on the bar and on the tab bar. Nothing opens, nothing moves, the bar never fades.
- [ ] Double-tap a lecture row: one Now Playing. One caret tap closes it.
- [ ] Tap a row for a different lecture while one plays: the new lecture plays and Now Playing shows it. After closing, the bar shows it.
- [ ] Continue listening opens at the saved position and plays.
- [ ] A Search result opens Now Playing. The caret returns to the tab Search was opened from.
- [ ] The event pill closes Now Playing and opens the event in the Events tab, and back from the event behaves as before.
- [ ] Reminder notification: on a cold start and while the app runs, Now Playing shows, and the caret leaves the tabs.
- [ ] TalkBack / VoiceOver: focus lands on Now Playing when it opens, the tabs behind aren't reachable, and the bar's "Stop and close player" works.
- [ ] Status bar and navigation bar icons are readable on Now Playing in light and dark.
- [ ] Web: `/player` covers the tabs and the caret returns to them.

## Phase 2: the simple animation (later)

Change one option on the `player` screen:

```tsx
options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
```

The native screen system runs the slide on iOS and Android.
- If Now Playing closes mid-slide, the OS reverses the animation and the navigation state stays right.
- `animationDuration` tunes it on iOS only.

If more polish is wanted, short Reanimated `entering` fades on Now Playing's text blocks are
fine, as decoration only. The phase 1 rules still hold:

- Only navigation knows whether Now Playing is open.
- Nothing waits for an animation to finish: no completion callbacks, no timers matching a duration.
- Anything not visible is unmounted, never "transparent but mounted".
- No finger-driven shared values.
