# Spring sheet player: implementation guide

React Native, Android first. This document covers the lecture list → now playing transition, the mini player, and every situation the player can be in.

## 1. What it looks like

When nothing is playing, tapping a lecture card makes the now playing screen spring up from the bottom of the screen while the list behind it shrinks slightly, rounds its corners and dims. Closing the player (chevron, Android back, or swiping down) shrinks the player into the mini player that sits above the tab bar: the cover becomes the thumbnail, the title and speaker become the bar’s text, and the big pause button becomes the bar’s pause button. Tapping the mini player grows it back into the full player. Tapping a different lecture dismisses the mini player with a short swipe-down and springs the new lecture’s player up.

An optional variant, **Sheet + moonlight reveal**, adds one flourish to the first entrance: the artwork spreads out from the crescent moon as the sheet lands. It is covered in section 7.

## 2. Why this is the default choice

It is the easiest and cheapest of the options we prototyped. Everything is driven by two or three numbers on the UI thread, and almost everything animated is a transform or an opacity, which Android composites on the GPU without re-running layout. It does not depend on which card was tapped, so it behaves the same from the list, the Events tab, search, a notification or a deep link. It also matches the player’s own design: the chevron and the “Playing from Latest lectures” header already describe a sheet that pulls down.

## 3. Libraries

| Library | Used for | Notes |
|---|---|---|
| `react-native-reanimated` | All animation values, springs, timings, interpolation, running on the UI thread | Reanimated 4 needs the New Architecture. In Reanimated 4, `scheduleOnRN` from `react-native-worklets` replaces `runOnJS`; `runOnJS` still works in older versions. The sketches below use `runOnJS` for familiarity. |
| `react-native-gesture-handler` | Swipe down to dismiss on the player and on the mini player | Use the v2 `Gesture` API with `GestureDetector`. |
| `react-native-safe-area-context` | Positioning the mini player above the tab bar and the system navigation bar | Required with Android’s edge-to-edge layout. |
| `expo-image` | Cover artwork with memory caching and prefetching | Prefetch artwork when the list renders so the cover is decoded before any transition starts. |
| `react-native-track-player` (or your audio layer) | Playback, notification and lock-screen controls | Kept completely separate from the UI. Animations never wait for audio. |
| `@gorhom/bottom-sheet` (optional) | Can replace the hand-written pan and snap logic | It exposes `animatedIndex` and `animatedPosition`, which you can feed into the same interpolations. The hand-written version below is short, gives full control over the mini ↔ full morph and avoids fighting the library’s own layout. |
| `@shopify/react-native-skia` (optional) | Only for the moonlight reveal | Skip it if you don’t use the reveal. |

## 4. Architecture

### 4.1 The player is an overlay, not a screen

Render the player once, at the root of the app, above the tab navigator. Do not push it as a navigation route. The mini player and the full player are the same component in two states, and the morph between them needs both states in one view tree. A route would also play the navigator’s own transition on top of ours.

```
<App>
  <TabNavigator />            // Home (lecture list), Events
  <PlayerSurface />           // absolute, full window, pointerEvents="box-none"
</App>
```

`PlayerSurface` renders nothing when nothing is playing, the mini bar when collapsed, and the full player when expanded.

### 4.2 One state machine

Keep the player’s UI state in your store (Zustand, Redux, context: anything outside the list), separate from the playback state.

| UI state | What is on screen | Entered by |
|---|---|---|
| `hidden` | No player, no mini bar | App start with nothing saved, mini bar dismissed |
| `entering` | Sheet springing up from the bottom | Tapping a card when hidden |
| `full` | Now playing screen | End of `entering` or `expanding` |
| `collapsing` | Player shrinking into the bar | Chevron, back button, swipe released past threshold |
| `mini` | Mini bar above the tab bar | End of `collapsing`, app start with a saved session |
| `expanding` | Bar growing into the player | Tapping the bar, tapping the playing lecture’s card |
| `miniExiting` | Bar dropping away | Swiping the bar down, tapping a different card |

