# Plan: the mini player morphs into Now Playing

Branch: `feat/mini-player-morph`. Written 24 Nov 2026.

The mini player and Now Playing become **one sheet** that grows from the bar into the full player
under the finger, with the artwork flying from the bar's thumbnail to its place in Now Playing,
and the tab bar sliding away underneath.

---

## 0. The basis: the animation lab example wins

How the tab bar, the mini player, the sheet and their animation work is taken from the
animation lab example. **Where this app's rules, docs or rule tests disagree, the example
wins**, and those rules and docs are changed as part of this work (step 5). This covers
`AGENTS.md` ("Mini player and Now Playing", "Bottom sheets, modals & overlays"),
`docs/CONTEXT.md` and `src/features/player/__tests__/player-rules.test.ts`.

What this app keeps, inside the example's mechanics:

- **Now Playing's content:** `NowPlayingView` as it is (the chevron top bar, the artwork, the
  track info, the seek bar, the controls, the event pill). No drag handle.
- **The theme:** semantic colours from `useThemeColors()`, dark mode, `check:theme`.
- **The screen-reader behaviour:** Now Playing is modal while open, `BehindNowPlaying` hides the
  tabs, the bar's "Stop and close player" action.
- **The flows:** the coordinator (`open-now-playing.ts`) and everything that opens Now Playing
  from outside the sheet: rows, Continue listening, Search results, the event pill, deep links and
  reminder taps.

The example:

- `/Users/oumeir/personal-workspace/animate-lab/examples/expo-apple-music-bottom-sheet`
  - `components/player/now-playing-sheet.tsx`: the sheet and every interpolation
  - `components/player/player-tab-bar.tsx`: the tab bar drawn over the sheet, sliding away
  - `components/player/player-layout.ts`: the sizes the bar, the sheet and the screens share
  - `app/(tabs)/_layout.tsx`: the draw order
  - `KNOWN_ISSUES.md`: the open Android slow-drag bug

Same library versions as here: `@gorhom/bottom-sheet` 5.2.14, Reanimated 4.7.1, Gesture
Handler 3.3, Expo SDK 58, React Native 0.88.1.

### Decisions already made

| Decision | Choice |
|---|---|
| The example's Android bug (a slow drag down from the top of the full player springs back) | **Accepted.** It comes with the example's setup. No investigation step, no fallback driver |
| Swipe the bar down to stop and close | **Dropped**, as in the example. The bar can't be dragged below its place |
| A row tap with nothing loaded | **Option A:** the sheet jumps to the bar position without animating, then animates to full. The full player grows out of where the bar will be |
| Tab bar | The example's: drawn by the layout over the sheet, its own buttons, slides down as the player opens |
| The drag's release | gorhom's own (snap to the nearer size, a flick wins). No custom release code |
| Where "open or closed" lives | The store, written by the coordinator. The user's drags reach the store through the example's resting check (2.3) |
| Shadow | The example's: `boxShadow` on the card, switched off once it leaves the bar |
| Top of the full player | This app's: the card covers the whole screen, status bar included, and `NowPlayingView` pads its content by the insets. No `topInset` (the example's leaves a strip where the screen behind shows through) |
| Spring | The example's: heavily damped, no overshoot |

---

## 1. What changes for the user

| Interaction | Today | After |
|---|---|---|
| Tap the bar | Now Playing slides up from the bottom, over the bar | The bar grows into Now Playing. The card widens and grows to full screen, the artwork flies from the thumbnail to its place, the bar's row fades out, Now Playing's content fades in, and the tab bar slides down |
| Swipe the bar up | Nothing moves; past half its height on release (or a flick), Now Playing slides up | The card follows the finger. On release it snaps to the nearer size, and a flick up opens it |
| Drag Now Playing down | The panel follows the finger and slides away, revealing the bar | The full player shrinks back into the bar under the finger, the reverse morph |
| Swipe the bar down | Past half its height (or a flick): the bar slides away and playback stops | **Nothing.** The bar can't be dragged below its place |
| Stop playback and close the bar | Swipe the bar down, or the screen-reader action | **Screen-reader action only** ("Stop and close player"). Otherwise the bar stays while a lecture is active. Pausing is the way to stop listening |
| Chevron / Android back | Closes Now Playing | Shrinks it back into the bar |
| Row tap, nothing loaded | Now Playing slides up from the bottom | The full player grows out of the bar's place (option A) |
| Row tap while the bar shows | Now Playing slides up over the bar | The bar grows into Now Playing |
| Search result, event pill, deep link / reminder tap | Through the coordinator | Unchanged: same coordinator, same store |

Unchanged: the audio engine, the coordinator's flows, the `/player` deep-link route, Search
closing first, the event pill, `BehindNowPlaying`, list padding (`useMiniPlayerSpace`).

