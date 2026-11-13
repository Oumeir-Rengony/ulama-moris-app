# Stage 11: Mini player (behaviour, not motion)

> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 10 (engine, store, status bridge, Now Playing wiring), Stages 4 and 7 (the tabs footer and its static mini player), Stage 8 (Search → Now Playing), Stage 9 (test setup).
> **Partly replaced by [Stage 12](stage-12-screen-animations.md).** The behaviour rules here still hold. Stage 12 changes these parts, so if both stages are built together, build them the Stage 12 way:
> - Now Playing becomes an overlay in `(tabs)/_layout.tsx`, not a `fullScreenModal` route. `openNowPlaying` drives the overlay instead of calling `router.navigate` (§3 here → Stage 12 §2.4).
> - §4 `use-now-playing-presentation.ts` is deleted. The overlay's animation callbacks set the presentation.
> - §5 The bar already floats in `(tabs)/_layout.tsx` (§5.1). Stage 12 replaces `mini-player-slot.tsx` there with its player overlay, and deletes `mini-player-motion.ts`. Stage 12's "footer keeps an empty space the bar's size" is replaced by §5.6 here (`useMiniPlayerSpace`): recheck Stage 12 §5 against the floating design before building it.
> - The `isNowPlayingOnScreen` boolean (§2) becomes Stage 12's `nowPlayingPresentation`, a set of values that includes `miniLeaving`, because the overlay needs retargeting. The §8.2 and §8.3 tests are rewritten in Stage 12 §10.

## Goal

Turn the static mini player into the real one. It shows the lecture that is loaded, **only after the user has seen that lecture open in Now Playing and left it**, and it stays on every tab screen while the lecture is in progress (playing, paused, loading, buffering or failed).

The spec is [docs/MINI-PLAYER.md](../docs/MINI-PLAYER.md). The reference recording is [docs/videos/mini-player.mov](../docs/videos/mini-player.mov). This stage is about **when the bar shows and what it shows**. Motion stays minimal: a short fade in and out. The video's morph between the bar and Now Playing is out of scope.

### What the video shows (checked frame by frame)

| Time | What happens | What it confirms |
|---|---|---|
| 0–3 s | Home, no bar. Tap the "Gravity of Talking Bad…" row → Now Playing slides up for that lecture | A Home row **opens Now Playing**. It doesn't play in place. The bar never appears during the opening (§5.1) |
| 4–6 s | Chevron down → Now Playing closes → **then** the bar fades in with "Gravity…", pause icon and forward 15. That row has the active look | The bar appears only after the screen has closed (§5.2) |
| 7–9 s | "Dismiss mini player" (a control in the prototype) → the bar leaves | Dismissing ends the session (§5.11) |
| 10–14 s | Tap "Sacrifices…" (no bar showing) → Now Playing → close → the bar shows "Sacrifices…" | §5.1 and §5.2 again |
| 15–16 s | Tap the bar → Now Playing for the **same** lecture at the **same** position (16:05) | Tapping the bar never reloads (§5.4) |
| 19–21 s | Bar showing "Sacrifices…". Tap the **different** row "Mauritius – Islamic Finance Hub" → the bar is gone in the next frame (the row takes the active look) → then Now Playing slides up with "Mauritius…" | The bar never shows the new lecture. It leaves first, then Now Playing opens (§5.6) |

### This stage overrides HANDOFF §3 "Where play goes"

HANDOFF §3 says a Home row or a search result "plays in the mini player and stays". Both MINI-PLAYER.md §1 ("it never shows a lecture the user has not yet seen open in the now playing screen") and the video say otherwise. **The video and MINI-PLAYER.md win:**

| Where | Behaviour in this stage |
|---|---|
| Home row (body or play button) | Opens Now Playing (unchanged from Stage 10) |
| Search lecture result | Opens Now Playing and replaces Search (unchanged from Stage 8) |
| Event detail row | Opens Now Playing (unchanged) |
| Mini player text area | Opens Now Playing for the loaded lecture, without reloading |
| Continue listening play button | **If its lecture is the one loaded:** toggles play/pause in place (HANDOFF §3; the bar already shows it). **Otherwise** (for example after a restart, when nothing is loaded): opens Now Playing like a row, because the bar must never introduce a lecture |

Record this decision in AGENTS.md (§9).

## Scope

| Part | This stage | Later |
|---|---|---|
| Mini player visibility | Derived from the store: a lecture is loaded, the session is active, Now Playing is fully closed | — |
| Mini player content | Loaded lecture's title and author, live play/pause icon, live progress line, loading spinner | Error look (`mini-player-lecture-didnt-load`): error-states stage |
| Mini player controls | Text area → Now Playing. Play/pause → `toggle()`. Forward 15 → `skip(15)` | — |
| Dismissing the bar | Swipe down (a fling) → stop, save, clear the lock screen. Plus an accessibility action | A designed close control, if one is ever drawn |
| Opening Now Playing | One entry point for every caller, with the order **intent → hide bar → pause old → navigate → load new** | — |
| Now Playing presentation | One boolean in the store, `isNowPlayingOnScreen`: true from the tap until the closing animation has ended | Stage 12 widens it into a set of values |
| End of queue | The bar leaves when the last lecture ends (not on Now Playing) | — |
| Active row looks | Home and Event detail rows read the loaded lecture and `isPlaying` from the store. Event detail's "Now playing · 16:05 / 46:21" meta is live | — |
| Continue listening card | Shows the last lecture with a saved resume point, with its real progress | — |
| Motion | Fade in / fade out (Reanimated layout animations). Reduce motion respected | Morph between bar and Now Playing, swipe-follow drag (animation stage) |
| Notification tap → Now Playing, notification "Stop" | Checked on device. Only wired if SDK 58 expo-audio exposes them (§7) | — |

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point |
| `expo-router` | Native-stack `transitionStart` / `transitionEnd` on the `fullScreenModal`, `router.navigate` vs `push`, the custom `tabBar` |
| `expo-animation` | The fade in/out with `entering` / `exiting`, the fling-down gesture, reduced motion |
| `vercel-react-native-skills` / `react-native-best-practices` | Selector-only subscriptions, so only the progress line re-renders 4× a second |
| `vercel-composition-patterns` | Passing the live progress line into the presentational `MiniPlayer` instead of a `progress` number |
| `frontend-design` | Required for user-facing UI (the loading spinner, the active rows) |
| `playwright-cli` | Web check (Android stand-in) |

