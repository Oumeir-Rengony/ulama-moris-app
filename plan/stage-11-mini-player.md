# Stage 11: Mini player (behaviour, not motion)

> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 10 (engine, store, status bridge, Now Playing wiring), Stages 4 and 7 (the tabs footer and its static mini player), Stage 8 (Search → Now Playing), Stage 9 (test setup).
> **Partly replaced by [Stage 12](stage-12-screen-animations.md).** The behaviour rules here still hold. Stage 12 changes these parts, so if both stages are built together, build them the Stage 12 way:
> - Now Playing becomes an overlay in `(tabs)/_layout.tsx`, not a `fullScreenModal` route. `openNowPlaying` drives the overlay instead of calling `router.navigate` (§3 here → Stage 12 §2.4).
> - §4 `use-now-playing-presentation.ts` is deleted. The overlay's animation callbacks set the presentation.
> - §5 The bar moves from the tabs footer into the overlay. The footer keeps an empty space the bar's size. `mini-player-slot.tsx` and `mini-player-motion.ts` are deleted.
> - `nowPlayingPresentation` gains `miniLeaving`. The §8.2 and §8.3 tests are rewritten in Stage 12 §10.

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
| Now Playing presentation | `closed` / `opening` / `open` / `closing`, recorded in the store | — |
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
| Zustand updates are synchronous: after `setState`, `getState()` already sees the new value | **True.** It's what makes "intent first" work: `openNowPlaying` (plain code, not a component) records `opening` before any audio call, and the very next render already hides the bar |
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
| `switching` flag | A second flag that also means "hide the bar now" | Merged into the presentation: the switch sets `opening` at the tap, before the bar's exit. `opening` already means "Now Playing is about to open, the bar has no reason to exist" (§1 of the spec) |
| `busy` flag | If any awaited step throws, `busy` stays `true` and every later tap is ignored forever. It also duplicates the presentation | "One action at a time" (§5.19) = ignore requests unless the presentation is `closed`. `opening` is set at the very start of every open, so a second tap during the sequence is ignored |
| `miniExitRequested` + a module-level `resolveMiniExit` promise | If the bar unmounts mid-exit, or a code path forgets to call `miniExitDone()`, the promise never resolves and the app is stuck in `busy`. It also adds two-way coupling between the store and a component | A fixed exit duration, `MINI_PLAYER_EXIT_MS`, shared by the fade-out and by `openNowPlaying`, which waits that long. Nothing can get stuck. With reduce motion on, the fade is skipped and the wait (200 ms) is harmless |
| `currentRoute`, `NO_MINI_ROUTES`, a navigation `onStateChange` listener | The bar doesn't float over the whole app here. It lives in the **tabs footer** (Stages 4 and 7, HANDOFF §2), so it only exists on tab screens. Now Playing and Search are root-stack screens that cover it | Not needed. If a non-tab screen is ever added inside the tabs, revisit this |
| `keyboardOpen` | No tab screen has a text input. The only input is on Search, which covers the footer | Not needed. If a tab screen ever gets an input, set `tabBarHideOnKeyboard` and recheck §5.17 |
| A bottom-offset value in the store | The footer stacks the bar above the tab bar and owns `insets.bottom` once (Stage 4 §5). Screens are laid out above the footer, so lists already stop above the bar (§5.20) | Not needed |
| `ready` flag to guard `persist` rehydration | Stage 10 persists **only** `progressById`. The queue isn't restored, so the bar can't flash a stale lecture on launch | Not needed. Product rule for §5.16: **a launch shows no bar** |
| `subscribeWithSelector` | No non-UI side effect needs it in this stage | Not added |
| `TrackPlayer.addEventListener(…)` and `mapState` | The app uses expo-audio, and its status already reaches the store through `PlayerStatusBridge` (Stage 10) | The seven statuses are **derived** by a selector from the mirrored fields (§2.2). One place, as the spec asks |
| Presentation `closing` from `beforeRemove` | For a native dismissal (Android back, gestures), the native stack emits `transitionStart`/`transitionEnd` *during* the animation and only removes the route afterwards (`onDismissed` → `pop`). `beforeRemove` would then fire **after** `closed`, leaving the store stuck on `closing` | Use `transitionStart { closing: true }` for `closing` (§4) |