---

## 2. The design

### 2.1 Where things live

```
src/app/(tabs)/_layout.tsx               draw order, bottom to top:
  1. BehindNowPlaying > Tabs             the screens. The navigator draws no tab bar (tabBar={() => null})
  2. NowPlayingPanel                     ONE gorhom sheet: detents [bar, full screen], −1 = gone
       └ the card (Animated.View)        grows from the bar's size to the full screen
           ├ NowPlayingView              laid out once at full-screen size, clipped by the card, fades in
           ├ MiniPlayer row              background="transparent", thumbnail = empty 44 px slot, fades out
           └ flying CoverArt             one artwork, moved and scaled between the two slots
  3. PlayerTabBar                        drawn over the sheet, slides down as the player opens
```

- **`now-playing-panel.tsx`** keeps its name and hosts the one sheet.
- **`mini-player-bar.tsx`** stops being a floating bar. Its pan gesture, its slide-away and its
  position above the tab bar go. What's left is the bar's row inside the card: the `MiniPlayer`
  component with `background="transparent"` and its empty `thumbnail` slot (the props and comments
  for this already exist), plus its tap.
- **`use-player-morph.ts`** (new, `features/player/`): every interpolation in one hook. It takes
  the sheet's index and top edge, and returns the animated styles. It doesn't import gorhom.
- **`player-tab-bar.tsx`** (new, `features/player/`, because it reads the sheet's index): the
  example's tab bar wiring around this app's `TabBarItem` visuals.
- **Deleted:** `panel-sheet-gestures.ts`, the release rules in `panel-rules.ts`
  (`decidePanelRelease`, `shouldDismissBar`, `shouldOpenFromBar`) and their tests, and the
  `PANEL_*` / `BAR_*` numbers that only they used.

### 2.2 One driver

The sheet's `animatedIndex` drives everything that moves: 0 = bar, 1 = full player. Every
visual is a pure function of it, plus the sheet's top edge (`animatedPosition`) for the card's
height. Nothing is copied or kept in step by hand, so a fling, a catch mid-way or a drag back
never shows a wrong frame.

`sheetIndex` is a shared value created in the tabs layout and passed to the panel (as
`animatedIndex`) and to `PlayerTabBar`. `sheetTop` stays inside the panel.

### 2.3 Open or closed: store for intent, resting check for drags

The store's `nowPlayingPresentation` stays, written only by the coordinator.

**Store to sheet.** The panel follows the store with `snapToIndex` / `close()`, as today:

| Store | Sheet |
|---|---|
| No active lecture (`selectActiveLectureSlug` is null) | −1 (gone, below the screen) |
| Active lecture, `nowPlayingPresentation === 'closed'` | 0 (the bar) |
| `nowPlayingPresentation === 'open'` | 1 (full player) |

**Sheet to store** (the user dragged it). The example's resting check: a `useAnimatedReaction`
on `sheetIndex` that only reports when the sheet comes to rest at an end (index ≥ 0.99 →
`'full'`, ≤ 0.01 → `'bar'`) and the end differs from the last one reported. It calls
`handleSheetSettled('full' | 'bar')` in the coordinator through `scheduleOnRN`. The coordinator
writes `'open'` / `'closed'` only if the store doesn't already say so.

- It reads the live index, never gorhom's `onAnimate` / `onChange`, which are skipped or late.
- It crosses to React state only when the resting end changes, never per frame.
- A tap, a row, the chevron or Android back change the store first. The sheet then animates
  there, and its arrival reports what the store already says (no write). A drag changes the
  sheet first, and its arrival writes the store. The panel keeps today's `headingTo` ref so the
  store following a drag doesn't restart the spring.
- Mid-drag the store still holds the last resting state. That's fine: everything that reads it
  (the screen-reader modal, `BehindNowPlaying`, Android back, the bar's tap) only matters at rest.

Option A (row tap with nothing loaded): the panel sees the store go from "no lecture" to
`'open'`, jumps to index 0 without animating (`snapToIndex(0, { duration: 0 })`: in 5.2.14
`snapToIndex` takes a spring or timing config, and a zero-length timing jumps), then calls
`snapToIndex(1)`. Check on a device that the second call starts after the jump has landed. If it
doesn't, start it from the resting check when the index reaches 0.

### 2.4 The tab bar (the example's)

- The navigator draws nothing: `tabBar={() => null}`.
- `PlayerTabBar` is rendered by the layout after the panel, absolutely at the bottom, height =
  tab content + `insets.bottom`. It reuses `TabBarItem` (pill, icons, labels, theme colours). Each
  button compares `usePathname()` with its route and calls `router.navigate()`.
- It slides down by its own height as `sheetIndex` goes 0 → 1 (`translateY`, clamped).
- The layout reads its height (`onLayout`) to place the bar's detent:
  `barHeight + MINI_PLAYER_GAP_ABOVE_TAB_BAR + tabBarHeight`.
- Screens add `useMiniPlayerSpace()` plus the tab bar's height to their bottom padding (the
  navigator no longer reserves space for it).

---

## 3. The animation: what to port from the example

All values come from the sheet's index unless noted. Every number goes in
`player-motion-config.ts`.

| Property | Bar (index 0) → full (index 1) | Notes |
|---|---|---|
| Card height | The bar's height → reaches the screen bottom | `frameHeight − sheetTop`. Stretches over index 0 → 0.05 (behind the tab bar), then stays pinned to the screen bottom for the whole drag, so nothing behind shows under the card |
| Card side inset | The bar's side inset (`px-bar`, centred column ≤ 576 wide) → 0 | Interpolate the left and right margins, so wide windows keep the bar in the content column |
| Card colour | The `miniPlayer` bar colour → Now Playing's card colour (`bg`, `surface1` in dark) | `interpolateColor` over index 0 → 0.4, colours from `useThemeColors()` |
| Card corners and shadow | `rounded-mini` + the bar's shadow → square, no shadow | Switched once the card leaves the bar (index > 0.05), as in the example. The shadow value comes from `useThemeShadows()`. Check it draws on Android; at worst it's missing there, which is cosmetic |
| Bar row (title, author, play/pause, progress line) | Opacity 1 → 0 over index 0 → 0.1 | |
| Now Playing content | Opacity 0 → 1 over index 0.1 → 0.3 | |
| Artwork | 44 px thumbnail slot → Now Playing's artwork slot | One `CoverArt`, laid out at the full-player size, moved with `translateX/Y` and `scale` from its top-left corner. Never animate its width or height. Corner radius divided by the scale (`rounded-thumb-sm` → `rounded-card`) so it looks constant |
| Tab bar | translateY 0 → its height | Same index, clamped |
| Spring | | The example's: `damping 500, stiffness 1000, mass 3, overshootClamping: true, energyThreshold: 0.001`, through `useBottomSheetSpringConfigs` so Android matches iOS (gorhom's Android default is a timing curve). No overshoot, so the `PANEL_BLEED` strip goes |