## References

- [docs/MINI-PLAYER.md](../docs/MINI-PLAYER.md): the rule (§1), the model (§3), the situations (§5) and the checklist (§6). The section numbers below (§5.x) refer to it.
- [docs/videos/mini-player.mov](../docs/videos/mini-player.mov): the reference behaviour (table above).
- [HANDOFF.md §4.6](../docs/HANDOFF.md) (mini player look and labels), §4.3.4–5 (Event detail active rows), §4.1.4 (Continue listening).
- [AGENTS.md](../AGENTS.md) "State management": Zustand rules, the one-way status flow and "side effects live outside the store". **Binding.**
- [plan/stage-10-audio-player.md](stage-10-audio-player.md): the store, engine and bridge this stage extends.
- expo-router's vendored native stack, checked in `node_modules/expo-router/build/react-navigation/native-stack/views/NativeStackView.native.js`. `transitionStart { closing: true }` is emitted from `onWillDisappear`, and `transitionEnd { closing: true }` from `onDisappear`. Both fire for **every** dismissal, including native ones (Android back, gestures). The web view (`NativeStackView.js`) emits **neither** event.

## 1. Checking the Zustand analysis

The analysis that came with this task proposed a Zustand store for the mini player. Below, each point is checked against this app's architecture (expo-audio, Expo Router, AGENTS.md, Stage 10).

### What holds

| Claim | Verdict |
|---|---|
| Zustand updates are synchronous: after `setState`, `getState()` already sees the new value | **True.** It's what makes "intent first" work: `openNowPlaying` (plain code, not a component) sets `isNowPlayingOnScreen` to `true` before any audio call, and the very next render already hides the bar |
| It works outside components | **True and needed.** `openNowPlaying` and the engine aren't components. They read with `usePlayerStore.getState()` |
| Visibility should be computed, never set | **True.** One selector, `selectIsMiniPlayerVisible`, next to the store (§2.3) |
| Selectors limit re-renders | **True.** Only the progress line subscribes to `positionSec` (AGENTS.md) |
| Keep animation values out of the store | **True.** The store decides *whether* the bar is visible. Reanimated animates it |
| Zustand doesn't order async steps for you | **True.** The order lives in `openNowPlaying` (§3) |
| Don't read the whole store in components | **True**, and it's already an AGENTS.md rule |

One nuance: "two separate `set` calls can leave one render in between" is mostly not a risk in React 19, which batches updates made in the same tick into one render. Still use one `set` per decision, because it reads more clearly.

### What changes for this app

| Proposal | Problem here | What this plan does instead |
|---|---|---|
| `openLecture` as a **store action** that calls `navRef.navigate` and `audio.loadAndPlay` | AGENTS.md: "A store holds state and plain synchronous setters. Side effects (audio, network) live outside the store." | The sequence lives in `src/features/player/open-now-playing.ts` (the Stage 5 helper, now the single entry point). The store only gains plain setters |
| `track` and `miniTrack` fields | `track` is `queue[currentIndex]`, which Stage 10 already derives with `selectCurrentLecture`. Storing it again breaks AGENTS.md rule 1 ("can it be calculated? don't store it") | No `track`. The bar's content doesn't need freezing by hand (next row) |
| `miniTrack` frozen while switching | The freeze only matters if the bar re-renders with the new lecture while it leaves | When the bar hides, its component is removed and Reanimated's `exiting` animates the **last rendered** view. The new lecture is loaded only *after* the hide (an `await` separates them), so the leaving bar can't show it. The same is true for a dismiss: the lecture is cleared in the same update that hides the bar |
| `switching` flag | A second flag that also means "hide the bar now" | Merged into `isNowPlayingOnScreen`: the switch sets it to `true` at the tap, before the bar's exit. It already means "Now Playing is about to open or is open, so the bar has no reason to exist" (§1 of the spec) |
| `busy` flag | If any awaited step throws, `busy` stays `true` and every later tap is ignored forever. It also duplicates `isNowPlayingOnScreen` | "One action at a time" (§5.19) = ignore requests while `isNowPlayingOnScreen` is `true`. It's set at the very start of every open, so a second tap during the sequence is ignored. The `try/catch` in §3 sets it back to `false` if a step throws |
| A four-value presentation (`closed` / `opening` / `open` / `closing`) | In this stage, the three values other than `closed` all mean the same thing: hide the bar and ignore taps. Nothing reads them separately | One boolean, `isNowPlayingOnScreen`: `true` from the tap until the closing animation has ended. Stage 12 widens it into a set of values when it needs `miniLeaving` and retargeting. Don't build that early |
| `miniExitRequested` + a module-level `resolveMiniExit` promise | If the bar unmounts mid-exit, or a code path forgets to call `miniExitDone()`, the promise never resolves and the app is stuck in `busy`. It also adds two-way coupling between the store and a component | A fixed exit duration, `MINI_PLAYER_EXIT_MS`, shared by the fade-out and by `openNowPlaying`, which waits that long. Nothing can get stuck. With reduce motion on, the fade is skipped and the wait (200 ms) is harmless |
| `currentRoute`, `NO_MINI_ROUTES`, a navigation `onStateChange` listener | The bar doesn't float over the whole app here. It's rendered in the **tabs layout** (§5.1), so it only exists on tab screens. Now Playing and Search are root-stack screens that cover it | Not needed. If a non-tab screen is ever added inside the tabs, revisit this |
| `keyboardOpen` | No tab screen has a text input. The only input is on Search, which covers the tabs and the bar | Not needed. If a tab screen ever gets an input, set `tabBarHideOnKeyboard` and recheck §5.17 |
| A bottom-offset value in the store | The tabs layout measures the tab bar and positions the bar itself, in `useState` (one component). Lists get their extra padding from a small hook that reads the store (§5.6) | Not needed in the store |
| `ready` flag to guard `persist` rehydration | Stage 10 persists **only** the listening history (`listening-history.store.ts`). `player.store.ts` isn't persisted, so the queue isn't restored and the bar can't flash a stale lecture on launch | Not needed. Product rule for §5.16: **a launch shows no bar** |
| `subscribeWithSelector` | No non-UI side effect needs it in this stage | Not added |
| `TrackPlayer.addEventListener(…)` and `mapState` with seven statuses | The app uses expo-audio, and its status already reaches the store through `PlayerStatusBridge` (Stage 10). Visibility only needs "a lecture is loaded and the queue hasn't ended". The seven statuses would only feed one icon | Two small selectors (§2.2) and one helper for the icon, `pickMiniPlayerPlayState` (§5.3) |
| "Now Playing closed" from `beforeRemove` | For a native dismissal (Android back, gestures), the native stack emits `transitionEnd` at the end of the animation and only removes the route afterwards (`onDismissed` → `pop`). Using the route's removal risks a different timing for each kind of dismissal | Use `transitionEnd { closing: true }` to set `isNowPlayingOnScreen` back to `false` (§4) |