### The resulting store change, in one line

The store gains **one UI field** (`nowPlayingPresentation`), **one session field** (`hasQueueEnded`) and **one persisted field** (`lastPlayedSlug`), plus two selectors. Everything else in the proposal is either already derived, unnecessary because of where the bar lives, or moves out of the store.

## 2. Store changes: `src/features/player/player.store.ts`

Still data and plain synchronous setters only. Still no `expo-audio` import.

### 2.1 New fields and setters

```ts
type NowPlayingPresentation = 'closed' | 'opening' | 'open' | 'closing';

type PlayerState = {
  // …everything from Stage 10…

  // Where the Now Playing screen is in its life. Set to 'opening' by openNowPlaying,
  // moved forward by the screen's transition events. Never derived from the route,
  // because the route changes at the start of a transition, not the end.
  nowPlayingPresentation: NowPlayingPresentation;

  // True once the last lecture of the queue has finished. Set by the engine, cleared on load and on play.
  hasQueueEnded: boolean;

  // The lecture whose resume point was saved most recently. Persisted. Feeds Continue listening.
  lastPlayedSlug: string | null;

  setNowPlayingPresentation(presentation: NowPlayingPresentation): void;
  setHasQueueEnded(hasQueueEnded: boolean): void;
};
```

- `saveProgress(slug, positionSec)` also sets `lastPlayedSlug = slug`. Same setter, same update.
- `partialize` becomes `({ progressById, lastPlayedSlug })`. `nowPlayingPresentation` and `hasQueueEnded` are **not** persisted.
- **Why `lastPlayedSlug` exists:** AGENTS.md says Continue listening is "the most recent entry in `progressById`". A plain object can't tell you that: writing `progressById[slug] = 120` to an existing key doesn't move it to the end. A stored slug is the plain fix. Update the AGENTS.md table (§9).

### 2.2 Derived session status (replaces the spec's `mapState`)

```ts
export type SessionStatus = 'idle' | 'loading' | 'buffering' | 'playing' | 'paused' | 'ended' | 'error';

export function selectSessionStatus(state: PlayerState): SessionStatus {
  if (state.currentIndex === null) return 'idle';
  if (state.hasQueueEnded) return 'ended';
  if (state.error !== null) return 'error';
  if (!state.isLoaded) return 'loading';
  if (state.isBuffering) return 'buffering';
  if (state.isPlaying) return 'playing';
  return 'paused';
}
```

- Written as early returns, in priority order. No lookup table.
- `stopped` from the spec is `idle` here: stopping clears `currentIndex` (§6).
- Between two lectures of a queue (auto-advance), the status passes through `loading`, which is active. So the bar doesn't flicker between tracks (§5.10). `hasQueueEnded` is only set when the **queue** ends.

### 2.3 Visibility

```ts
export function isSessionActive(status: SessionStatus): boolean {
  return status === 'loading' || status === 'buffering' || status === 'playing' || status === 'paused' || status === 'error';
}

export function selectIsMiniPlayerVisible(state: PlayerState): boolean {
  const hasLecture = selectCurrentLecture(state) !== null;
  const isActive = isSessionActive(selectSessionStatus(state));
  const isNowPlayingClosed = state.nowPlayingPresentation === 'closed';
  return hasLecture && isActive && isNowPlayingClosed;
}
```

| Condition | Prevents |
|---|---|
| `isActive` (not `isPlaying`) | The bar flickering on pause, buffering, seeking (§5.8, §5.9) and staying after the queue ends or a stop |
| `nowPlayingPresentation === 'closed'` | The bar appearing while Now Playing opens, is open, or closes (§5.1, §5.2), and during a switch (§5.6) |

Also export `selectActiveLectureSlug(state)`: the current lecture's slug when the session is active, otherwise `null`. Rows and Continue listening use it.

