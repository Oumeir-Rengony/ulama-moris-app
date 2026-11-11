# Stage 12: Screen animations (the spring sheet player)

> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 11 (mini player behaviour, `nowPlayingPresentation`, `openNowPlaying`), Stage 10 (engine, store, status bridge), Stage 5 (Now Playing parts), Stage 4 (tabs footer), Stage 9 (test setup).

## Goal

Replace Stage 11's "fade in, fade out, native modal slide" with the motion in [docs/Audio-Player-Animations.md](../docs/Audio-Player-Animations.md) and [docs/videos/mini-player.mov](../docs/videos/mini-player.mov):
- Now Playing **springs up** as a sheet while the screen behind it shrinks, rounds its corners and dims.
- Closing it **shrinks it into the mini player**: the cover becomes the thumbnail, the title fades into the bar's title.
- Tapping the bar **grows it back** into Now Playing.
- Switching to a different lecture **drops the bar away**, then springs the new sheet up.
- Swipe down on Now Playing **follows the finger** and carries its speed. Swipe down on the bar drops it and stops playback.

**Behaviour doesn't change.** Every rule from Stage 11 stays true: when the bar shows, what it shows, the single entry point, "intent before audio", "the bar never introduces a lecture". This stage changes *how* the moves look, and the one architecture change that makes them possible (§1).

**Fluid and performant** means, concretely:
- every frame of motion is computed on the UI thread from three shared values (§3). React never renders per frame;
- only transforms and opacity are animated, except one childless background view (§5.1);
- the motion keeps running smoothly while JS is busy loading audio (checked in §11.4).

## What the video shows (checked frame by frame)

| Time | Motion | What it confirms |
|---|---|---|
| 2.6–3.4 s | Tap a row. The row darkens, then a sheet rises from the bottom with the cover leading. The list behind dims and its corners round. The sheet lands in about 0.4 s | First entrance (§6.1) |
| 5.3–5.6 s | Chevron. The player shrinks down towards the bar in about 0.2 s. The cover shrinks into the thumbnail position. The bar is in place with no separate fade | Collapse = morph, not "close, then fade the bar in" (§6.2) |
| 14.6–15.5 s | Tap the bar. A dimmed list, the cover grows up out of the bar's position, the sand background fills the screen | Expand (§6.3) |
| 19.6–21 s | Bar showing A, tap row B. The bar is gone within about 0.1 s, then the sheet for B rises over the dimming list | Switch: drop first, then entrance (§6.4) |

The prototype's collapse is faster than the spec's 390 ms. Start with the spec's values (§4) and tune on a device.

## Scope

| Part | This stage | Not in this stage |
|---|---|---|
| Now Playing | Moves from a native `fullScreenModal` route to an overlay inside the tabs layout (§1) | — |
| Mini player | Moves from the tabs footer into the same overlay. The footer keeps a reserved space of the same size (§2.3) | — |
| Motion | Entrance, morph both ways, list tuck, swipe to collapse, bar drop, bar rise, interruptions, reduced motion (§6) | — |
| Auto-advance | Text fades in, cover crossfades in place (§6.8) | — |
| `/player` deep link | Kept as a thin route that opens the overlay, then leaves (§2.5) | — |
| Big play button morph (spec §5.1) | **Not built.** The bar's play/pause is a bare 44 px icon with no shape to grow from (HANDOFF §4.6). Mini controls fade out and full controls fade in | — |
| Progress sweep on entrance (spec §5.4) | **Not built.** The seek bar is a live, draggable control. An independent sweep could show a position that isn't the real one, and it fights a drag that starts during it | — |
| Moonlight reveal (spec §7) | **Not built.** It needs Skia, and it is marked optional | A later delight pass, if wanted |
| Play without opening (spec §6.7) | **Doesn't apply.** Stage 11: a row always opens Now Playing, and the bar never introduces a lecture | — |
| Haptics | None. The spec asks for none, and `expo-haptics` isn't installed | — |
| Card press animation (spec §6.4) | Rows keep their existing pressed look. They are full-width rows, which highlight rather than scale (expo-animation §7) | — |

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point |
| `expo-animation` | Thread rules (`.get()`/`.set()`, `scheduleOnRN`, never per frame), properties, springs, reduced motion, gesture handoff. **Binding** |
| `react-native-best-practices` / `vercel-react-native-skills` | Re-render budget, `renderToHardwareTextureAndroid`, `memo`'d layers, measuring with `onLayout` |
| `expo-router` | The tabs layout wrapper, the `/player` deep-link shim, `router.back()` from Search |
| `vercel-composition-patterns` | Splitting the surface into layers that each own one animated style |
| `frontend-design` | Required for user-facing UI. The tuck, the dim and the morph must match the video |
| `playwright-cli` | Web check, standing in for Android, with video recording |

## References

- [docs/Audio-Player-Animations.md](../docs/Audio-Player-Animations.md): the motion spec. Its section numbers are written "spec §x" below.
- [docs/videos/mini-player.mov](../docs/videos/mini-player.mov): the reference motion (table above).
- [plan/stage-11-mini-player.md](stage-11-mini-player.md): the behaviour this stage keeps. Its §3 (entry point) and §4 (presentation hook) are rewritten here.
- [AGENTS.md](../AGENTS.md): Zustand rules, safe areas, dark mode. **Binding.**
- [HANDOFF.md §4.4, §4.6](../docs/HANDOFF.md): Now Playing and mini player sizes, labels, colours.
- Installed versions (checked in `node_modules`): `react-native-reanimated` 4.7.1, `react-native-worklets` 0.13.0, `react-native-gesture-handler` 3.3.0. React Compiler is on (`app.json` `experiments.reactCompiler`). Android `predictiveBackGestureEnabled` is `false`, so `BackHandler` receives the back press.

### Where this plan departs from the spec, and why