### The resulting store change, in one line

`player.store.ts` gains **two booleans** (`isNowPlayingOnScreen` and `hasQueueEnded`) and two selectors. `listening-history.store.ts` gains **one persisted field** (`lastPlayedSlug`). Everything else in the proposal is either already derived, unnecessary because of where the bar lives, or moves out of the store.

## 2. Store changes

Two stores from Stage 10, two small additions. Still data and plain synchronous setters only. Neither store imports `expo-audio` or `expo-router`.

### 2.1 `src/features/player/player.store.ts` (live, not persisted)

```ts
type PlayerState = {
  // …everything from Stage 10…

  // True from the moment Now Playing is asked to open until its closing animation has ended.
  // Set to true by openNowPlaying, before any audio call. Set to false by the Now Playing
  // screen when it has fully closed. Never derived from the route, because the route
  // changes at the start of a transition, not the end.
  isNowPlayingOnScreen: boolean;

  // True once the last lecture of the queue has finished. Set by the engine, cleared on load and on play.
  hasQueueEnded: boolean;

  setIsNowPlayingOnScreen(isOnScreen: boolean): void;
  setHasQueueEnded(hasQueueEnded: boolean): void;
};
```

Neither field is persisted. `player.store.ts` isn't persisted at all, so a launch always starts with nothing loaded.

### 2.2 Selectors (next to the store)

```ts
// The loaded lecture's slug, while the session is still going (playing, paused, loading,
// buffering or failed). Null when nothing is loaded or the queue has ended.
export function selectActiveLectureSlug(state: PlayerState): string | null {
  const lecture = selectCurrentLecture(state);
  if (lecture === null) {
    return null;
  }
  if (state.hasQueueEnded) {
    return null;
  }
  return lecture.slug;
}

export function selectIsMiniPlayerVisible(state: PlayerState): boolean {
  const hasActiveLecture = selectActiveLectureSlug(state) !== null;
  return hasActiveLecture && !state.isNowPlayingOnScreen;
}
```

| Condition | Prevents |
|---|---|
| An active lecture (not `isPlaying`) | The bar flickering on pause, buffering, seeking (§5.8, §5.9), and staying after the queue ends or a stop |
| `!isNowPlayingOnScreen` | The bar appearing while Now Playing opens, is open, or closes (§5.1, §5.2), and during a switch (§5.6) |

- Between two lectures of a queue (auto-advance), `currentIndex` moves straight to the next lecture and `hasQueueEnded` stays `false`, so the bar doesn't flicker between tracks (§5.10).
- An audio error leaves the lecture loaded, so the bar stays visible with its normal look until the error-states stage designs the error bar.
- Rows and Continue listening use `selectActiveLectureSlug`. The bar uses `selectIsMiniPlayerVisible`.

### 2.3 `src/features/player/listening-history.store.ts` (persisted)

```ts
type ListeningHistoryState = {
  progressById: Record<string, number>;
  // The lecture whose resume point was saved most recently. Feeds Continue listening.
  lastPlayedSlug: string | null;
  saveProgress(slug: string, positionSec: number): void;   // sets both fields in one update
};
```

- **Why `lastPlayedSlug` exists:** AGENTS.md said Continue listening is "the most recent entry in `progressById`". A plain object can't tell you that: writing `progressById[slug] = 120` to an existing key doesn't move it to the end. A stored slug is the plain fix. Update the AGENTS.md table (§9).
- Still no `partialize`. Everything in this store is saved.

### 2.4 Who writes what

| Field | Written by | Never written by |
|---|---|---|
| `isNowPlayingOnScreen` | `openNowPlaying` (`true`), the Now Playing screen hook (`true` on mount, `false` when fully closed) | The bridge, the engine, the mini player |
| `hasQueueEnded` | Engine: `true` in `playNext` at the end of the queue; `false` in `loadCurrent`. Bridge: `false` when `playing` turns true (so playing again from the lock screen after the end brings the bar back) | Buttons |
| `progressById`, `lastPlayedSlug` | `saveProgress` (bridge checkpoints and `stopAndClear`) | Anything else |
| `isPlaying`, `positionSec`, … | The bridge only (unchanged) | Buttons |

## 3. The single entry point: `src/features/player/open-now-playing.ts`

Every way into Now Playing goes through this file (§3.4 of the spec): Home rows, Continue listening, Event detail rows, Search results and the mini player. It's the Stage 5 helper, now with the full order. Callers that already use `openNowPlaying` keep their call sites, with the request object below.