### Fitting this app's Now Playing into the card

- **Lay `NowPlayingView` out once, at full-screen size.** Give it the frame's width and height,
  absolutely positioned in the card, and let the card clip it. If it sized itself from the card,
  its `onLayout` (the artwork's `fitArtworkSize`) would fire, and `setState` would run, on every
  frame of the drag.
- **Two artwork slots, measured once.** `NowPlayingView` keeps an empty slot of today's
  `artworkSize` where the artwork sits. `MiniPlayer` keeps its empty 44 px thumbnail slot. Both
  report their rectangle relative to the card with `onLayout`, which runs only when the screen or
  text size changes. The flying artwork moves between them.
- **Insets:** the card covers the whole screen, status bar included. `NowPlayingView` keeps its
  `paddingTop: insets.top` and `paddingBottom: insets.bottom`, so nothing sits under the status
  bar or the Android navigation bar.
- **Frame size:** `useSafeAreaFrame()` on iOS and Android, because Android's `window` stops short
  of the navigation bar. On web, `useWindowDimensions()`, because the web frame reports 0 × 0.

---

## 4. Lessons from the example (each one cost a debugging round)

1. **Never toggle `enableContentPanningGesture`.** gorhom swaps the view around its content when
   the prop changes, which remounts everything inside. The artwork flashed blank at both resting
   sizes. Leave it `true`. Reported upstream:
   [#2066](https://github.com/gorhom/react-native-bottom-sheet/issues/2066),
   [#2733](https://github.com/gorhom/react-native-bottom-sheet/issues/2733).
2. **The bar's tap is a `Gesture.Tap()`, not a Gesture Handler `Pressable`.** The `Pressable`
   wraps a native button that, on Android, can take the touch from the sheet's drag. Give the Tap
   a 10 px `maxDistance`, and turn the tap area off (`pointerEvents="none"`) while Now Playing is
   open, because the bar's row sits over the top of the full player. `MiniPlayer`'s open button
   becomes a plain view inside that tap. Check that its play/pause button (React Native
   `Pressable`) still works inside the sheet on Android; if it misses taps, give it a Tap gesture
   too.
3. **Pin the card's bottom to the screen**, using the sheet's top edge, not the index alone.
   Driving the height from the index left a gap mid-drag where the screen behind showed through.
4. **Size full-screen things from the safe-area frame** on Android, not `useWindowDimensions`.
5. **The resting check is "the index reached an end"** (≥ 0.99 / ≤ 0.01), in a
   `useAnimatedReaction` that only reports when the end changes. Never per frame.

---

## 5. Known limits

- **Android slow drag (accepted):** a slow drag down that starts near the top of the full player
  springs back. Fast drags and drags from the middle work, and iOS is fine. With this app's
  content, the top is the chevron row. Details and everything ruled out are in the example's
  `KNOWN_ISSUES.md`.
- **No visible way to close the bar.** With the swipe-down dropped, only the screen-reader action
  stops playback and removes the bar. Everyone else pauses, and the bar stays until the queue
  ends.
- **Events tab re-tap:** check that tapping Events while on an event's detail screen still goes
  back to the list with `router.navigate('/events')`. If not, the button can pop the nested stack
  itself.
- **Largest text size:** the bar grows with text (capped at 1.3×). The bar's detent must come
  from its measured height (`ESTIMATED_BAR_HEIGHT` until measured), not a constant.
- **Web:** gorhom already runs on web here. Check the morph and the tab bar in the browser.

---

## 6. Steps

Each step ends with `npx tsc --noEmit`, `npx expo lint`, `npm run check:theme` and `npm test`
passing, and the app working.

**Step 1: numbers.**
- `player-motion-config.ts`: add the example's spring and the morph numbers (fade windows,
  colour window, pin window, resting thresholds, tap distance).
- Delete the numbers only the removed code uses (`PANEL_BLEED`, the `PANEL_*` release numbers,
  every `BAR_*` swipe number) once step 3 removes their users.

**Step 2: the tab bar over everything.**
- `PlayerTabBar` as in 2.4, `tabBar={() => null}`, the screens' bottom padding.
- Today's panel still slides over it. Until step 3, its index (−1 closed, 0 open) drives the
  slide-away.
- Check: both tabs, the Events re-tap, today's Now Playing still covers the tab bar while open.

**Step 3: one sheet with two detents, and the card.**
- Panel: detents `[barDetent, '100%']`, following the store as in 2.3, with the resting check
  and `handleSheetSettled` in the coordinator. Settings: `enablePanDownToClose={false}`,
  `enableDynamicSizing={false}`, `enableOverDrag={false}`, `handleComponent={null}`,
  `enableContentPanningGesture={true}`, `accessible={false}`, the example's spring.
- The card with `use-player-morph.ts`: height (pinned), side inset, colour, corners and shadow.
- `NowPlayingView` at full-screen size inside the card, with its fade. The bar's row inside the
  card, with its fade and its Tap.
- Option A for a row tap with nothing loaded.
- Remove the bar's pan gesture, its slide-away and its floating position. Delete
  `panel-sheet-gestures.ts` and the release rules with their tests. Remove `dismissMiniPlayer`'s
  gesture path; keep it for the screen-reader action.

**Step 4: the artwork flight.**
- The two empty slots, their measured rectangles, one flying `CoverArt` in the card.

**Step 5: rule tests and docs.**
- `player-rules.test.ts`:
  - Remove: the release-hook rules (`panel-sheet-gestures.ts`), the bar's swipe rules, "no
    `boxShadow` in Reanimated files", and "only the panel uses `PANEL_SPRING`".
  - Keep: only the coordinator writes the presentation; nothing navigates to `/player`; gorhom
    is imported only by `now-playing-panel.tsx`; no gorhom callbacks (`onAnimate=`, `onChange=`,
    `onClose=`); `accessible={false}` on the sheet; `.get()`/`.set()`; `scheduleOnRN`; no
    `PanResponder`.
  - Add: `enableContentPanningGesture` is only ever `{true}`; `use-player-morph.ts` doesn't
    import gorhom.
- `AGENTS.md`:
  - Rewrite "Mini player and Now Playing" for the one-sheet design.
  - Update "Bottom sheets, modals & overlays": the gorhom exception is the player sheet.
  - Update "Navigation & Routing": the tab bar is drawn by the layout.
  - Remove the link to `docs/now-playing-animation-migration.md` (deleted in `b1ecae8`). Point to
    this plan, or to a short design note that replaces it when the work is done.
- `docs/CONTEXT.md`: the behaviour table (section 1).

**Step 6: device checks.**
- Every row of section 1, on the iOS simulator and an Android phone with three-button
  navigation.
- Drags from the bar and from the full player, slow and fast, both directions. Grab the sheet
  mid-spring and reverse it. (The slow drag from the top on Android is the accepted bug.)
- Option A from Home with nothing loaded, and from Search.
- Light and dark theme, the largest text size, VoiceOver and TalkBack at the bar and at full.
- Web build: the morph and the tab bar.
- Record the drags and check frames mid-motion, not only the resting screens.