| Spec says | Problem here | This plan |
|---|---|---|
| Render the player at the root, above everything (spec §4.1) | Search is a root-stack screen. An overlay at the root would draw over Search | Render it inside `(tabs)/_layout.tsx`, above the `Tabs` navigator. Search still covers it. Every screen that shows the bar is a tab screen (Stage 11 §5.1) |
| A new seven-state UI machine (spec §4.2) | Stage 11 already has `nowPlayingPresentation`, with tests and guards. A second machine would be a second source of truth | Keep the Stage 11 field. Add **one** value, `miniLeaving` (§2.1). The spec's `entering` and `expanding` are both `opening`, `full` is `open`, `collapsing` is `closing`, and `mini` / `hidden` are `closed` (the visibility selector tells them apart) |
| A separate `tuck` value, read as `max(tuck, expand)` (spec §6.1) | During the entrance `expand` is already 1, so `max` makes the tuck jump to 1 on the first frame | No `tuck` value. The tuck is **derived**: `expand × (1 − enterY / windowHeight)` (§3.2). It follows the entrance spring, the morph and the finger with one formula |
| Separate springs and delays for the cover and each text line on entrance (spec §5.4) | Four more independent animations, each needing cancelling on interrupt | Derive the stagger from the entrance spring's progress with offset ranges (§5.4). Nothing extra to cancel |
| `Gesture.Pan()…onStart/onEnd`, `runOnJS` (spec §6.2) | Gesture Handler 3 uses hook gestures. `runOnJS` is deprecated in Reanimated 4 | `usePanGesture({ onActivate, onUpdate, onDeactivate })` and `scheduleOnRN` from `react-native-worklets` |
| `isBusy` shared value (spec §6.9) | Every request comes from a JS `Pressable` or `BackHandler`, so the check is already on the JS thread | The store's presentation guard (§2.2) |
| Waiting for an animation's completion callback before the next step (spec §6.5) | Stage 11 §1: a promise that a component must resolve can hang forever | A fixed wait of `MINI_EXIT_MS`, shared by the animation and the flow (Stage 11's approach, with the new duration) |
| Colours `#22241B` → `#F0EADD` | Hardcoded hex, and wrong in dark mode | Theme values from `useThemeColors()`: the bar's background (`inverse` light / `emphasis` dark) → `bg` |
| Stiffness/damping springs; the skill prefers duration/dampingRatio | — | Use the spec's stiffness/damping values. They were tuned in the prototype. Keep them in one file (§4) so tuning is one edit |

## 1. The architecture change

Stage 11's Now Playing is a native `fullScreenModal` route, and the bar lives in the tabs footer. A native modal transition can't morph into a view in another screen, and it can't scale the screen behind it on Android. So:

```
src/app/(tabs)/_layout.tsx
<View style={{ flex: 1, backgroundColor: tuckBackdrop }}>
  <TuckedContent>                       // Animated.View, flex 1: scales, rounds, dims
    <Tabs tabBar={(props) => <TabsFooter {...props} />} … />
  </TuckedContent>
  <PlayerSurface />                     // absolute fill, pointerEvents="box-none"
</View>
```

- `PlayerSurface` holds **both** the bar and the full player. They are the same component in two states.
- `TuckedContent` wraps the whole navigator (tab bar included), so Android scales one composited layer (spec §5.2).
- `tuckBackdrop` is what shows around the tucked screen's rounded corners: `primitives.charcoal[900]` (a theme primitive, not a hardcoded `#000`).
- Screens that open Now Playing no longer navigate. They call `openNowPlaying` (Stage 11), which now drives the surface.

## 2. Store and flow changes

### 2.1 Store: `src/features/player/player.store.ts`

```ts
type NowPlayingPresentation = 'closed' | 'miniLeaving' | 'opening' | 'open' | 'closing';
```

- `miniLeaving`: the bar is dropping away, for a switch or a dismiss. Nothing else may start. The bar is hidden by the existing selector, because it isn't `closed`.
- `selectIsMiniPlayerVisible` is **unchanged**. Add one selector:

```ts
// The footer reserves room for the bar for the whole session, including while Now Playing is open,
// so the list's bottom edge doesn't move every time the player opens or closes.
export function selectHasMiniPlayerSpace(state: PlayerState): boolean {
  const hasLecture = selectCurrentLecture(state) !== null;
  const isActive = isSessionActive(selectSessionStatus(state));
  return hasLecture && isActive;
}
```

- Still data and plain setters only. No shared values in the store (AGENTS.md: the store decides *whether*, Reanimated animates *how*).

### 2.2 Which requests are allowed in which presentation

| Request | Allowed when | Ignored when |
|---|---|---|
| Open from a row, search or event (`openNowPlaying`) | `closed` | anything else (Stage 11 "one action at a time") |
| Tap the bar (`openNowPlayingForLoadedLecture`) | `closed` with the bar visible, **or `closing`** (retarget, spec §6.9) | `miniLeaving`, `opening`, `open` |
| Chevron, Android back, swipe release (`closeNowPlaying`) | `open`, **or `opening`** (retarget) | `closed`, `miniLeaving`, `closing` |
| Swipe the bar down (`dismissMiniPlayer`) | `closed` with the bar visible | anything else |

Each guard is an early `return` at the top of its function, written out, not a lookup table.

### 2.3 The footer keeps the bar's space: `src/components/TabBar/tabs-footer.tsx`

- Replace `<MiniPlayerSlot />` with `<MiniPlayerSpace />`: an empty `View` of height `MINI_PLAYER_HEIGHT` (62: 44 px thumb + 8 top + 10 bottom padding), rendered when `selectHasMiniPlayerSpace` is true.
- Lists still stop above the bar with no change to any screen (Stage 11 §5.20).
- The bar's own title and scholar get `maxFontSizeMultiplier={1.3}` (AGENTS.md: allowed where layout genuinely can't grow), so its height stays 62 and matches the space.
- The footer's `onLayout` writes the bar's rectangle into the geometry (§3.3).

### 2.4 Flows: `src/features/player/open-now-playing.ts`

Still the single entry point (Stage 11 §3). It now orchestrates **store → engine → motion**. The motion module never imports the store. It reports completion through callbacks.