```ts
type OpenNowPlayingRequest = {
  lecture: LectureSummary;
  queue: LectureSummary[];
  source: QueueSource;
  // Play buttons resume a paused lecture (HANDOFF §4.3.5). Row bodies and the mini player only show it (spec §5.5).
  resumeIfPaused: boolean;
  // Search replaces itself so minimising returns to the tab (Stage 8).
  replaceCurrentScreen?: boolean;
};

export async function openNowPlaying(request: OpenNowPlayingRequest): Promise<void> {
  const stateAtTap = usePlayerStore.getState();

  // One action at a time (spec §5.19). Every open sets the flag first, so this also ignores double taps.
  if (stateAtTap.isNowPlayingOnScreen) {
    return;
  }

  const currentLecture = selectCurrentLecture(stateAtTap);
  const isAlreadyLoaded = currentLecture !== null && currentLecture.slug === request.lecture.slug;
  const wasMiniPlayerVisible = selectIsMiniPlayerVisible(stateAtTap);

  // Intent first. This hides the mini player in this same update, before any audio event can arrive.
  stateAtTap.setIsNowPlayingOnScreen(true);

  try {
    if (isAlreadyLoaded) {
      navigateToNowPlaying(request.replaceCurrentScreen);
      if (request.resumeIfPaused) {
        resume();
      }
      return;
    }

    // A different lecture while the bar shows: the old lecture stops, the bar finishes leaving, then we open.
    if (wasMiniPlayerVisible) {
      pause(); // the bridge saves the checkpoint when `playing` turns false
      await waitForMiniPlayerExit();
    }

    navigateToNowPlaying(request.replaceCurrentScreen);
    playLecture(request.lecture, request.queue, request.source); // audio second, not awaited
  } catch (error) {
    // Don't leave the app unable to open anything. Let the error surface.
    usePlayerStore.getState().setIsNowPlayingOnScreen(false);
    throw error;
  }
}

export function openNowPlayingForLoadedLecture(): void {
  // The mini player's text area. Same guard and same intent-first order, never loads anything (spec §5.4).
}
```

- `navigateToNowPlaying(replace)` uses `router.navigate('/player')` (or `router.replace` from Search). **Not `push`**, so a second request can never stack a second Now Playing.
- `waitForMiniPlayerExit()` is `new Promise((resolve) => setTimeout(resolve, MINI_PLAYER_EXIT_MS))`, as a named function.
- `MINI_PLAYER_EXIT_MS = 200` and `MINI_PLAYER_ENTER_MS = 200` live in `src/features/player/mini-player-motion.ts`. Both the fade and this file import them, so the wait always matches the fade.
- Same lecture from a **different** source (for example the loaded lecture tapped inside an event): don't reload, and keep the existing queue. Opening shows; it doesn't change playback.
- From Search, the bar is under the Search screen, but the selector still reports it as visible. The switch path then waits 200 ms for an exit nobody sees. That's acceptable and keeps the rule simple. Note it in a comment.
- **Not designed, not built:** the spec's "switch lectures inside Now Playing" (§5.7). Auto-advance changes the lecture in place through the engine and never goes through this file.

### 3.1 Engine additions (`audio-engine.ts`)

| Command | What it does |
|---|---|
| `pause()` | `player.pause()`. The bridge saves the checkpoint on the playing → paused change |
| `resume()` | `player.play()` if not playing. Used by `resumeIfPaused` |
| `playNext()` at the end of the queue | As in Stage 10 (pause, seek to 0, keep the lock-screen card), **plus** `setHasQueueEnded(true)` |
| `loadCurrent()` | Also calls `setHasQueueEnded(false)` |
| `stopAndClear()` | Now saves a checkpoint first: `useListeningHistoryStore.getState().saveProgress(slug, player.currentTime)` → `player.pause()` → `player.clearLockScreenControls()` → `setCurrentIndex(null)` |

Buttons still never set `isPlaying`.

## 4. Now Playing presentation: `src/features/player/use-now-playing-presentation.ts`

A hook called once, at the top of `src/app/player.tsx`. It keeps `isNowPlayingOnScreen` true while the screen is up, and sets it back to `false` only when the screen has fully closed.

```ts
export function useNowPlayingPresentation(): void {
  const navigation = useNavigation();

  useEffect(() => {
    const { setIsNowPlayingOnScreen } = usePlayerStore.getState();

    // Arrived without openNowPlaying (a deep link): the screen is up, so the bar must stay hidden.
    setIsNowPlayingOnScreen(true);

    // The closing animation has ended (chevron, Android back, swipe). Only now may the bar appear.
    const removeTransitionEndListener = navigation.addListener('transitionEnd', (event) => {
      if (event.data.closing) {
        setIsNowPlayingOnScreen(false);
      }
    });

    return () => {
      removeTransitionEndListener();
      // The web stack emits no transition events, so unmounting is the only signal there.
      // On native it's a safety net for a screen that goes away without a closing
      // transitionEnd (a Redirect, a reset).
      setIsNowPlayingOnScreen(false);
    };
  }, [navigation]);
}
```