Inputs that arrive during `entering` and `miniExiting` are ignored. Inputs during `collapsing` and `expanding` retarget the animation instead (section 6.9), which is what makes the player feel responsive.

### 4.3 Three animated values

All motion comes from three shared values. Nothing else is animated independently.

| Value | Range | Meaning |
|---|---|---|
| `expand` | 0 → 1 | 0 is the mini bar, 1 is the full player. Drives the mini ↔ full morph and the list tuck. Swipe-down scrubs this directly. |
| `enterY` | screen height → 0 | Vertical offset of the whole full player during the first entrance only. 0 the rest of the time. |
| `miniDrop` | 0 → 1 | 0 is the bar in place, 1 is the bar dropped away. Used for dismissing and for the bar’s own entrance. |

Measure the fixed geometry once per layout: the mini bar’s rectangle, its thumbnail and pause button, the full cover’s rectangle and the big pause button. These come from the layout, not from the tapped card, which is why this variant is robust.

```ts
const MINI_H = 58;
const TAB_H = 72;
const mini = {
  x: 10,
  w: screenW - 20,
  h: MINI_H,
  y: screenH - insets.bottom - TAB_H - 8 - MINI_H,
};
```

## 5. Animation strategy

### 5.1 The surface morph (mini ↔ full)

The player has four layers, each driven by `expand`:

1. **Background shape.** One childless `Animated.View` whose rectangle goes from the mini bar’s rectangle (radius 18, colour `#22241B`) to the full window (radius 0, colour `#F0EADD`). This is the only place where layout properties (`left`, `top`, `width`, `height`) are animated. On a single view with no children the cost is small. If profiling on a low-end phone shows jank, draw this rectangle with Skia instead.
2. **Cover.** The real full-size cover image, moved and scaled with transforms so that at `expand = 0` it sits exactly on the mini thumbnail. Because it is scaled, its corner radius is divided by the scale so the thumbnail keeps 10 px corners.
3. **Mini content** (title, speaker, forward-15 button, progress line). Fades out over the first quarter of the morph.
4. **Full content** (header, title, speaker, location, date, chips, progress, controls). Fades and drifts up over the last two thirds, staggered.

The big pause button gets the same treatment as the cover: its background is a separate view scaled from the mini pause button’s 36 px circle to the 86 × 68 rounded rectangle, with the icon as an unscaled sibling so it doesn’t stretch.

```tsx
const bgStyle = useAnimatedStyle(() => {
  const e = expand.value;
  return {
    left: interpolate(e, [0, 1], [mini.x, 0]),
    top: interpolate(e, [0, 1], [mini.y, 0]),
    width: interpolate(e, [0, 1], [mini.w, screenW]),
    height: interpolate(e, [0, 1], [mini.h, screenH]),
    borderRadius: interpolate(e, [0, 1], [18, 0]),
    backgroundColor: interpolateColor(e, [0, 0.6], ['#22241B', '#F0EADD']),
  };
});

const coverStyle = useAnimatedStyle(() => {
  const e = expand.value;
  const s = interpolate(e, [0, 1], [thumb.w / cover.w, 1]);
  // RN scales around the centre, so translate between centres
  const dx = thumb.x + thumb.w / 2 - (cover.x + cover.w / 2);
  const dy = thumb.y + thumb.h / 2 - (cover.y + cover.h / 2);
  return {
    borderRadius: interpolate(e, [0, 1], [10 / (thumb.w / cover.w), 28]),
    transform: [
      { translateX: interpolate(e, [0, 1], [dx, 0]) },
      { translateY: interpolate(e, [0, 1], [dy, 0]) },
      { scale: s },
    ],
  };
});

const miniContentStyle = useAnimatedStyle(() => ({
  opacity: interpolate(expand.value, [0, 0.25], [1, 0], Extrapolation.CLAMP),
}));

const fullTitleStyle = useAnimatedStyle(() => {
  const t = interpolate(expand.value, [0.35, 1], [0, 1], Extrapolation.CLAMP);
  return { opacity: t, transform: [{ translateY: (1 - t) * 16 }] };
});
```