```ts
export async function openNowPlaying(request: OpenNowPlayingRequest): Promise<void> {
  const stateAtTap = usePlayerStore.getState();
  if (stateAtTap.nowPlayingPresentation !== 'closed') {
    return;
  }

  const currentLecture = selectCurrentLecture(stateAtTap);
  const isAlreadyLoaded = currentLecture !== null && currentLecture.slug === request.lecture.slug;
  const isBarShowing = selectIsMiniPlayerVisible(stateAtTap);

  if (request.leaveSearchFirst) {
    router.back(); // Search slides away while the sheet rises behind it
  }

  // Same lecture, bar showing: the bar grows into the player. Never reloads (Stage 11 §5.4).
  if (isAlreadyLoaded && isBarShowing) {
    stateAtTap.setNowPlayingPresentation('opening');
    expandFromMini({ onFinished: markNowPlayingOpen });
    if (request.resumeIfPaused) {
      resume();
    }
    return;
  }

  // Different lecture, bar showing: drop the bar, then open fresh.
  if (isBarShowing) {
    stateAtTap.setNowPlayingPresentation('miniLeaving');
    pause();
    dropMini();
    await waitForMiniExit();
  }

  // Intent before audio, audio before motion. The bar is hidden because presentation isn't 'closed'.
  usePlayerStore.getState().setNowPlayingPresentation('opening');
  if (!isAlreadyLoaded) {
    playLecture(request.lecture, request.queue, request.source); // not awaited
  }
  enterFresh({ onFinished: markNowPlayingOpen });
}
```

- Keep Stage 11's `try/catch`, which puts the presentation back to `closed` and rethrows.
- `markNowPlayingOpen` sets `open`. `closeNowPlaying()` sets `closing` and calls `collapseToMini({ onFinished: markNowPlayingClosed })`.
- `dismissMiniPlayer()` sets `miniLeaving`, calls `dropMini()`, waits `MINI_EXIT_MS`, then calls `stopAndClear()` and sets `closed`. The lecture clears **after** the drop, so the surface stays mounted while the bar falls (Stage 11 cleared it at once and relied on `exiting`).
- `replaceCurrentScreen` (Stage 11) becomes `leaveSearchFirst`.
- `openEventFromNowPlaying(slug)` (the event pill) calls `closeNowPlaying()` and `router.navigate` to the event in the same tick. The tucked screen changes under the collapsing player.
- **Completion callbacks only act when the animation finished** (`finished === true`). A retargeted animation reports `false`, and its callback must not overwrite the new presentation.

### 2.5 The `/player` route becomes a deep-link shim

`src/app/player.tsx`: keeps the Stage 10 fallback (fetch the lecture for `?slug`, load with `autoplay: false`). Then:
- calls `showNowPlayingWithoutMotion()`: sets `expand = 1`, `enterY = 0`, presentation `open`. Spec §6.8: no entrance during a cold start;
- calls `router.back()` if it can go back, otherwise `router.replace('/')`;
- set its stack options to `animation: 'none'`, so no native transition plays on top.

No code in the app navigates to `/player` any more. Only external links do.

### 2.6 Removed

- `src/features/player/use-now-playing-presentation.ts` and its tests. The surface's completion callbacks replace the native-stack `transitionStart`/`transitionEnd` events.
- `src/components/MiniPlayer/mini-player-slot.tsx` (replaced by the bar layer, §5.3) and `mini-player-motion.ts` (replaced by §4).

## 3. The motion values

### 3.1 Three shared values, at module scope

`src/features/player/player-surface-motion.ts`. It's created at module scope with `makeMutable`, the same way the audio player is created at module scope. Flows can then drive it without a component or a context.

| Value | Range | Meaning |
|---|---|---|
| `expand` | 0 → 1 | 0 = bar, 1 = full player. Drives the morph. Swipe-down scrubs it |
| `enterY` | windowHeight → 0 | Offset of the whole full player during a fresh entrance only. 0 the rest of the time |
| `miniDrop` | 0 → 1 | 0 = bar in place, 1 = dropped away (70 px down, transparent). Also the bar's rise |

Plus `geometry` (also `makeMutable`): `{ windowWidth, windowHeight, miniRect, coverRect }`. It is written from JS on layout (§3.3) and read in worklets.

Read and write all of them with `.get()` / `.set()`. The React Compiler is on, and `.value` is the form it can't see through (expo-animation §6).

### 3.2 Derived values (pure worklet functions)

`src/features/player/player-surface-geometry.ts`. Plain functions with `'worklet'` as their first line, so the styles call them on the UI thread and Jest calls them as normal functions.

```ts
export function getOpenness(expand: number, enterY: number, windowHeight: number): number {
  'worklet';
  const entranceProgress = 1 - clamp(enterY / windowHeight, 0, 1);
  return expand * entranceProgress;
}
```

| Function | Returns |
|---|---|
| `getOpenness(expand, enterY, windowHeight)` | 0 → 1, how far the player covers the screen. Drives the tuck |
| `getEntranceProgress(enterY, windowHeight)` | 0 → 1 during a fresh entrance; 1 otherwise. Drives the stagger |
| `getThumbRect(miniRect)` | The 44 px thumbnail inside the bar (8 px from its left and top) |
| `getBackgroundFrame(expand, miniRect, window)` | `left`, `top`, `width`, `height`, `borderRadius` of the background view |
| `getCoverTransform(expand, thumbRect, coverRect)` | `translateX`, `translateY`, `scale`, `borderRadius` of the cover |
| `shouldCollapseAfterSwipe(translationY, velocityY, windowHeight)` | `translationY > 0.18 × windowHeight` **or** `velocityY > 1000` |
| `shouldDismissMini(translationY, velocityY)` | `translationY > 24` **or** `velocityY > 800` |

Write each one with named intermediate variables, not one long expression.

### 3.3 Measuring the geometry

All rectangles come from layout, never from the tapped row (spec §4.3), so the surface behaves the same from every entry point.