### 2.4 Who writes what

| Field | Written by | Never written by |
|---|---|---|
| `nowPlayingPresentation` | `openNowPlaying` (`opening`), the Now Playing presentation hook (`open`, `closing`, `closed`) | The bridge, the engine, the mini player |
| `hasQueueEnded` | Engine: `true` in `playNext` at the end of the queue; `false` in `loadCurrent`. Bridge: `false` when `playing` turns true (so playing again from the lock screen after the end brings the bar back) | Buttons |
| `lastPlayedSlug` | `saveProgress` (checkpoints) | Anything else |
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

  // One action at a time (spec §5.19). Every open sets 'opening' first, so this also ignores double taps.
  if (stateAtTap.nowPlayingPresentation !== 'closed') {
    return;
  }

  const currentLecture = selectCurrentLecture(stateAtTap);
  const isAlreadyLoaded = currentLecture !== null && currentLecture.slug === request.lecture.slug;
  const wasMiniPlayerVisible = selectIsMiniPlayerVisible(stateAtTap);

  // Intent first. This hides the mini player in this same update, before any audio event can arrive.
  stateAtTap.setNowPlayingPresentation('opening');

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
    usePlayerStore.getState().setNowPlayingPresentation('closed');
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
| `stopAndClear()` | Now saves a checkpoint first: `saveProgress(slug, player.currentTime)` → `player.pause()` → `player.clearLockScreenControls()` → `setCurrentIndex(null)` |

Buttons still never set `isPlaying`.

## 4. Now Playing presentation: `src/features/player/use-now-playing-presentation.ts`

A hook called once, at the top of `src/app/player.tsx`. It feeds the store from the screen's own native-stack events.

```ts
export function useNowPlayingPresentation(): void {
  const navigation = useNavigation();

  useEffect(() => {
    const { setNowPlayingPresentation, nowPlayingPresentation } = usePlayerStore.getState();

    // Arrived without openNowPlaying (a deep link): the screen is up, so the bar must stay hidden.
    if (nowPlayingPresentation === 'closed') {
      setNowPlayingPresentation('opening');
    }

    // The web stack emits no transition events, so the screen being mounted is the only signal there.
    if (Platform.OS === 'web') {
      setNowPlayingPresentation('open');
      return () => setNowPlayingPresentation('closed');
    }

    const removeStartListener = navigation.addListener('transitionStart', (event) => {
      if (event.data.closing) {
        setNowPlayingPresentation('closing');
      }
    });
    const removeEndListener = navigation.addListener('transitionEnd', (event) => {
      setNowPlayingPresentation(event.data.closing ? 'closed' : 'open');
    });

    return () => {
      removeStartListener();
      removeEndListener();
      // Safety net: if the screen goes away without a closing transitionEnd (a Redirect, a reset), close.
      setNowPlayingPresentation('closed');
    };
  }, [navigation]);
}
```