In the HTML prototype the title also travels from the bar to its place in the player. In React Native, a crossfade with a small upward drift is simpler and looks better here, because the bar’s title is a single truncated line and the player’s title can wrap to three lines.

### 5.2 The list tuck

While the player is open, the screen behind it shrinks to 92 %, moves down 12 px, rounds to 26 px corners and dims to 30 % black. Drive it from the same `expand` value so it tracks the swipe exactly.

Apply the transform to a wrapper around the whole tab navigator, not to the `FlatList`. Scaling a wrapper lets Android scale one composited layer. Set `renderToHardwareTextureAndroid` on that wrapper only while the player is moving, and turn it off when it settles, because the texture costs memory.

### 5.3 The first entrance (nothing playing)

The player renders at `expand = 1` and `enterY` springs from the screen height to 0. The list tuck uses its own spring in parallel. The cover, title, speaker, details and controls arrive with small staggers so the sheet doesn’t land as a flat block.

### 5.4 Motion values

These are the values from the prototype. Tune them on a real device.

| Motion | Animation | Value |
|---|---|---|
| Sheet entrance (`enterY`) | `withSpring` | stiffness 230, damping 25, mass 1 (slight overshoot) |
| List tuck on entrance | `withSpring` | same spring; to scale 0.92, translateY 12, radius 26, dim 0.3 |
| Cover on entrance | `withSpring`, delay 80 ms | stiffness 180, damping 16; from translateY 40 and scale 0.9 |
| Text on entrance | `withTiming`, 360 ms, delays 170 / 210 / 250 / 290 ms | fade + translateY 14 → 0 |
| Progress on entrance | `withTiming`, 600 ms, delay ~380 ms | sweep from 0 to the saved position |
| Expand (bar → player) | `withSpring` | stiffness 220, damping 26 (no visible bounce) |
| Collapse from chevron or back | `withTiming`, ~390 ms | `Easing.bezier(0.4, 0, 0.2, 1)` |
| Collapse after a swipe | `withSpring` with the finger’s velocity | stiffness 220, damping 26 |
| Snap back after a short swipe | `withSpring` | stiffness 260, damping 22 |
| Swipe threshold | — | more than 18 % of screen height, or downward velocity above ~1000 px/s |
| Mini bar exit (`miniDrop`) | `withTiming`, 320 ms | small −5 px lift in the first 18 %, then down 70 px and fade, `Easing.bezier(0.4, 0, 0.9, 0.6)` |
| Mini bar entrance | `withSpring` | from translateY 70 and opacity 0 |

## 6. Situations

| # | Situation | What the user sees |
|---|---|---|
| 1 | First tap, nothing playing | Sheet springs up, list tucks back |
| 2 | Closing the player | Player shrinks into the mini bar |
| 3 | Tapping the mini bar | Bar grows into the player |
| 4 | Tapping the card that’s already playing | Card presses, bar grows into the player |
| 5 | Tapping a different card while the bar shows | Bar drops away, new sheet springs up |
| 6 | Dismissing the mini bar | Bar drops away, playback stops |
| 7 | Tapping a card’s play button | Plays without opening; bar rises or is replaced |
| 8 | Opening without a card (notification, deep link, Events, search) | Same as 1 or 3 |
| 9 | Interrupting an animation | Retargets or ignores, never stacks |
| 10 | Swipe released early | Springs back to full |
| 11 | Lecture ends or auto-advances | Content crossfades in place |
| 12 | App launch with a saved session | Bar is already there |
| 13 | Switching tabs or scrolling while playing | Nothing special |
| 14 | Reduce motion is on | Short crossfades |
| 15 | Artwork or audio still loading | Animate anyway, fill in when ready |
| 16 | Screen size changes | Re-measure, snap to state |
| 17 | Gesture conflicts inside the player | Scrubbing wins horizontally, dismiss wins vertically |

### 6.1 First tap, nothing playing yet

The UI state goes `hidden → entering → full`. Start loading the lecture in the audio layer at the same moment, but never `await` it before animating. Set `expand` to 1 and `enterY` to the screen height without animating, mount the player, then spring `enterY` to 0. When the spring finishes, switch to `full` from its completion callback.