| Rectangle | Measured from | Why it's correct |
|---|---|---|
| `miniRect` | `TabsFooter`'s `onLayout`: `{ x: 12, y: layout.y, width: layout.width − 24, height: MINI_PLAYER_HEIGHT }` (the footer's 12 px side padding, HANDOFF §4.6) | The footer's parent is the tabs container, which fills the window. `onLayout` reports untransformed layout, so the tuck's scale doesn't distort it |
| `coverRect` | The cover's `onLayout` in the full layer | The cover is a **direct child** of the full layer's root, which sits at the window origin. So its `x`/`y` are window coordinates. Keep it a direct child, and say so in a comment |
| `windowWidth`, `windowHeight` | `useWindowDimensions()` in `PlayerSurface`, written in an effect | Updates on split screen and foldables (AGENTS.md) |

Check the "footer's parent fills the window" assumption on device once: temporarily draw a 1 px outline at `miniRect` and confirm it sits exactly on the bar's space.

## 4. Motion values: `src/features/player/player-motion-config.ts`

One file, one constant per row. Values are from spec §5.4 unless noted.

| Constant | Used for | Value |
|---|---|---|
| `SHEET_SPRING` | `enterY` on a fresh entrance | `withSpring`, stiffness 230, damping 25, mass 1 (slight overshoot) |
| `MORPH_SPRING` | `expand` 0 → 1 (tap the bar); swipe collapse with the finger's velocity | stiffness 220, damping 26 (no visible bounce) |
| `SNAP_BACK_SPRING` | `expand` back to 1 after a short swipe; `miniDrop` back to 0 after a short bar swipe | stiffness 260, damping 22 |
| `COLLAPSE_TIMING` | `expand` 1 → 0 from the chevron or back | `withTiming`, 390 ms, `Easing.bezier(0.4, 0, 0.2, 1)` |
| `MINI_EXIT_MS` | `miniDrop` 0 → 1, and the flows' wait | 320 ms: lift to −5 px over the first 18 %, then down 70 px and fade, `Easing.bezier(0.4, 0, 0.9, 0.6)` |
| `MINI_RISE_SPRING` | `miniDrop` 1 → 0 (bar coming back without a collapse, §6.7) | `MORPH_SPRING` |
| `REDUCED_FADE_MS` | Every change under reduced motion (§7) | 200 ms (bar dismissal 150 ms) |
| `TUCK` | The tucked screen at openness 1 | scale 0.92, translateY 12, radius 26, dim opacity 0.3 |
| `BACKGROUND_BLEED` | Extra height below the window on the full background | 48 px. **Not in the spec:** `SHEET_SPRING` overshoots upwards, and without this, a strip of the tucked list shows under the sheet for a few frames |

`MINI_EXIT_MS`'s curve accelerates away, which the skill avoids on UI. Keep it: it's the spec's choice, it's a dismissal that leaves the screen, and it's short. Feel-check it on device (§11.4).

## 5. The surface: `src/components/PlayerSurface/`

### 5.1 Layers, bottom to top

| Layer | File | Driven by | What animates |
|---|---|---|---|
| Background | `surface-background.tsx` | `expand`, `enterY` | `left/top/width/height/borderRadius` from `getBackgroundFrame`, `backgroundColor` with `interpolateColor(expand, [0, 0.6], [barBg, bg])`, plus `translateY: enterY`. **A childless view**: the one layout-property exception (expo-animation §4). In dark mode the 1 px outline fades out with `opacity` over expand 0 → 0.25, on a separate childless view |
| Cover | `surface-cover.tsx` | `expand`, `enterY` | `getCoverTransform` (translate, then scale; translate first) and `borderRadius = 10 / scale` at expand 0 → 28 at expand 1. Entrance: extra translateY 40 → 0 and scale 0.9 → 1 from `getEntranceProgress` over [0.1, 1]. The cover's shadow stays at its final value. Never animate it |
| Bar content | `surface-mini-layer.tsx` | `expand`, `miniDrop` | Title, scholar, play/pause, forward 15, progress line. `opacity` 1 → 0 over expand 0 → 0.25. `translateY = miniDrop × 70` (−5 px lift in the timed drop), `opacity × (1 − miniDrop)`. **No thumbnail of its own**: the cover is the thumbnail |
| Full content | `surface-full-layer.tsx` | `expand`, `enterY` | Header, title block, details, tags, seek bar, controls. Each block has its own style: `t = interpolate(expand, [start, 1], [0, 1], CLAMP)`, `opacity: t`, `translateY: (1 − t) × 16`, with starts 0.35 / 0.45 / 0.55 / 0.65 (§5.4). The layer's root gets `translateY: enterY` |

- The cover appears in both states, so the bar's thumbnail is now the **cover image**, not Stage 3's small rosette. The video's bar shows the cover too. Update `MiniPlayer`'s Stage 3 gallery entry.
- `surface-full-layer.tsx` takes over Stage 5's composition from `src/app/player.tsx` (`NowPlaying` parts, insets, top bar). It owns its top **and** bottom insets: no header covers the notch (AGENTS.md).
- Each layer is `memo`'d and reads its own selectors. Only the seek bar, time labels and the bar's progress line subscribe to `positionSec` (AGENTS.md).

### 5.2 `PlayerSurface` (index.tsx)

```tsx
export function PlayerSurface() {
  const lecture = usePlayerStore(selectCurrentLecture);
  const presentation = usePlayerStore((state) => state.nowPlayingPresentation);
  const isBarVisible = usePlayerStore(selectIsMiniPlayerVisible);

  const isPlayerInUse = presentation !== 'closed';
  const shouldRender = lecture !== null && (isPlayerInUse || isBarVisible);
  if (!shouldRender) {
    return null;
  }
  // …layers, gestures, back handler, accessibility (§5.5, §8)
}
```