- Type `navigation` as the native stack's navigation prop, so `event.data.closing` is typed. Import the type from expo-router's vendored React Navigation (check the export path in the installed `expo-router` package; `@react-navigation/native-stack` isn't installed separately).
- Why `transitionStart` and not `beforeRemove`: see §1. The `transitionStart { closing: true }` event fires for the chevron, Android back and gestures, at the start of the closing animation.
- The Stage 5 `<Redirect href="/" />` guard (nothing loaded, no slug) unmounts the screen at once, and the cleanup sets `closed`.
- The event pill on Now Playing ("Open event") dismisses the modal on its way to Event detail. The same events fire, and the bar appears on Event detail once the modal has closed.

## 5. The mini player

### 5.1 Placement (deliberately differs from spec §4.1)

The spec says to render the bar once at the root, not in the tab bar, because "inside the tab bar it disappears on stack screens that hide the tab bar, and re-renders with every tab change". That doesn't apply here:
- every screen that should show the bar is a tab screen (Home, Events, Event detail, which is pushed inside the Events tab);
- the two screens that must not show it (Now Playing, Search) are root-stack screens that cover the footer;
- a `memo`'d slot with no props doesn't re-render on tab changes.

Keeping it in `TabsFooter` (Stage 4) also gives correct placement above the tab bar and correct list padding for free (§5.3, §5.20). **Keep it there.**

### 5.2 Files

| File | Role |
|---|---|
| `src/components/MiniPlayer/index.tsx` (Stage 3, edited) | Presentational. Props: `title`, `author`, `playState: 'playing' \| 'paused' \| 'loading'`, `onOpen`, `onTogglePlay`, `onSkipForward`, and `progressLine: ReactNode` (instead of a `progress` number), so the bar itself doesn't re-render 4× a second |
| `src/components/MiniPlayer/mini-player-slot.tsx` (new) | Connected to the store. `memo`'d. Decides visibility, renders the bar inside an `Animated.View` with the fade, wires the controls and the dismiss gesture |
| `src/components/MiniPlayer/mini-player-progress-line.tsx` (new) | The only part that subscribes to `positionSec` / `durationSec` |
| `src/components/TabBar/tabs-footer.tsx` (edited) | Renders `<MiniPlayerSlot />` above `<TabBar />`. Remove `pickMiniPlayerLecture`, `useSegments` and the `mockPlayback` use from Stage 7 |

### 5.3 `MiniPlayerSlot`

```tsx
export const MiniPlayerSlot = memo(function MiniPlayerSlot() {
  const isVisible = usePlayerStore(selectIsMiniPlayerVisible);
  const lecture = usePlayerStore(selectCurrentLecture);
  const sessionStatus = usePlayerStore(selectSessionStatus);

  if (!isVisible || lecture === null) {
    return null; // Reanimated's `exiting` keeps animating the last rendered bar, so its content stays frozen
  }

  return (
    <Animated.View
      entering={FadeIn.duration(MINI_PLAYER_ENTER_MS)}
      exiting={FadeOut.duration(MINI_PLAYER_EXIT_MS)}
    >
      <GestureDetector gesture={dismissGesture}>
        <MiniPlayer
          title={lecture.title}
          author={lecture.author}
          playState={pickMiniPlayerPlayState(sessionStatus)}
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

- `pickMiniPlayerPlayState(status)`: `loading` / `buffering` → `'loading'`; `playing` → `'playing'`; everything else → `'paused'`. A plain `if` chain.
- **Loading look** (§5.9): a small `ActivityIndicator` in `miniPlayerColors.fg` in place of the play/pause icon, with the label "Loading". It isn't designed, so add `// TODO(design)`.
- **Error** (§5.9): the bar **stays visible** with the normal look. Tapping it opens Now Playing. The designed error bar is built in the error-states stage.
- Play/pause and forward 15 are separate buttons. Pressing them never opens Now Playing (§5.4).
- **Fade:** use Reanimated's default reduce-motion behaviour (`ReduceMotion.System`), so the fade is skipped when the user asks for less motion (HANDOFF §8.2 item 9). Check that `entering` / `exiting` work inside the custom `tabBar` on iOS and on web. If they don't on web, the bar just appears and disappears there; that's acceptable.

### 5.4 Dismissing (§5.11)

- `Gesture.Fling().direction(Directions.DOWN)` on the bar → `dismissMiniPlayer()`, which calls `stopAndClear()`. Run it on the JS thread (`.runOnJS(true)`, or `scheduleOnRN` from `react-native-worklets`, whichever the installed Gesture Handler 3 API documents).
- `stopAndClear()` clears `currentIndex` in one update. The bar hides in that same render, so the fade-out shows the old lecture, never an empty bar.
- **Screen readers:** `accessibilityActions={[{ name: 'dismiss', label: 'Stop and close player' }]}` on the bar, handled in `onAccessibilityAction`. The gesture isn't reachable with a screen reader, so this action is required.
- Don't build a follow-the-finger drag here. That's animation-stage work.

### 5.5 Accessibility (§5.21)

- The text area: `accessibilityRole="button"`, label `Open player: {title}, {author}`. This replaces the Stage 4 label "Open player"; update Stage 9's tests.
- Play/pause: "Play" / "Pause", or "Loading" while loading. Forward 15: "Skip forward 15 seconds" (HANDOFF §4.6).
- Never move focus to the bar when it appears.

## 6. Rows and Continue listening read the store

Stage 10 left these static and pointed here.

| Where | Change |
|---|---|
| Home `LectureRow` | `state` = `'playing'` / `'paused'` when `slug === activeLectureSlug` (from `selectActiveLectureSlug` and `isPlaying`), otherwise `'idle'`. Read once in the screen and pass it to the rows; don't subscribe in every row |
| Event detail rows | The same rule. The active row's meta is "Now playing · 16:05 / 46:21" or "Paused · …" (HANDOFF §4.3.4). Put the live part in a small `ActiveLectureMeta` component, the only one in the list that reads `positionSec` |
| Event detail play button | Active and playing: pause icon, opens Now Playing without pausing, label "Pause {title}". Active and paused: `resumeIfPaused: true`. Otherwise: open with the event's queue (HANDOFF §4.3.5) |
| Continue listening card | Lecture = `lastPlayedSlug` (look it up with the existing lecture query). Progress = `progressById[slug] / duration`. "N min left" from `minutesLeftLabel`. Play button as in the table at the top of this plan. When nothing has been saved yet, hide the card (`// TODO(design)`: no empty state is designed) |
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

### 8.1 Store: `src/features/player/__tests__/player.store.test.ts`

| Test | Assertion |
|---|---|
| status: idle | `currentIndex` null → `'idle'` |
| status order | ended beats error, error beats loading, loading beats buffering, buffering beats playing. One test per step |
| visible: the happy path | Lecture loaded, paused, presentation `closed` → visible |
| hidden while Now Playing isn't closed | The same state with `opening`, `open`, `closing` → hidden, for each value |
| visible while loading, buffering, paused, error | Each → visible (`closed`) |
| hidden when ended or idle | `hasQueueEnded` true → hidden. `currentIndex` null → hidden |
| `saveProgress` sets `lastPlayedSlug` | After saving `b` then `a`, `lastPlayedSlug` is `a` |
| persistence | The stored JSON has `progressById` and `lastPlayedSlug`, and **no** `nowPlayingPresentation` or `hasQueueEnded` |

### 8.2 Entry point: `src/features/player/__tests__/open-now-playing.test.ts`

The engine and `expo-router`'s `router` are mocked. Fake timers.

| Test | Assertion |
|---|---|
| nothing loaded | `opening` is set **before** `router.navigate`, and `navigate` before `playLecture` (`mock.invocationCallOrder`). No `pause`, no wait |
| intent before audio | At the moment `playLecture` is called, `selectIsMiniPlayerVisible` is false |
| same lecture | No `playLecture`, no `pause`. `navigate` is called. With `resumeIfPaused` → `resume` once; without → never |
| different lecture, bar visible | `opening` set at once (the bar hides at once). `pause` is called. `navigate` and `playLecture` are **not** called until `MINI_PLAYER_EXIT_MS` has passed, then both are called in that order |
| the bar never shows the new lecture | During the 200 ms, `selectCurrentLecture` is still the old lecture **and** the bar is hidden |
| double tap | Two calls in a row → `navigate` once, `playLecture` once |
| tap during closing | Presentation `closing` → nothing happens |
| failure doesn't lock the app | `router.navigate` throws → presentation is back to `closed`, and the error is rethrown |
| Search | `replaceCurrentScreen` → `router.replace`, not `navigate` |
| `openNowPlayingForLoadedLecture` | Never calls `playLecture` or `play` |

### 8.3 Presentation hook: `src/features/player/__tests__/use-now-playing-presentation.test.tsx`

With a fake `navigation` whose `addListener` records the handlers:
- mount with `closed` → `opening`; `transitionEnd { closing: false }` → `open`; `transitionStart { closing: true }` → `closing`; `transitionEnd { closing: true }` → `closed`;
- unmount without any event → `closed`, and both listeners removed;
- `Platform.OS = 'web'` → `open` on mount, `closed` on unmount.

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

### 8.6 Route tests (`__tests__/routes/`)

| Flow | Assertion |
|---|---|
| Home row, nothing playing | Pathname `/player`; the mini player is never in the tree at any point during the flow |
| Close Now Playing | After the presentation becomes `closed`, the bar shows that lecture on Home and on Events |
| Switch | Bar showing A; press row B → the bar leaves; after 200 ms, `/player` with B. The bar never rendered B's title |
| Continue listening, loaded lecture | Toggles; the pathname doesn't change |
| Continue listening after a restart | Opens `/player` |
| End of queue off Now Playing | `hasQueueEnded` → the bar is gone |

Replace Stage 10's "Mini player still static" test, which this stage makes obsolete.

### 8.7 Guard additions (`scripts/check-rules.js` or the Jest guard test)

- `router.push(` never targets `/player` (only `navigate` / `replace`).
- `setNowPlayingPresentation(` is called only from `open-now-playing.ts` and `use-now-playing-presentation.ts`.
- `player.store.ts` still doesn't import `expo-audio` or `expo-router`.

### 8.8 Prove the tests can fail

Break each, confirm the named test fails, revert:
1. call `playLecture` before `setNowPlayingPresentation('opening')` → "intent before audio";
2. remove the wait in the switch path → "the bar never shows the new lecture";
3. derive visibility from `isPlaying` → "visible while … paused";
4. use `beforeRemove` instead of `transitionStart` (and drop the unmount cleanup) → the presentation-hook tests;
5. use `router.push` → the guard test.

## 9. AGENTS.md updates

- State table: add `nowPlayingPresentation` (Zustand, written only by `openNowPlaying` and the Now Playing hook) and `lastPlayedSlug` (persisted). Change the Continue listening example from "the most recent entry in `progressById`" to "`lastPlayedSlug`".
- A short "Mini player" section:
  - visibility comes only from `selectIsMiniPlayerVisible`;
  - every way into Now Playing goes through `openNowPlaying`;
  - the bar never introduces a lecture: rows and search results open Now Playing (this overrides HANDOFF §3);
  - a launch shows no bar;
  - the bar lives in the tabs footer, and why.
- Record what §7 found about the notification tap and stop.

## 10. Files touched

- New:
  - `src/features/player/use-now-playing-presentation.ts`
  - `src/features/player/mini-player-motion.ts`
  - `src/components/MiniPlayer/mini-player-slot.tsx`
  - `src/components/MiniPlayer/mini-player-progress-line.tsx`
  - the tests in §8
- Edited:
  - `src/features/player/player.store.ts` (§2)
  - `src/features/player/audio-engine.ts` (§3.1)
  - `src/features/player/open-now-playing.ts` (§3)
  - `src/features/player/player-status-bridge.tsx` (§7, §2.4)
  - `src/app/player.tsx` (calls the hook)
  - `src/components/MiniPlayer/index.tsx`
  - `src/components/TabBar/tabs-footer.tsx`
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
3. Events tab, an Event detail, back to Home → the bar stays, above the tab bar, and the last list row scrolls clear of it.
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
With `playwright-cli` and video recording on: flows 1–7 and 9. Check that the presentation reaches `open` and `closed` on web (no transition events there, §4). Browser back from `/player` behaves like the chevron. No console errors.

### 11.4 Real devices (the user runs these)
- [ ] Android: back button on Now Playing → the bar appears after the modal has closed.
- [ ] Android, three-button navigation: the bar and tab bar clear the navigation bar.
- [ ] Pause and play from the lock screen / notification → the bar follows.
- [ ] Play again from the lock screen after the queue has ended → the bar comes back.
- [ ] Notification tap and notification stop: the result of §7 (wired, or recorded as a known gap).
- [ ] TalkBack: the same as the VoiceOver check.

Report each item as pass, fail or not checked.