```ts
function openFresh(lecture: Lecture) {
  player.load(lecture);               // fire and forget
  setUi('entering');
  expand.value = 1;
  enterY.value = screenH;
  enterY.value = withSpring(0, SHEET_SPRING, (done) => {
    if (done) runOnJS(setUi)('full');
  });
  tuck.value = withSpring(1, SHEET_SPRING);
}
```

`tuck` here is the list tuck during the entrance. After the entrance, the tuck reads from `expand` instead. One way to do this is to make the list style read `Math.max(tuck.value, expand.value)` while the player is visible.

### 6.2 Closing the player

There are three ways in, and all three land in the mini bar.

The **chevron** and the **Android back button** run `expand` from 1 to 0 with a ~390 ms timing. When it completes, set the state to `mini`. Register the back handler only while the state is `full`, and return `true` so the app doesn’t navigate away.

```ts
useEffect(() => {
  if (ui !== 'full') return;
  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    collapse();
    return true;
  });
  return () => sub.remove();
}, [ui]);
```

A **swipe down** scrubs `expand` with the finger, so the player visibly shrinks towards the bar while you drag. On release past the threshold it springs to 0, carrying the finger’s velocity so a flick feels like a flick.

```ts
const range = screenH - mini.y;
const pan = Gesture.Pan()
  .activeOffsetY([-10, 10])
  .failOffsetX([-12, 12])
  .onStart(() => { start.value = expand.value; })
  .onUpdate((e) => {
    expand.value = Math.min(1, Math.max(0, start.value - e.translationY / range));
  })
  .onEnd((e) => {
    const close = e.translationY > screenH * 0.18 || e.velocityY > 1000;
    expand.value = withSpring(
      close ? 0 : 1,
      { ...MORPH_SPRING, velocity: -e.velocityY / range },
      (done) => { if (done) runOnJS(setUi)(close ? 'mini' : 'full'); },
    );
  });
```

On Android 13 and later, predictive back may be enabled for your app. Check how your React Native version delivers back events with predictive back on; at minimum the back press must collapse the player rather than leave the screen.

### 6.3 Tapping the mini player

`mini → expanding → full`. Spring `expand` from 0 to 1. The bar itself doesn’t pulse or bounce first; the bar simply starts growing, which is the fastest path from tap to player. Buttons inside the bar (pause, forward 15) handle their own taps and do not open the player.

### 6.4 Tapping the card that’s already playing

Same as 6.3. The card gives a short press response (scale to 0.97 and back over ~240 ms, or your normal pressable feedback) and the bar grows into the player in the same frame. Nothing waits for the press animation. The card itself does not expand, because the audio already lives in the bar.

### 6.5 Tapping a different card while the mini player shows

Two beats, in order:

1. `mini → miniExiting`. The bar plays its dismissal: a tiny lift, then down 70 px and fade, over 320 ms. The tapped card presses at the same time. Start loading the new lecture now.
2. When the drop finishes, unmount the bar and run the first entrance (6.1) for the new lecture.

If 320 ms + entrance feels long on device, start the entrance when the drop is about 70 % through. The two motions go in opposite directions, so the overlap reads cleanly.

Decide what happens to the previous lecture’s position: save it so returning to that lecture resumes where the user left off.

### 6.6 Dismissing the mini player

Swiping the bar down (a `Gesture.Pan` on the bar, threshold ~24 px or a downward flick) runs the same drop animation as 6.5. On completion, stop playback (or pause and clear the queue, depending on your product decision) and set the state to `hidden`. The bar follows the finger during the drag (`miniDrop` scrubbed by `translationY`) and springs back if released early.

Also stop the foreground service and remove the media notification, so the notification doesn’t outlive the bar.

### 6.7 Tapping a card’s play button (play without opening)

This situation is missing from the prototype. Give the card two targets: the card body opens the player, and the round play button plays in place.

- **Nothing playing:** start playback and bring the bar up with its entrance spring (`miniDrop` 1 → 0). The player stays closed.
- **A different lecture is playing:** drop the old bar (6.6 without stopping playback), then raise the new one. This reuses motions the user already knows.
- **The same lecture:** toggle pause. No bar animation.