- It re-renders only when the presentation, the lecture or visibility changes: a handful of times per open or close, never per frame.
- **Who can be touched** follows the presentation (a React value, so it changes only at phase boundaries). When `closed`, the bar layer gets `pointerEvents="auto"` and the full layer `"none"`. Otherwise it's the reverse. The root is `"box-none"`, so the tabs underneath stay touchable around the bar.
- **Mounting directly into the bar** (for example, playing again from the lock screen after the queue ended, Stage 11 §2.4): the surface mounts with presentation `closed`. Set `expand = 0` and `miniDrop = 1` before the first frame, then `miniDrop` springs to 0 (`MINI_RISE_SPRING`, spec "mini bar entrance"). Use a mount effect that checks "was I mounted while closed?".
- **Unplanned unmount while the bar shows** (the queue ends, Stage 11 §2.4): give the root `exiting={FadeOut.duration(200)}`. After a planned drop the bar is already transparent, so this is invisible there.

### 5.3 The bar layer keeps Stage 11's wiring

The text area calls `openNowPlayingForLoadedLecture`. Play/pause calls `toggle`, forward calls `skip(15)`, and neither opens the player. Accessibility labels, the "Stop and close player" action (now `dismissMiniPlayer`) and the loading look are unchanged. Move them from `mini-player-slot.tsx` into `surface-mini-layer.tsx`. `MiniPlayer/index.tsx` stays presentational. It gains a `thumbnail?: ReactNode` slot (the surface passes nothing, the gallery passes the cover).

### 5.4 Entrance stagger, derived

During a fresh entrance, each full-content block's opacity is multiplied by its entrance factor:

```ts
const entrance = getEntranceProgress(enterY.get(), windowHeight);
const entranceFactor = interpolate(entrance, [blockStart, 1], [0, 1], Extrapolation.CLAMP);
```

Use block starts of 0.55 (title), 0.62 (scholar), 0.7 (details), 0.78 (tags, seek bar, controls). A spring spends its last stretch slowly, so late ranges arrive visibly after the cover. This stands in for the spec's 170 / 210 / 250 / 290 ms delays and can't get out of step on an interrupt. During a morph `entrance` is 1, so the factor is 1. During an entrance `expand` is 1, so the expand factor is 1. Multiplying both covers all cases.

### 5.5 The tuck: `src/components/PlayerSurface/tucked-content.tsx`

```ts
const style = useAnimatedStyle(() => {
  const openness = getOpenness(expand.get(), enterY.get(), geometry.get().windowHeight);
  const scale = isReducedMotion ? 1 : interpolate(openness, [0, 1], [1, TUCK.scale]);
  return {
    borderRadius: interpolate(openness, [0, 1], [0, TUCK.radius]),
    transform: [
      { translateY: isReducedMotion ? 0 : openness * TUCK.translateY },
      { scale },
    ],
  };
});
```

- Dim: an absolutely positioned childless view inside the wrapper, `pointerEvents="none"`, colour `primitives.charcoal[900]`, `opacity = openness × TUCK.dim`.
- `overflow: 'hidden'` on the wrapper, so the radius clips.
- `renderToHardwareTextureAndroid` and `shouldRasterizeIOS` are `true` while presentation isn't `closed` (that covers the swipe too), and `false` when it is (spec §8: the texture costs memory).
- While the player isn't `closed`, also hide the tabs from screen readers (§8).

## 6. Situations

Each row lists the motion commands. All commands live in `player-surface-motion.ts`. Each one is a plain function that cancels nothing by hand: assigning a new animation to a shared value replaces the running one, and springs keep the current velocity.

| # | Situation | Flow (`open-now-playing.ts`) | Motion |
|---|---|---|---|
| 6.1 | Tap a row, nothing playing | `opening` → `playLecture` → `enterFresh` | `expand.set(1)`, `enterY.set(windowHeight)`, then `enterY` → 0 with `SHEET_SPRING`. On finish: `open` |
| 6.2 | Chevron or Android back | `closeNowPlaying`: `closing` | `expand` → 0 with `COLLAPSE_TIMING`. On finish: `closed` (the bar is now visible) |
| 6.2b | Swipe down on Now Playing | On release past the threshold: `scheduleOnRN(closeNowPlayingAfterSwipe)` | `expand` follows the finger, then → 0 with `MORPH_SPRING` + velocity, all on the UI thread (§6.5) |
| 6.3 | Tap the bar, or the loaded lecture's row | `opening` | `expand` → 1 with `MORPH_SPRING`. On finish: `open` |
| 6.4 | Bar shows A, tap row B | `miniLeaving` → `pause` → `dropMini` → wait `MINI_EXIT_MS` → `opening` → `playLecture(B)` → `enterFresh` | `miniDrop` → 1 (timed, with the lift). `enterFresh` resets `miniDrop` to 0 with `expand = 1`, so the B sheet starts clean |
| 6.5 | Swipe released early | none | `expand` → 1 with `SNAP_BACK_SPRING` + velocity. Presentation stays `open` |
| 6.6 | Swipe the bar down | During the drag: none. On release past the threshold: `scheduleOnRN(dismissMiniPlayer)` | `miniDrop = clamp(translationY / 70, 0, 1)` during the drag; past the threshold → 1 (timed, from where it is), otherwise → 0 with `SNAP_BACK_SPRING` |
| 6.7 | Bar mounts without a collapse | none | §5.2: `miniDrop` 1 → 0 with `MINI_RISE_SPRING` |
| 6.8 | Lecture ends, next one starts (auto-advance) | none (the engine changes the lecture) | The surface doesn't move. The title blocks (full and bar) are wrapped in an `Animated.View` keyed by slug with `entering={FadeIn.duration(200)}` (no `exiting`, so there's no layout jump). The cover's `expo-image` gets `transition={200}`, which crossfades the source natively |
| 6.9 | Interrupt: tap the bar mid-collapse, chevron mid-expand | The guards in §2.2 allow it | The new command assigns the opposite target. The spring continues from the current value and velocity. A new drag starts from `expand.get()` |
| 6.10 | Double tap a row; tap during `miniLeaving` or `opening` | Ignored by `openNowPlaying`'s guard | — |
| 6.11 | Deep link `/player?slug=` | §2.5 | `showNowPlayingWithoutMotion` |
| 6.12 | Window size changes (split screen, foldable) | none | In `PlayerSurface`, an effect on `windowWidth`/`windowHeight` writes the geometry and snaps: `expand` to exactly 0 if `closed`, otherwise 1; `enterY` to 0 (spec §6.16) |
| 6.13 | Launch | No bar (Stage 11). Nothing to animate | — |
| 6.14 | Audio or artwork still loading | Never waits. The big button shows its Stage 11 loading look | The cover frame animates with its placeholder colour; the image fades in on load |