- Type `navigation` as the native stack's navigation prop, so `event.data.closing` is typed. Import the type from expo-router's vendored React Navigation (check the export path in the installed `expo-router` package; `@react-navigation/native-stack` isn't installed separately).
- Why `transitionEnd` and not `beforeRemove`: see §1. `transitionEnd { closing: true }` fires for the chevron, Android back and gestures, at the end of the closing animation.
- **Check on iOS while building:** after the chevron's `router.back()`, does the screen unmount before or after the closing `transitionEnd`? If it unmounts first, the cleanup would show the bar mid-animation. In that case, keep the cleanup reset on web only (`Platform.OS === 'web'`) and write down what you found. Check it with the recorded video in §11.2.
- The Stage 5 `<Redirect href="/" />` guard (nothing loaded, no slug) unmounts the screen at once, and the cleanup sets the flag to `false`.
- The event pill on Now Playing ("Open event") dismisses the modal on its way to Event detail. The same events fire, and the bar appears on Event detail once the modal has closed.

## 5. The mini player

### 5.1 Placement: a floating card in the tabs layout

The design changed (Nov 2026, `docs/html/screens/home.html`, `events.html`, `event-detail.html` and their artboards). The bar is **no longer part of the tab bar footer**. It's a floating card over the content: 12 px from each side, 8 px above the tab bar, with a shadow (`0 14px 30px -14px rgba(41, 45, 37, 0.6)`). The footer is now the tab bar alone (`padding: 8px 12px 24px`).

The bar is rendered **once, in `src/app/(tabs)/_layout.tsx`**, as a floating layer next to `<Tabs>`, not inside the footer:

```
src/app/_layout.tsx (root Stack)
├── (tabs)/_layout.tsx
│   ├── <Tabs>  Home / Events / Event detail
│   │     └── TabsFooter = the tab bar only
│   └── <MiniPlayerSlot />  ← absolute, bottom = tab bar height + 8
├── search    (a root screen drawn on top: covers the bar)
└── player    (a root screen drawn on top: covers the bar)
```

Why the tabs layout and not the root layout (spec §4.1 suggests the root):
- every screen that should show the bar is a tab screen (Home, Events, and Event detail, which is pushed inside the Events tab);
- the two screens that must not show it (Now Playing, Search) are root-stack screens, so they cover it. No route checks, no `NO_MINI_ROUTES`;
- the tab bar is measured right there, so the bar can sit just above it without sharing a height across the app;
- Stage 12 puts its player overlay in the same file, so the bar doesn't move again.

### 5.2 Files

| File | Role |
|---|---|
| `src/components/MiniPlayer/index.tsx` (Stage 3, edited) | Presentational. Props: `title`, `author`, `playState: 'playing' \| 'paused' \| 'loading'`, `onOpen`, `onTogglePlay`, `onSkipForward`, and `progressLine: ReactNode` (instead of a `progress` number), so the bar itself doesn't re-render 4× a second. Adds the floating shadow from `useThemeShadows().miniPlayer` |
| `src/components/MiniPlayer/mini-player-slot.tsx` (new) | Connected to the store. `memo`'d. Takes one prop, `bottomOffset`. Decides visibility, renders the bar inside an absolutely positioned `Animated.View` with the fade, wires the controls and the dismiss gesture |
| `src/components/MiniPlayer/mini-player-progress-line.tsx` (new) | The only part that subscribes to `positionSec` / `durationSec` |
| `src/app/(tabs)/_layout.tsx` (edited) | Wraps `<Tabs>` in a `flex-1` view, keeps the measured tab bar height in `useState`, and renders `<MiniPlayerSlot bottomOffset={tabBarHeight + 8} />` after `<Tabs>` so it draws on top. Routes have no components or logic, so this stays a few lines |
| `src/components/TabBar/tabs-footer.tsx` (edited) | The tab bar only. Takes an `onHeightChange(height)` prop and calls it from `onLayout` (the height includes `insets.bottom`). Remove the mini player, `pickMiniPlayerLecture`, `useSegments`, `useEventQuery` and the `mockPlayback` use from Stage 7. Padding becomes `pt-2 px-bar` + `insets.bottom` |
| `src/features/player/use-mini-player-space.ts` (new) | `useMiniPlayerSpace()`: the bottom padding a tab screen's list needs so its last row scrolls clear of the bar (§5.6) |
| `src/theme/tokens.ts` (edited) | New shadow `miniPlayer: '0px 14px 30px -14px rgba(41, 45, 37, 0.6)'` in `lightShadows`; `undefined` in `darkShadows` (dark keeps the 1 px outline). Follow the `src/theme/README.md` recipe |
| `src/features/player/mini-player-lecture.ts` (deleted) | Replaced by the store's `selectCurrentLecture` |

### 5.3 `MiniPlayerSlot`

```tsx
type MiniPlayerSlotProps = {
  // Distance from the bottom of the tabs layout: the tab bar's measured height plus the 8 px gap.
  bottomOffset: number;
};

export const MiniPlayerSlot = memo(function MiniPlayerSlot({ bottomOffset }: MiniPlayerSlotProps) {
  const isVisible = usePlayerStore(selectIsMiniPlayerVisible);
  const lecture = usePlayerStore(selectCurrentLecture);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  // Until the tab bar has been measured, the bar's position isn't known. Don't flash it at the bottom edge.
  const isTabBarMeasured = bottomOffset > 8;

  if (!isVisible || lecture === null || !isTabBarMeasured) {
    return null; // Reanimated's `exiting` keeps animating the last rendered bar, so its content stays frozen
  }

  return (
    <Animated.View
      className="absolute left-bar right-bar"
      style={{ bottom: bottomOffset }}
      entering={FadeIn.duration(MINI_PLAYER_ENTER_MS)}
      exiting={FadeOut.duration(MINI_PLAYER_EXIT_MS)}
    >
      <GestureDetector gesture={dismissGesture}>
        <MiniPlayer
          title={lecture.title}
          author={lecture.author}
          playState={pickMiniPlayerPlayState({ isLoaded, isBuffering, isPlaying })}
          onOpen={openNowPlayingForLoadedLecture}
          onTogglePlay={toggle}
          onSkipForward={skipForward15}
          progressLine={<MiniPlayerProgressLine />}
        />
      </GestureDetector>
    </Animated.View>
  );
});
```

- `pickMiniPlayerPlayState({ isLoaded, isBuffering, isPlaying })` in `src/features/player/mini-player-play-state.ts`: not loaded or buffering → `'loading'`; playing → `'playing'`; everything else → `'paused'`. A plain `if` chain with early returns.
- **Loading look** (§5.9): a small `ActivityIndicator` in `miniPlayerColors.fg` in place of the play/pause icon, with the label "Loading". It isn't designed, so add `// TODO(design)`.
- **Error** (§5.9): the bar **stays visible** with the normal look. Tapping it opens Now Playing. The designed error bar is built in the error-states stage.
- Play/pause and forward 15 are separate buttons. Pressing them never opens Now Playing (§5.4).
- **Position:** `left-bar right-bar` is the 12 px side inset (the `bar` spacing token). Only the card's own box is touchable: the content beside it stays scrollable and tappable, because the slot renders nothing wider than the card. Check `left-bar` / `right-bar` exist in the Tailwind spacing config; if not, use the `inset-x` equivalent.
- **Fade:** use Reanimated's default reduce-motion behaviour (`ReduceMotion.System`), so the fade is skipped when the user asks for less motion (HANDOFF §8.2 item 9). Check that `entering` / `exiting` work on iOS and on web. If they don't on web, the bar just appears and disappears there; that's acceptable.
- **Text scaling:** the bar's text is already capped at 1.3× (AGENTS.md), so its height stays bounded.

### 5.4 Dismissing (§5.11)

- `Gesture.Fling().direction(Directions.DOWN)` on the bar → `dismissMiniPlayer()`, which calls `stopAndClear()`. Run it on the JS thread (`.runOnJS(true)`, or `scheduleOnRN` from `react-native-worklets`, whichever the installed Gesture Handler 3 API documents).
- `stopAndClear()` clears `currentIndex` in one update. The bar hides in that same render, so the fade-out shows the old lecture, never an empty bar.
- **Screen readers:** `accessibilityActions={[{ name: 'dismiss', label: 'Stop and close player' }]}` on the bar, handled in `onAccessibilityAction`. The gesture isn't reachable with a screen reader, so this action is required.
- Don't build a follow-the-finger drag here. That's animation-stage work.

### 5.5 Accessibility (§5.21)

- The text area: `accessibilityRole="button"`, label `Open player: {title}, {author}`. This replaces the Stage 4 label "Open player"; update Stage 9's tests.
- Play/pause: "Play" / "Pause", or "Loading" while loading. Forward 15: "Skip forward 15 seconds" (HANDOFF §4.6).
- Never move focus to the bar when it appears.

### 5.6 Lists scroll clear of the bar (spec §5.20)

The bar now floats over the content, so the lists no longer get the space for free. The tab navigator already lays the screens out above the tab bar, so a screen only needs room for the bar itself.

```ts
// src/features/player/use-mini-player-space.ts
// Extra bottom padding for a tab screen's list, so its last row scrolls clear of the floating bar.
export function useMiniPlayerSpace(): number {
  const hasActiveLecture = usePlayerStore((state) => selectActiveLectureSlug(state) !== null);
  if (!hasActiveLecture) {
    return 0;
  }
  return MINI_PLAYER_SPACE;
}
```

- `MINI_PLAYER_SPACE` lives in `src/components/MiniPlayer/tokens.ts`: the bar's height at the 1.3× text cap, plus the 8 px gap. At normal text sizes this leaves a little extra space under the last row, which is harmless and simpler than measuring the bar.
- It follows "a lecture is active", **not** `selectIsMiniPlayerVisible`. While Now Playing is on screen the bar is hidden, but the padding stays, so the list doesn't jump when Now Playing closes and the bar comes back.
- Home, Events and Event detail add it to their list's `contentContainerStyle.paddingBottom`, on top of the spacing they already have.

## 6. Rows and Continue listening read the store

Stage 10 left these static and pointed here.

| Where | Change |
|---|---|
| Home `LectureRow` | `state` = `'playing'` / `'paused'` when `slug === activeLectureSlug` (from `selectActiveLectureSlug` and `isPlaying`), otherwise `'idle'`. Read once in the screen and pass it to the rows; don't subscribe in every row |
| Event detail rows | The same rule. The active row's meta is "Now playing · 16:05 / 46:21" or "Paused · …" (HANDOFF §4.3.4). Put the live part in a small `ActiveLectureMeta` component, the only one in the list that reads `positionSec` |
| Event detail play button | Active and playing: pause icon, opens Now Playing without pausing, label "Pause {title}". Active and paused: `resumeIfPaused: true`. Otherwise: open with the event's queue (HANDOFF §4.3.5) |
| Continue listening card | Reads `useListeningHistoryStore` only (two selectors: `lastPlayedSlug`, and that slug's `progressById` entry), so it never re-renders on position ticks. Lecture = `lastPlayedSlug` (look it up with the existing lecture query). Progress = `progressById[slug] / duration`. "N min left" from `minutesLeftLabel`. Play button as in the table at the top of this plan. When nothing has been saved yet, hide the card (`// TODO(design)`: no empty state is designed) |
| `src/data/mock-ui.ts` | Remove `mockPlayback` once nothing imports it |

## 7. Background, resume and the notification

| Spec | What to do |
|---|---|
| §5.12 Lock screen / notification play-pause-seek | Already reflected through the bridge (Stage 10). Nothing new |
| §5.15 Resume after background | In the bridge's existing `AppState` listener, add the `active` branch: call `applyStatus` with the player's current values (`player.playing`, `player.currentTime`, `player.duration`, `player.isLoaded`, `player.isBuffering`), so the bar is correct on the first frame after resuming. If the OS killed the app, JS restarts with an empty queue, and no bar shows |
| §5.16 Launch | No bar (the queue isn't persisted). Nothing to build. Write the rule in AGENTS.md |
| §5.13 Tapping the media notification | Check the SDK 58 expo-audio reference and the installed types (`node_modules/expo-audio/build/*.d.ts`) for a notification-tap event or a deep link. **Don't invent one.** If one exists, route it through `openNowPlayingForLoadedLecture()`. If not, the app opens where it was, with the bar showing. Record this as a known gap |
| §5.12 "Stop" from the notification | The same check. If expo-audio exposes a stop/dismiss event, call `stopAndClear()`. If not, record it |
| §5.14 Android back | On Now Playing it pops the modal; the presentation hook handles it. Nothing else intercepts back |

## 8. Tests (extends Stages 9 and 10)

### 8.1 Stores

`src/features/player/__tests__/player.store.test.ts`:

| Test | Assertion |
|---|---|
| visible: the happy path | Lecture loaded, paused, `isNowPlayingOnScreen` false → visible |
| hidden while Now Playing is on screen | The same state with `isNowPlayingOnScreen` true → hidden |
| visible while loading, buffering, playing, paused | Each (`isLoaded` false, `isBuffering` true, `isPlaying` true, all false) → visible |
| hidden when ended or idle | `hasQueueEnded` true → hidden. `currentIndex` null → hidden |
| `selectActiveLectureSlug` | The slug while loaded; `null` when ended or idle |
| still never touches storage | Setting `isNowPlayingOnScreen` and `hasQueueEnded` → `AsyncStorage.setItem` not called |

`src/features/player/__tests__/mini-player-play-state.test.ts`: one test per branch of `pickMiniPlayerPlayState` (not loaded → loading, buffering → loading, playing → playing, otherwise → paused).

`src/features/player/__tests__/listening-history.store.test.ts`:

| Test | Assertion |
|---|---|
| `saveProgress` sets `lastPlayedSlug` | After saving `b` then `a`, `lastPlayedSlug` is `a` |
| persistence | The stored JSON has `progressById` and `lastPlayedSlug` |

### 8.2 Entry point: `src/features/player/__tests__/open-now-playing.test.ts`

The engine and `expo-router`'s `router` are mocked. Fake timers.

| Test | Assertion |
|---|---|
| nothing loaded | `isNowPlayingOnScreen` is set to `true` **before** `router.navigate`, and `navigate` before `playLecture` (`mock.invocationCallOrder`). No `pause`, no wait |
| intent before audio | At the moment `playLecture` is called, `selectIsMiniPlayerVisible` is false |
| same lecture | No `playLecture`, no `pause`. `navigate` is called. With `resumeIfPaused` → `resume` once; without → never |
| different lecture, bar visible | `isNowPlayingOnScreen` true at once (the bar hides at once). `pause` is called. `navigate` and `playLecture` are **not** called until `MINI_PLAYER_EXIT_MS` has passed, then both are called in that order |
| the bar never shows the new lecture | During the 200 ms, `selectCurrentLecture` is still the old lecture **and** the bar is hidden |
| double tap | Two calls in a row → `navigate` once, `playLecture` once |
| tap while Now Playing is on screen | `isNowPlayingOnScreen` true (opening, open or closing) → nothing happens |
| failure doesn't lock the app | `router.navigate` throws → `isNowPlayingOnScreen` is back to `false`, and the error is rethrown |
| Search | `replaceCurrentScreen` → `router.replace`, not `navigate` |
| `openNowPlayingForLoadedLecture` | Never calls `playLecture` or `play` |

### 8.3 Presentation hook: `src/features/player/__tests__/use-now-playing-presentation.test.tsx`

With a fake `navigation` whose `addListener` records the handler:
- mount → `isNowPlayingOnScreen` true;
- `transitionEnd { closing: false }` (the opening animation ended) → still true;
- `transitionEnd { closing: true }` → false;
- unmount without any event → false, and the listener removed.

### 8.4 Bridge additions

- `playing` turns true while `hasQueueEnded` is true → `hasQueueEnded` becomes false.
- `AppState` → `active` → `applyStatus` with the fake player's current values.

### 8.5 Mini player: `src/components/MiniPlayer/__tests__/`

| Test | Assertion |
|---|---|
| hidden by default | Empty store → nothing rendered |
| shows the loaded lecture | Title, author, label `Open player: {title}, {author}` |
| text tap | Calls `openNowPlayingForLoadedLecture` |
| buttons don't open | "Pause" → `toggle` only. "Skip forward 15 seconds" → `skip(15)` only |
| icon follows status | `isPlaying` true → "Pause"; pressing it doesn't change the label until the store changes |
| loading | `isLoaded` false → "Loading" |
| dismiss action | The `dismiss` accessibility action → `stopAndClear` |
| re-renders | Changing `positionSec` re-renders the progress line, not the title block (React Profiler or a counted wrapper) |
| waits for the tab bar | `bottomOffset` 8 (not measured yet) → nothing rendered; 90 → rendered |

`src/features/player/__tests__/use-mini-player-space.test.ts`:
- nothing loaded → 0;
- a lecture loaded → `MINI_PLAYER_SPACE`;
- a lecture loaded and `isNowPlayingOnScreen` true → still `MINI_PLAYER_SPACE` (no jump when Now Playing closes);
- queue ended → 0.

### 8.6 Route tests (`__tests__/routes/`)

| Flow | Assertion |
|---|---|
| Home row, nothing playing | Pathname `/player`; the mini player is never in the tree at any point during the flow |
| Close Now Playing | After `isNowPlayingOnScreen` becomes false, the bar shows that lecture on Home and on Events |
| Tabs layout renders the bar once | With a lecture loaded, "Open player: …" appears exactly once, and the tab bar no longer contains it |
| Switch | Bar showing A; press row B → the bar leaves; after 200 ms, `/player` with B. The bar never rendered B's title |
| Continue listening, loaded lecture | Toggles; the pathname doesn't change |
| Continue listening after a restart | Opens `/player` |
| End of queue off Now Playing | `hasQueueEnded` → the bar is gone |

Replace Stage 10's "Mini player still static" test, which this stage makes obsolete.

### 8.7 Guard additions (`scripts/check-rules.js` or the Jest guard test)

- `router.push(` never targets `/player` (only `navigate` / `replace`).
- `setIsNowPlayingOnScreen(` is called only from `open-now-playing.ts` and `use-now-playing-presentation.ts`.
- `player.store.ts` and `listening-history.store.ts` still don't import `expo-audio` or `expo-router`.
- `persist(` appears only in `listening-history.store.ts` (and `recent-searches.store.ts`), never in `player.store.ts`.

### 8.8 Prove the tests can fail

Break each, confirm the named test fails, revert:
1. call `playLecture` before `setIsNowPlayingOnScreen(true)` → "intent before audio";
2. remove the wait in the switch path → "the bar never shows the new lecture";
3. derive visibility from `isPlaying` → "visible while … paused";
4. set the flag to `false` on any `transitionEnd`, not only a closing one → the presentation-hook test "`transitionEnd { closing: false }` → still true";
5. use `router.push` → the guard test.

## 9. AGENTS.md updates

- State table: add `isNowPlayingOnScreen` and `hasQueueEnded` (`player.store.ts`; the first is written only by `openNowPlaying` and the Now Playing hook) and `lastPlayedSlug` (`listening-history.store.ts`, persisted). The Continue listening example is already "`lastPlayedSlug`" (updated with the two-store split); check it still reads that way.
- A short "Mini player" section:
  - visibility comes only from `selectIsMiniPlayerVisible`;
  - every way into Now Playing goes through `openNowPlaying`;
  - the bar never introduces a lecture: rows and search results open Now Playing (this overrides HANDOFF §3);
  - a launch shows no bar;
  - the bar floats in the tabs layout (`(tabs)/_layout.tsx`), not in the tab bar footer and not in the root layout, and why;
  - tab screen lists add `useMiniPlayerSpace()` to their bottom padding.
- Record what §7 found about the notification tap and stop.

## 10. Files touched

- New:
  - `src/features/player/use-now-playing-presentation.ts`
  - `src/features/player/mini-player-motion.ts`
  - `src/features/player/mini-player-play-state.ts`
  - `src/components/MiniPlayer/mini-player-slot.tsx`
  - `src/components/MiniPlayer/mini-player-progress-line.tsx`
  - the tests in §8
- Edited:
  - `src/features/player/player.store.ts` (§2.1, §2.2)
  - `src/features/player/listening-history.store.ts` (§2.3)
  - `src/features/player/audio-engine.ts` (§3.1)
  - `src/features/player/open-now-playing.ts` (§3)
  - `src/features/player/player-status-bridge.tsx` (§7, §2.4)
  - `src/app/player.tsx` (calls the hook)
  - `src/components/MiniPlayer/index.tsx`
  - `src/components/TabBar/tabs-footer.tsx` (tab bar only, reports its height)
  - `src/app/(tabs)/_layout.tsx` (renders `MiniPlayerSlot`)
  - `src/theme/tokens.ts` (`miniPlayer` shadow)
  - the Home, Events and Event detail lists (`useMiniPlayerSpace()`)
- Deleted:
  - `src/features/player/mini-player-lecture.ts` and its test
  - `src/app/(tabs)/index.tsx`, `HomeListHeader`, the Event detail screen and rows, the Search result handler (new request shape)
  - `src/data/mock-ui.ts` (remove `mockPlayback`)
  - `AGENTS.md`

## 11. Verification

### 11.1 Static
`npx expo lint`, `npx tsc --noEmit`, `npm run check:theme` (or `check:rules`) and `npm test` pass.

### 11.2 iOS simulator (dev build), driven by AXe, **recorded**

The bugs are a few frames long, so `describe-ui` alone can't catch them. Record each flow with `xcrun simctl io booted recordVideo <file>.mov`, then pull frames with `ffmpeg -i <file>.mov -vf fps=30 frames/%04d.png` and look at every frame around the tap and the close. Compare with `docs/videos/mini-player.mov`.

Run MINI-PLAYER.md §6 as far as the simulator allows:
1. Fresh launch → no bar. Tap a Home row → no frame shows the bar, before or during the slide-up.
2. Close with the chevron → the bar appears only after the modal has gone; audio keeps playing.
3. Events tab, an Event detail, back to Home → the bar stays, floating 8 px above the tab bar and 12 px from each side, and the last list row scrolls clear of it. Content scrolls **under** the bar (the card's shadow shows over it), and rows beside and above the bar stay tappable.
4. Pause from the bar, change tabs → the bar stays and shows "Play".
5. Tap the bar → same lecture, same position, no audible restart. Tap the loaded lecture's row → the same.
6. Bar showing A, tap row B → the bar leaves first, A is silent before B starts, and **no frame shows B's title in the bar**. Close → the bar shows B. Reopen A later → it resumes where it stopped.
7. Fling the bar down → audio stops, the bar fades out showing the old title, and the lock-screen card is gone.
8. On Event detail, play the last lecture and seek near its end, then close Now Playing → when it ends, the bar leaves. Repeat while staying on Now Playing → the screen stays; closing it shows no bar.
9. Double-tap a row and the bar quickly → one Now Playing, one load.
10. Background the app for a minute while playing, then reopen → the bar shows the right play state and progress immediately.
11. Force-quit and relaunch → no bar. Continue listening shows the last lecture and its progress; its play button opens Now Playing.
12. VoiceOver: the bar reads "Open player: {title}, {author}"; the "Stop and close player" action works; focus doesn't jump when the bar appears.
13. Dark mode: the bar has its forest look and outline.

### 11.3 Web (Android stand-in)
With `playwright-cli` and video recording on: flows 1–7 and 9. Check that `isNowPlayingOnScreen` goes back to false when Now Playing closes on web (no transition events there, so it comes from the unmount, §4). Browser back from `/player` behaves like the chevron. No console errors.

### 11.4 Real devices (the user runs these)
- [ ] Android: back button on Now Playing → the bar appears after the modal has closed.
- [ ] Android, three-button navigation: the bar and tab bar clear the navigation bar.
- [ ] Pause and play from the lock screen / notification → the bar follows.
- [ ] Play again from the lock screen after the queue has ended → the bar comes back.
- [ ] Notification tap and notification stop: the result of §7 (wired, or recorded as a known gap).
- [ ] TalkBack: the same as the VoiceOver check.

Report each item as pass, fail or not checked.

## As built (13 Nov 2026)

- **§4 close timing (checked on the iOS simulator):** the chevron (`router.back`) sends no closing `transitionStart`/`transitionEnd`, even to a root-layout listener. The screen unmounts about 20 ms after the tap, while the slide-down runs for about 350 ms. The hook now waits `NOW_PLAYING_CLOSE_ANIMATION_MS` (400) after an unmount without a closing event; native dismissals still use the event. A remount cancels the wait. Recorded video confirms the bar fades in only after Now Playing has gone.
- **§5.4 dismiss:** React Native `PanResponder` (drag down ≥ 40 pt or fast), not Gesture Handler. The v3 `GestureDetector` received no touches on the floating bar on iOS.
- **§5.2 file locations:** the store-reading pieces are in `src/features/player/` (`mini-player-slot.tsx`, `mini-player-progress-line.tsx`, `now-playing-controls.tsx`, `now-playing-seek-bar.tsx`, `active-numbered-lecture-row.tsx`), because AGENTS.md doesn't allow stores in `src/components`.
- **§7 notification tap / stop:** expo-audio 58 exposes no notification-tap or stop event in its types. Known gap: tapping the notification opens the app where it was, with the bar showing.
- **Not checked on the simulator:** end of queue (covered by unit tests), lock screen and notification (need a development build on a device).