The card’s play icon switches to the olive “playing” style in all cases.

### 6.8 Opening without a card

Notifications, the lock screen, deep links, search results and the Events tab have no lecture card to start from. This variant doesn’t need one:

- **If that lecture is in the bar,** run 6.3.
- **If nothing is playing, or it’s a different lecture,** run 6.1, or 6.5 when a bar is showing.

When the app is cold-started from a notification, skip the entrance and render the player directly at `full`. Animating during startup competes with JavaScript loading and usually stutters.

### 6.9 Interrupting an animation

- **During `expanding` or `collapsing`:** a tap on the bar, the chevron or the back button retargets `expand` to the other end. Reanimated springs continue from the current value and velocity, so the motion reverses smoothly instead of jumping. A new drag also takes over from the current value (the pan’s `onStart` reads `expand.value`).
- **During `entering` and `miniExiting`:** ignore card taps. Keep a shared value such as `isBusy` so the check happens on the UI thread, not after a React re-render.
- **Double taps** on a card fall under the same rule. The second tap arrives while the first is `entering` and is dropped.

### 6.10 Swipe released early

If the release is under the threshold and slow, spring `expand` back to 1 with the stiffer snap-back spring. The list tuck follows automatically because it reads `expand`.

### 6.11 Lecture ends or auto-advances

The surface does not move. Inside whichever state is showing, crossfade the title, speaker, details and artwork (~200 ms each, old out then new in). Reset the progress bar without the entrance sweep. If the queue ends with nothing next, keep the bar showing in a paused state rather than dismissing it.

### 6.12 App launch with a saved session

If you restore the last lecture (paused), render the bar in place on the first frame with no entrance animation. A bar that animates in during launch draws attention to itself and competes with startup work.

### 6.13 Switching tabs or scrolling while playing

Nothing special happens, because the player lives above the navigator. The bar stays put across Home and Events. Make sure each tab’s scrollable content has bottom padding equal to the tab bar plus the bar plus a gap (about 160 px here), so the last card isn’t hidden behind the bar.

### 6.14 Reduce motion

Read the system setting with Reanimated’s `useReducedMotion()`, or pass `reduceMotion: ReduceMotion.System` in your animation configs. When it is on:

- **Entrance and expand:** a 200 ms crossfade, no spring, no list scale.
- **Collapse:** a 200 ms crossfade to the bar.
- **Bar dismissal:** a 150 ms fade.

Swipe-down still follows the finger, because the user is driving it.

### 6.15 Artwork or audio still loading

Never block the transition on audio. Show the player immediately, and show a loading state on the big button (spinner inside the olive shape) until playback starts.

For artwork, prefetch with `expo-image` when the list renders, and use the same `cachePolicy` for the thumbnail and the cover so they share one decoded image. If the cover still isn’t ready, animate the cover frame with its placeholder colour (`#2F3D2E`) and fade the image in on `onLoad`.

### 6.16 Screen size changes

Rotation, foldables and split screen change every measured rectangle. Lock the player to portrait if your app is portrait-only. Otherwise, on a dimension change, cancel any running animation, re-measure, and set `expand` to exactly 0 or 1 to match the current state.

### 6.17 Gesture conflicts inside the player

The player has two competing pans: swipe down to dismiss, and horizontal scrubbing on the progress bar. Give the dismiss pan `activeOffsetY([-10, 10])` and `failOffsetX([-12, 12])` so it only activates on clearly vertical movement, and give the slider its own horizontal pan. If the player’s content ever scrolls (for example, a long description), only allow the dismiss pan when the scroll view is at the top, with `Gesture.Native()` and `simultaneousWithExternalGesture`, or by attaching the dismiss pan to the header and cover only.

## 7. Optional: moonlight reveal on the first entrance

During 6.1, after about 260 ms (as the spring settles), reveal the artwork with a circular mask centred on the crescent moon (49.7 % across, 12.5 % down the cover) growing to cover the whole image over 720 ms, while the image eases from scale 1.1 to 1. The cover frame starts with the card’s beige (`#E2D9C5`) and turns to the sky green (`#2F3D2E`) as the reveal runs.