### 6.5 The two gestures (Gesture Handler 3 hook API)

```ts
// On the full layer's root.
const collapsePan = usePanGesture({
  activeOffsetY: [-10, 10],
  failOffsetX: [-12, 12],         // horizontal movement belongs to the seek bar (spec §6.17)
  onActivate: () => {
    'worklet';
    dragStartExpand.set(expand.get());
  },
  onUpdate: (event) => {
    'worklet';
    const swipeRange = geometry.get().windowHeight - geometry.get().miniRect.y;
    const nextExpand = dragStartExpand.get() - event.translationY / swipeRange;
    expand.set(clamp(nextExpand, 0, 1));   // no scheduleOnRN here: this runs every frame
  },
  onDeactivate: (event) => {
    'worklet';
    // …shouldCollapseAfterSwipe → spring to 0 or 1 with velocity = -event.velocityY / swipeRange
    // …only when collapsing: scheduleOnRN(closeNowPlayingAfterSwipe) once
  },
});
```

- `dragStartExpand` is a `useSharedValue` in the component, not a module value.
- `closeNowPlayingAfterSwipe` only updates the store (`closing`, then `closed` from the spring's completion). It must **not** start a second animation. The worklet already did.
- The swipe range is the distance from the bar to the top, not the screen height. Otherwise the player lags behind the finger (spec §9).
- Check the installed `PanGestureConfig` for the exact option names (`activeOffsetY`, `failOffsetX`, the event fields `translationY`/`velocityY`). They were present in `node_modules/react-native-gesture-handler/lib/typescript/v3/hooks/gestures/pan/` when this plan was written.
- The bar's pan: `activeOffsetY: 10` (moving down activates, moving up never does), `failOffsetX: [-12, 12]`, so taps on its buttons and the text area still work.
- Swipe-down follows the finger even with reduced motion on (spec §6.14: the user is driving it).

### 6.6 Android back

In `PlayerSurface`: `BackHandler.addEventListener('hardwareBackPress', …)` registered while the presentation is `opening` or `open`. It calls `closeNowPlaying()` and returns `true`. `predictiveBackGestureEnabled` is `false` in `app.json`. If that is ever turned on, recheck this. On web, `BackHandler` does nothing, and browser back navigates the tabs as normal. Record that as a known difference.

## 7. Reduced motion

`PlayerSurface` reads `useReducedMotion()` and passes it into the motion module once, with `setPrefersReducedMotion(value)` in an effect. A module variable is the plain way for non-component flows to know. When it is on:

| Change | Instead of the spring or timing |
|---|---|
| Entrance, expand, collapse | A 200 ms crossfade through the surface: the surface root's opacity goes 1 → 0 over 100 ms, the value jumps to its target at the midpoint (`withDelay(100, withTiming(target, { duration: 0 }))`), and opacity goes 0 → 1 over 100 ms. `enterY` is never used |
| Bar drop | `miniDrop` goes straight to the end with only the opacity part over 150 ms (no lift, no 70 px move): set a `translateY` factor of 0 in the bar's style when reduced |
| Tuck | Dim only. No scale, no translate (§5.5) |
| Swipe | Unchanged |

This needs one more shared value, `surfaceOpacity` (module scope, normally 1). Keep the reduced branch in each command as a plain `if` at the top.

## 8. Accessibility (things the native modal did for free)

| Concern | What to do |
|---|---|
| Screen reader reaches the tabs behind Now Playing | While presentation isn't `closed`: `TuckedContent` gets `accessibilityElementsHidden` (iOS) and `importantForAccessibility="no-hide-descendants"` (Android). The full layer gets `accessibilityViewIsModal` |
| Focus on open | On `open`, move focus to the chevron ("Minimise player") with `AccessibilityInfo.setAccessibilityFocus(findNodeHandle(ref))`, in the flow's `markNowPlayingOpen` through a registered ref, or in a `PlayerSurface` effect on `open` |
| Focus on close | Don't move it. The bar never grabs focus (Stage 11 §5.5) |
| Hidden layer still readable | The full layer is `importantForAccessibility="no-hide-descendants"` while `closed`. The bar layer is hidden while not `closed` |
| Swipe-only actions | The bar already has "Stop and close player" (Stage 11). The chevron covers the full player |

## 9. Performance rules for this stage

- **No React state in the motion path.** Gesture callbacks and animation updates only touch shared values. `scheduleOnRN` appears only in `onDeactivate` and in completion callbacks: once per gesture or animation, never in `onUpdate`.
- **Never read a shared value during render.** Read geometry and values only inside `useAnimatedStyle`, worklets and effects.
- **Transforms and opacity only**, except the background view (childless) and the tuck wrapper's `borderRadius` (one view, clipped).
- **Don't animate** shadows, elevation, blur, padding, font sizes.
- **The full layer stays mounted** while the bar shows (it's needed for the morph). Its blocks are `memo`'d, and only the seek bar and time labels re-render from `positionSec`. Measure that cost in §11.4. If the hidden seek bar shows up in a profile, render a static placeholder while `closed`.
- **Cover image:** `docs/cover-art.jpg` is local and small (62 KB). When remote artwork arrives, decode at about display size (≈600 px) and prefetch with `expo-image` from the list (spec §8).
- `CADisableMinimumFrameDurationOnPhone`: check that the SDK 58 prebuild sets it (`ios/…/Info.plist` after `npx expo prebuild`, or the generated config). If not, add it to `app.json` `ios.infoPlist`, so ProMotion phones run at 120 fps.

## 10. Tests (extend Stages 9–11)

Set up Reanimated's Jest support as the 4.7 testing docs describe (check the current helper; don't guess the import path). With fake timers, assigning an animation and advancing time moves the shared value.

### 10.1 Geometry: `src/features/player/__tests__/player-surface-geometry.test.ts`

| Test | Assertion |
|---|---|
| openness during entrance | `expand` 1, `enterY` = windowHeight → 0; `enterY` 0 → 1; halfway → 0.5 |
| openness during morph | `enterY` 0, `expand` 0.3 → 0.3 |
| openness with overshoot | `enterY` −10 → 1 (clamped) |
| cover at expand 0 | Its centre equals the thumbnail's centre; `scale` = 44 / cover width; the visible radius (`borderRadius × scale`) is 10 |
| cover at expand 1 | No translation, scale 1, radius 28 |
| background frame | expand 0 = `miniRect`, radius 20; expand 1 = full width, height `windowHeight + BACKGROUND_BLEED`, radius 0 |
| swipe thresholds | Under 18 % and slow → stay; over 18 % → collapse; short but `velocityY` 1200 → collapse. Bar: 20 px slow → stay; 30 px → dismiss; 5 px at 900 → dismiss |

### 10.2 Flows: `src/features/player/__tests__/open-now-playing.test.ts` (rewritten from Stage 11 §8.2)

The engine, `router` and `player-surface-motion` are mocked. The motion mocks record calls and expose their `onFinished` so tests can finish an animation on demand.

| Test | Assertion |
|---|---|
| nothing loaded | `opening` set before `playLecture`; `playLecture` before `enterFresh` (`invocationCallOrder`). No `router.navigate` at all |
| finishing the entrance | Calling `enterFresh`'s `onFinished(true)` → `open`. `onFinished(false)` → stays `opening` |
| same lecture, bar showing | `expandFromMini`, no `playLecture`, no `pause`. `resumeIfPaused` → `resume` once |
| switch | `miniLeaving` at once, `pause`, `dropMini`. `playLecture` and `enterFresh` are **not** called until `MINI_EXIT_MS` has passed. Then `opening`, `playLecture(B)`, `enterFresh` in that order |
| the bar never shows B | During the wait, the current lecture is still A and `selectIsMiniPlayerVisible` is false |
| guards (§2.2) | One test per row: each request in each presentation is either run or ignored as the table says |
| retarget | Presentation `closing` + `openNowPlayingForLoadedLecture` → `opening`, `expandFromMini` called. Then the collapse's `onFinished(false)` arrives → presentation is still `opening` |
| close | `closeNowPlaying` → `closing`, `collapseToMini`; `onFinished(true)` → `closed` |
| dismiss | `miniLeaving`, `dropMini`; after `MINI_EXIT_MS`: `stopAndClear`, then `closed` |
| Search | `leaveSearchFirst` → `router.back()` before `enterFresh` |
| failure | `playLecture` throws → `closed`, error rethrown |

### 10.3 Motion commands: `src/features/player/__tests__/player-surface-motion.test.ts`

With Reanimated's Jest timers:
- `enterFresh` → `expand` is 1 at once, `enterY` starts at the window height and is 0 after 1 s; `onFinished(true)` called once.
- `collapseToMini` then `expandFromMini` 100 ms later → `expand` ends at 1; the collapse's callback got `false`.
- reduced motion → `enterY` never moves from 0; `expand` reaches its target by 200 ms; `surfaceOpacity` dips and returns to 1.

### 10.4 Surface: `src/components/PlayerSurface/__tests__/`

| Test | Assertion |
|---|---|
| nothing loaded | Renders nothing |
| closed + bar visible | The bar's "Open player: {title}, {author}" is reachable; "Minimise player" is not (hidden) |
| open | "Minimise player" reachable; the tabs' content is hidden from accessibility |
| back handler | With presentation `open`, a back press calls `closeNowPlaying` and returns `true`; with `closed`, no listener is registered |
| bar buttons | Unchanged from Stage 11 §8.5 (toggle, skip, dismiss action) |
| footer space | `selectHasMiniPlayerSpace` true → a 62 px space in the footer, also while presentation is `open` |
| re-renders | Changing `positionSec` re-renders the progress line and seek bar, not `PlayerSurface` or the title blocks |

### 10.5 Guards (`scripts/check-rules.js` or the Jest guard test)

- No `router.navigate`/`push`/`replace` to `/player` inside `src/` (only `src/app/player.tsx` exists as a route).
- `setNowPlayingPresentation(` is called only from `open-now-playing.ts`.
- `player-surface-motion.ts` doesn't import the store or the engine.
- No `runOnJS` and no `.value` on shared values in `src/features/player/` and `src/components/PlayerSurface/`.
- No `scheduleOnRN` inside an `onUpdate` (grep the gesture files).

### 10.6 Prove the tests can fail

Break each, confirm the named test fails, revert:
1. Use `Math.max(tuck, expand)` → "openness during entrance".
2. Set `open` in a completion callback without checking `finished` → "retarget".
3. Call `playLecture` before the switch wait → "the bar never shows B".
4. Divide the swipe by the window height instead of the swipe range: add a geometry test for "finger and player move together" first, then confirm it fails.

## 11. Verification

### 11.1 Static
`npx expo lint`, `npx tsc --noEmit`, `npm run check:theme` (or `check:rules`) and `npm test` pass.

### 11.2 iOS simulator (dev build), driven by AXe, recorded

Record each flow with `xcrun simctl io booted recordVideo <file>.mov`. Extract frames (`ffmpeg -i <file>.mov -vf fps=30 frames/%04d.png`) and compare them with the same moments in `docs/videos/mini-player.mov`:
1. Fresh launch, tap a row → the sheet rises with a slight overshoot, the cover leads, the text arrives after it, and the list tucks and dims. No frame shows the bar.
2. Chevron → the player shrinks into the bar, and the cover lands exactly on the thumbnail (check the last 3 frames for a jump). The bar's text fades in over the last quarter.
3. Tap the bar → it grows into the player; the cover leaves the thumbnail without a jump.
4. Bar A, tap row B → the bar lifts slightly, drops and fades; then B's sheet rises. No frame shows B in the bar.
5. Slow swipe down → the player follows the finger exactly (pick a point on the cover and watch it under the cursor). Release at 10 % → springs back. Release at 30 % → collapses. Short fast flick → collapses.
6. Swipe the bar down a little and release → it springs back. Swipe further → it drops, audio stops.
7. Tap the bar mid-collapse, then the chevron mid-expand → it reverses smoothly each time, never jumps, never stacks.
8. Double-tap a row → one sheet.
9. Search → a result → Search slides away and the sheet rises behind it.
10. The event pill on Now Playing → the player collapses and Event detail is underneath with the bar.
11. Seek bar drag on Now Playing → scrubs; it never starts the dismiss swipe.
12. Reduce Motion on (Settings → Accessibility) → every change is a short crossfade with no scale; the swipe still follows the finger.
13. Dark mode → the bar's olive turns into the charcoal background smoothly; the outline fades out.
14. Largest text size → the bar's height doesn't change; the full player's three-line title still fits above the controls.
15. VoiceOver → on open, focus lands on "Minimise player"; swiping right never reaches the tabs behind; on close, the bar is reachable.

### 11.3 Web (Android stand-in)
With `playwright-cli` and video recording on: flows 1–8 and 11, using mouse drags for the swipes. Check there are no console errors and that the tuck renders with rounded, clipped corners.

### 11.4 Performance (release build)
- `npx expo run:ios --configuration Release` on the simulator, Perf Monitor on. Record the UI and JS FPS during flows 1–5. The UI FPS must stay at the display rate.
- **Proof that the motion runs on the UI thread:** temporarily add a 300 ms busy loop at the start of `playLecture`, in a local change that is never committed. Flow 1 must still animate smoothly while the JS FPS drops. Then remove the loop.
- React DevTools Profiler during flow 2: `PlayerSurface` commits at most twice (`closing`, `closed`). No commits during the motion itself.

### 11.5 Real devices (the user runs these)
- [ ] Android release build on the slowest phone available: flows 1–7, GPU rendering profile bars under the 16 ms line (8 ms on 120 Hz).
- [ ] Android back on Now Playing → collapses into the bar; never leaves the app.
- [ ] Android three-button navigation → the bar and the player's controls clear the navigation bar.
- [ ] Feel check: flick strength carries into the collapse; the bar drop curve doesn't feel sluggish at the start; the 390 ms collapse compared with the video's faster one. Tune `player-motion-config.ts` only.
- [ ] TalkBack: the same as VoiceOver (flow 15).
- [ ] iPhone with ProMotion: 120 fps during the entrance (Perf Monitor).

Report each item as pass, fail or not checked.

## 12. Build order within the stage

Each step leaves the app working. Commit after each.
1. **Move without motion.** `PlayerSurface` with the two layers switching instantly on presentation, `TuckedContent` without a style, the footer space, the flows rewritten, the `/player` shim, back handler, accessibility (§2, §5.2, §6.6, §8). Run the Stage 11 tests: behaviour must be identical.
2. **Geometry and the morph** (§3, §5.1, §6.2–6.3) with the chevron and the bar tap.
3. **Entrance and tuck** (§5.4, §5.5, §6.1).
4. **Gestures** (§6.5) and interruptions (§6.9).
5. **Drop and rise** (§6.4, §6.6, §6.7) and auto-advance (§6.8).
6. **Reduced motion** (§7).
7. **Performance pass** (§9, §11.4).

## 13. AGENTS.md updates

- Navigation: Now Playing is **an overlay in `(tabs)/_layout.tsx`, not a route**. `/player` exists only for deep links. Nothing in the app navigates to it. Say why (the morph and the tuck need one view tree).
- State table: `nowPlayingPresentation` gains `miniLeaving`, and is written only by `open-now-playing.ts`. Add "Player motion (`expand`, `enterY`, `miniDrop`, `surfaceOpacity`, geometry) → Reanimated shared values at module scope in `player-surface-motion.ts`. Never in Zustand, never in React state".
- Mini player section: the bar lives in `PlayerSurface`; the footer only reserves its space. Replace Stage 11's "the bar lives in the tabs footer, and why".
- Motion rules: values only in `player-motion-config.ts`; `scheduleOnRN` never in `onUpdate`; `.get()`/`.set()` only.

## 14. Files touched

- New:
  - `src/features/player/player-surface-motion.ts`
  - `src/features/player/player-surface-geometry.ts`
  - `src/features/player/player-motion-config.ts`
  - `src/components/PlayerSurface/index.tsx`, `surface-background.tsx`, `surface-cover.tsx`, `surface-mini-layer.tsx`, `surface-full-layer.tsx`, `tucked-content.tsx`
  - `src/components/TabBar/mini-player-space.tsx`
  - the tests in §10
- Edited:
  - `src/features/player/player.store.ts` (§2.1)
  - `src/features/player/open-now-playing.ts` (§2.4)
  - `src/app/(tabs)/_layout.tsx` (§1)
  - `src/app/_layout.tsx` (the `player` screen's `animation: 'none'`, no `fullScreenModal`)
  - `src/app/player.tsx` (§2.5)
  - `src/components/TabBar/tabs-footer.tsx` (§2.3)
  - `src/components/MiniPlayer/index.tsx` (`thumbnail` slot, `maxFontSizeMultiplier`)
  - the Search result handler (`leaveSearchFirst`)
  - `AGENTS.md`
- Deleted:
  - `src/features/player/use-now-playing-presentation.ts` and its test
  - `src/components/MiniPlayer/mini-player-slot.tsx`
  - `src/features/player/mini-player-motion.ts`