Draw the cover with Skia during the entrance: an `Image` inside a `Group` whose `clip` is a circle path derived from a shared value. Replace the Skia canvas with the normal `expo-image` cover when the reveal finishes, in the same frame (flip opacities with a shared value, then unmount the canvas on the JS side).

```tsx
const radius = useSharedValue(0);
const clip = useDerivedValue(() => {
  const p = Skia.Path.Make();
  p.addCircle(size * 0.497, size * 0.125, radius.value);
  return p;
});

<Canvas style={{ width: size, height: size }}>
  <Group clip={clip}>
    <Image image={artwork} x={0} y={0} width={size} height={size} fit="cover" />
  </Group>
</Canvas>
```

Only use the reveal on the first entrance (6.1, and the entrance inside 6.5). Expanding from the bar already has a continuous story (the thumbnail becomes the cover), so a reveal there would be one effect too many.

If you’d rather not add Skia, a 400 ms scale-and-fade on the cover (scale 1.06 → 1, opacity 0 → 1) gets most of the effect with no dependency.

## 8. Performance

**Keep everything on the UI thread.** Every value above is a Reanimated shared value updated by springs, timings or gesture callbacks. Do not drive animation from React state. A `setState` in a gesture callback or per frame forces re-renders on the JS thread, which is exactly when JavaScript is busiest (loading audio, rendering the player).

**Animate transforms and opacity.** The background shape is the one exception, and it is a single childless view. Do not animate padding, margins, font sizes or anything that makes the player’s content re-layout.

**Don’t animate shadows or elevation.** Android elevation shadows are expensive to recompute every frame. Keep the cover’s shadow at its final value, or fade a pre-rendered shadow image under it.

**Avoid live blur.** If you add a blurred backdrop, use a pre-blurred image.

**Keep images small.** Decode artwork at roughly the display size (about 600 px for the cover), not the source size. A 2000 px JPEG decoded during the entrance will drop frames.

**Rasterise the tucked list.** Wrap the navigator, set `renderToHardwareTextureAndroid` during transitions only, and memoise list rows so playback-state changes don’t re-render the whole list.

**Test in release builds on a low-end phone.** Debug builds run JavaScript much slower and give misleading results. Use the in-app performance monitor and Android’s GPU rendering profile bars to check that frames stay under 16 ms (or 8 ms on 120 Hz screens).

## 9. Caveats

**The list tuck is your own code.** Android’s native stack doesn’t scale the screen behind a modal, which is one more reason the player is an overlay.

**Edge-to-edge.** Recent Android versions draw apps under the status and navigation bars. Position the bar and the player’s controls with safe-area insets, or the chevron and the pause button can end up under system bars.

**`@gorhom/bottom-sheet` is not the morph.** It gives you the sheet, the snap points and the gestures, but the mini ↔ full morph (thumbnail to cover, bar colour to player colour) is still yours, driven from its `animatedPosition`. If you use it, the bar is the sheet at its lowest snap point.

**The swipe range is not the screen height.** Map the finger to `expand` using the distance between the bar and the top of the screen. Otherwise the player lags behind the finger.

**One source of truth.** The tapped card, the bar and the player must all read the same “now playing” lecture from the store. A card that shows “playing” while the bar shows another lecture is the most common bug in this pattern.

## 10. Testing checklist

- First tap on each card when nothing is playing.
- Close with chevron, back button, slow swipe, fast flick and a short swipe that snaps back.
- Tap the bar; tap the playing card; tap a different card; tap a card’s play button in each playback state.
- Swipe the bar away, then confirm the notification is gone.
- Tap the bar mid-collapse and the chevron mid-expand.
- Double-tap a card.
- Open from a notification with the app running and cold.
- Lecture ends with and without a next lecture.
- Reduce motion on.
- Three-line titles (for example, “Gravity of Talking Bad about the Ṣaḥābā Radiyallāhu ’Anhum”).
- A slow network, with artwork not cached.
- A low-end Android phone in a release build.