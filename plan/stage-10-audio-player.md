# Stage 10: Audio player (expo-audio engine + Zustand state)

> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 5 (Now Playing screen), Stages 4, 7 and 8 (where playback starts), Stage 9 (test setup).

## Goal

Make audio actually play. Split the work into two parts that never cross:
- **`expo-audio` is the engine.** One app-level player loads, plays, pauses and seeks. It owns the iOS lock screen / Control Center and the Android media notification.
- **Zustand holds the shared playback state:** what's loaded, the queue, where it came from, playing or paused, position and duration, and resume points. Any screen can read it, and it survives navigation. **The store never plays audio**: it holds no player object and never calls `play()`, `pause()` or `seekTo()`.

What the user can do after this stage:
- play and pause;
- seek by dragging or tapping the progress bar;
- skip back 15 seconds and forward 15 seconds;
- do all of this from the Now Playing screen, from the iOS lock screen / Control Center and from the Android notification.

Playback keeps going in the background and while moving between screens.

**The mini player is still not built.** It stays exactly as in Stages 4 and 7 (static, with inert buttons). The store is designed so the mini player can read from it in a later stage, without any change to the store.

## Scope

| Part | This stage | Later |
|---|---|---|
| Engine (`audio-engine.ts`) | One `createAudioPlayer` at module scope, plus the commands `playLecture`, `toggle`, `seek`, `skip` | — |
| Store (`player.store.ts`) | Queue, current index, source, mirrored status, `progressById` (persisted) | The mini player reads it |
| Status bridge | expo-audio status → store; auto-advance; progress checkpoints | — |
| Now Playing | **Fully wired:** play/pause, drag + tap seek, back 15, forward 15, live times, the play-button shape animation | Swipe-down to dismiss (still a later item) |
| Starting playback | Home rows, the Continue listening play button, Event detail rows and search results start playback *and* open Now Playing (Stage 5 behaviour, now with sound) | When the mini player exists, a Home row plays in place instead (HANDOFF §3) |
| Lock screen / notification | iOS lock screen + Control Center, Android media notification: play/pause, seek bar, back / forward | — |
| Background playback | iOS `audio` background mode, Android media-playback foreground service | — |
| Mini player | **Unchanged and static** | Mini player stage |
| Active-row looks, Continue listening progress | Unchanged (static mock from Stages 4 and 7) | Mini player stage connects them to the store as well |
| Buffering spinner, audio errors | The store records `isBuffering` and `error`, but no UI for them yet | HANDOFF §8.2 item 2; error-states stage (`audio-didnt-load`) |

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point. Install rules, native config through the config plugin (CNG) |
| `expo-dev-client` | Background audio and lock-screen controls need a **development build**, not Expo Go |
| `expo-router` | Root-layout placement of the bridge, `fullScreenModal` interaction |
| `expo-animation` | Play-button radius 26 ↔ 38 over 0.25 s, seek-bar drag (Gesture Handler + Reanimated), reduced motion |
| `expo-ui` | Check whether `@expo/ui` `Slider` can match the designed seek bar before building a custom one (AGENTS.md defaults to `@expo/ui` for sliders) |
| `react-native-best-practices` / `vercel-react-native-skills` | Position updates 4× a second: selector-only subscriptions, so only the time labels and progress bar re-render |
| `playwright-cli` | Web check (playback in the browser; there's no lock screen on web) |

## References

- **[docs/expo-audio.md](../docs/expo-audio.md):** the implementation guide for this stage. Follow it step by step. Its "Common mistakes" list is the review checklist.
- expo-audio SDK 58 reference: https://docs.expo.dev/versions/v58.0.0/sdk/audio.md. If it disagrees with the guide, the reference wins.
- Project [AGENTS.md](../AGENTS.md) "State management" → "Audio: expo-audio plays, Zustand remembers" and "Zustand rules": file names, one-way status flow, selectors, persistence. **These rules are binding.**
- [HANDOFF.md §3](../docs/HANDOFF.md) (global player, queue rules, auto-advance), §4.4 (Now Playing controls and labels), §5 (behaviour checklist).
- [DESIGN-SYSTEM.md §13](../docs/DESIGN-SYSTEM.md) (15-second icons), §11 (play-button shadow).

## 1. Install and native configuration

1. Install:
   - `npx expo install expo-audio zustand @react-native-async-storage/async-storage`;
   - `npx expo install expo-dev-client`, if Stage 1–9 work ran in Expo Go.
2. **Config plugin** in `app.json` → `plugins`:
   ```json
   ["expo-audio", {
     "enableBackgroundPlayback": true,
     "microphonePermission": false,
     "recordAudioAndroid": false
   }]
   ```
   - iOS: adds the `audio` `UIBackgroundModes` entry (lock screen, Control Center, background playback).
   - Android: adds `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` and the audio controls service (notification, background playback).
   - `microphonePermission: false` and `recordAudioAndroid: false`: the app doesn't record, so it shouldn't ask for the microphone. An unused microphone string can be flagged in App Store review, and Google Play also checks for unneeded permissions.
3. **Android notification permission** (Android 13+, `POST_NOTIFICATIONS`): requested at runtime with `requestNotificationPermissionsAsync()`. Ask on the **first play**, not at app launch, so the request appears when the user can see why it's needed. If permission is denied, playback still works; only the notification controls are missing. Never call it on iOS (it throws there).
4. **Native build:** CNG is in use, so never edit `ios/` or `android/` by hand (AGENTS.md). Add `/ios` and `/android` to `.gitignore`. Rebuild with `npx expo prebuild --clean`, then `npx expo run:ios`. A JavaScript reload or Expo Go won't pick up the plugin changes.
5. After prebuilding, check the generated files to confirm the plugin applied (read them only, don't edit):
   - `ios/<app>/Info.plist` has `UIBackgroundModes` → `audio` and no `NSMicrophoneUsageDescription`;
   - `android/app/src/main/AndroidManifest.xml` has the two foreground-service permissions, `POST_NOTIFICATIONS`, and no `RECORD_AUDIO`.

## 2. The store: `src/features/player/player.store.ts`

Holds data only. Plain synchronous setters. One exported hook, `usePlayerStore`.

```ts
type QueueSource =
  | { kind: 'latest' }                                   // "Latest lectures"
  | { kind: 'event'; eventSlug: string; eventTitle: string }
  | { kind: 'search'; query: string };

type PlayerState = {
  queue: LectureSummary[];          // a snapshot the user chose (AGENTS.md: the one allowed copy of query data)
  currentIndex: number | null;      // null = nothing loaded
  source: QueueSource | null;
  // Mirrored from expo-audio by the bridge. Never set from a button press.
  isPlaying: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  positionSec: number;
  durationSec: number;
  error: string | null;
  // Resume points, persisted.
  progressById: Record<string, number>;
  // Setters
  setQueue(queue: LectureSummary[], startIndex: number, source: QueueSource): void;
  setCurrentIndex(index: number | null): void;
  applyStatus(status: MirroredStatus): void;
  saveProgress(slug: string, positionSec: number): void;
};
```

- **Persistence:** `persist` with `createJSONStorage(() => AsyncStorage)` and `partialize: (state) => ({ progressById: state.progressById })`. Only resume points survive a restart. The queue and live status don't (AGENTS.md). Name the storage key `player`.
- **Derived values are not stored** (AGENTS.md rule 1). Export plain selector functions next to the store:
  - `selectCurrentLecture(state)` → `queue[currentIndex]` or `null`;
  - `selectSourceLabel(state)` → "Latest lectures" / the event title / “query”.
- **Reading it:** always through a selector, for example `usePlayerStore((state) => state.positionSec)`. Use `useShallow` when a selector returns an object. Only the progress bar and the time labels subscribe to `positionSec`.
- Resume points are saved by slug. The generated `--N` slugs from the mock library count as separate lectures. That's acceptable for mock data; leave a comment.

## 3. The engine: `src/features/player/audio-engine.ts`

The only file that touches expo-audio's player. Module scope:

```ts
export const player = createAudioPlayer(null, { updateInterval: 250 });
```

`updateInterval: 250` makes the progress bar move smoothly (guide §5). There is exactly one player for the whole app, and it's never released (guide §3).

Exported commands, each a plain function with one job:

| Command | What it does |
|---|---|
| `playLecture(lecture, queue, source)` | 1. On Android, on the first call only, request notification permission (§1.3). 2. `store.setQueue(queue, indexOf(lecture), source)`. 3. `loadCurrent({ autoplay: true })` |
| `loadCurrent({ autoplay })` (internal) | Reads the current lecture from the store. Then: `player.replace({ uri: lecture.url, name: lecture.title })` → resume from `progressById[slug]`, if any (see note) → `player.setActiveForLockScreen(true, metadata, lockScreenOptions)` → `player.play()` if `autoplay` |
| `toggle()` | `player.playing ? player.pause() : player.play()`. Then saves a progress checkpoint when pausing |
| `seek(sec)` | Clamps to `0…player.duration`, then `await player.seekTo(sec)`, then saves a checkpoint |
| `skip(deltaSec)` | `seek(player.currentTime + deltaSec)`, used with −15 / +15. Works while playing or paused |
| `playNext()` | Used by the bridge when a lecture ends. Moves to `currentIndex + 1` and `loadCurrent({ autoplay: true })`. At the end of the queue it stops: pause, seek to 0, keep the lock-screen card |
| `stopAndClear()` | `player.pause()`, `player.clearLockScreenControls()`, `setCurrentIndex(null)`. Not called from the UI yet (there's no "stop" in the design). It's there for the mini-player stage and for tests |

The engine reads position from the **player** (`player.currentTime`, `player.duration`), never from the store. The store is only a mirror for the UI.

**Lock screen metadata** (built in one named function, `buildLockScreenMetadata(lecture, source)`):
- `title`: the lecture title;
- `artist`: the author;
- `albumTitle`: the source label ("Latest lectures", the event title, or the query);
- `artworkUrl`: `LOCK_SCREEN_ARTWORK_URL` (§3.1).

`lockScreenOptions = { showSeekBackward: true, showSeekForward: true, showNextTrack: false, showPreviousTrack: false }`. The designed controls are play/pause, seek, back 15 and forward 15; there's no next/previous (HANDOFF §3).

On a track change, `loadCurrent` calls `setActiveForLockScreen` again with the new metadata, so the notification never shows the previous title (guide §4).

**Resume note:** the docs don't say whether `seekTo` right after `replace` works before the new source has loaded. Try it first. If the position is lost, store a `pendingResumeSec` in the engine module (not in the store), and seek to it in the bridge on the first status where `isLoaded` becomes true. Write down which approach worked.

### 3.1 Lock-screen artwork
Use the hosted cover (an `https` URL, as the guide recommends):

```ts
// src/features/player/lock-screen-artwork.ts
// Hosted, near-square cover art for the OS media controls. They need a URL, not a bundled asset.
export const LOCK_SCREEN_ARTWORK_URL =
  'https://images.ctfassets.net/n7lbwg9xm90s/1JTysjhaqbSMX4sLfhEq8K/cc12d8c952c3527b43e35fe98638690e/image.png';
```

- `buildLockScreenMetadata` passes it as `artworkUrl` for every lecture, until the API returns per-lecture covers.
- The URL was checked on 11 Nov 2026: HTTP 200, `image/png`, about 345 KB, 893 × 913. It's the same mosque scene as the in-app cover, cropped close to square, so the OS square crop loses almost nothing.
- In-app screens keep using the bundled `assets/images/cover-art.jpg` (Stage 3 `CoverArt`), so Now Playing works offline. Only the lock screen and notification use the URL.
- If the device is offline when a lecture starts, the lock-screen card shows no artwork. Playback and controls still work, so this isn't handled further.

### 3.2 Lock-screen ±15 step: verify, don't assume
The SDK 58 reference documents `showSeekForward` / `showSeekBackward`, but **not the step size**, and no setting for it. The design needs 15 seconds.
1. After installing, read the native source in `node_modules/expo-audio/` to find the interval:
   - iOS: `MPRemoteCommandCenter` `skipForwardCommand` / `skipBackwardCommand` `preferredIntervals`;
   - Android: the Media3 seek-back / seek-forward increment.
2. If it's 15 seconds, or can be set to 15 through the API: done.
3. If it's fixed at another value: tell the user. The options are to accept the system step on the lock screen only (the in-app buttons stay at 15), or to evaluate `react-native-track-player`, as HANDOFF §3 allows. Don't patch `node_modules`.

### 3.3 Audio mode: `src/features/player/setup-audio.ts`
`setupAudio()` is called **once**, from the root layout, when the app starts:
```ts
await setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: 'doNotMix', // required for lock-screen controls (guide §2, the #1 bug)
});
```
No notification-permission request here (§1.3). Don't call `setAudioModeAsync` anywhere else. Log errors with the context; don't swallow them.

## 4. The bridge: `src/features/player/player-status-bridge.tsx`

A component that renders `null`, mounted **once** in `src/app/_layout.tsx`, inside `AppProviders`. It replaces the "PlayerProvider slot" from Stage 1. It is not a Context.

- `const status = useAudioPlayerStatus(player);`
- Effect on `status`: `applyStatus({ isPlaying: status.playing, isBuffering: status.isBuffering, isLoaded: status.isLoaded, positionSec: status.currentTime, durationSec: status.duration, error: status.error })`.
  - Guard `duration` (it's 0 until loaded): the progress fraction is 0 when the duration is 0.
- **Auto-advance:** when `status.didJustFinish` is true, save the finished lecture's progress as 0 (it's finished, so it shouldn't resume at the end), then `playNext()`.
- **Checkpoints** (AGENTS.md):
  - every ~10 s while playing, using a ref holding the last save time (not a timer);
  - when `playing` turns from true to false (a pause from anywhere: the app, the lock screen, a phone call, unplugged headphones);
  - when the track changes;
  - when the app goes to the background (`AppState` → `background`).
  - Never save on every status update.
- `status.mediaServicesDidReset` (iOS): do nothing special. The player recovers itself (guide §6). Don't play twice.

Pauses that come from outside the app (lock screen, notification, call, headphones) reach the UI only through this bridge. That's why buttons must never set `isPlaying` themselves.

## 5. Now Playing: wire the controls (`src/app/player.tsx`)

The screen now reads the **store**, not the route:
- `currentLecture = usePlayerStore(selectCurrentLecture)`, `sourceLabel = usePlayerStore(selectSourceLabel)`.
- **Route param fallback** (a deep link `/player?slug=X` with nothing loaded): fetch the lecture (Stage 5 query), then call `playLecture(lecture, [lecture], { kind: 'latest' })`, but **with autoplay off**. Add an `autoplay` option to `playLecture`, so a link loads paused and never starts sound by surprise.
- Nothing loaded and no slug: `<Redirect href="/" />` (as in Stage 5).

| Control | Wiring |
|---|---|
| Play / pause | `toggle()`. Icon and label from `isPlaying` ("Play" / "Pause"). The radius animates between 26 (playing) and 38 (paused) over 0.25 s with Reanimated `withTiming`. If the user has turned on reduce motion (`useReducedMotion()`), the radius changes instantly (HANDOFF §8.2 item 9) |
| Back 15 / Forward 15 | `skip(-15)` / `skip(15)`. Always enabled while a lecture is loaded |
| Seek bar | See §5.1 |
| Times | Elapsed `clockLabel(positionSec)`, and remaining `"-" + clockLabel(durationSec - positionSec)`, both tabular. Before the lecture has loaded, show the data's `duration` string as the remaining time |
| Minimise | `router.back()` (unchanged). **Playback continues** |

Only the time labels and the seek bar subscribe to `positionSec`. Split them into small components (`NowPlayingTimes`, `NowPlayingSeekBar`), so the artwork and track info don't re-render 4 times a second.

### 5.1 Seek bar
1. First, check `@expo/ui` `Slider` (load the `expo-ui` skill). Use it if it can be styled to the design: a 5px `track`, a `primary` fill, a 16px thumb with a 2.5px `bg` ring, and the token colours in both themes.
2. Otherwise, add gestures to the Stage 3 `SeekBar` with `react-native-gesture-handler` (already installed). Say in a one-line comment why it's custom:
   - a `Tap` and a `Pan` gesture on a touch area at least 44 high;
   - the fraction is `x / trackWidth`, measured with `onLayout`, and clamped to 0–1;
   - **while dragging,** the bar shows the finger's position from local state (`useState` or a Reanimated shared value), not the store, so live status updates don't make the thumb jump back;
   - **on release,** `seek(fraction * durationSec)`, then local scrubbing state is cleared;
   - accessibility: `accessibilityRole="adjustable"`, `accessibilityValue` with min, max, now and text ("16:05 of 46:21"), and `onAccessibilityAction` for increment / decrement (±15 s, through `skip`).

## 6. Starting playback from the other screens

`openNowPlaying` (Stage 5) becomes "start playback, then open Now Playing". The call sites pass the queue and the source:

| Where | Queue | Source |
|---|---|---|
| Home row / row play button | The Home lectures loaded so far (flattened pages), in data order | `latest` |
| Continue listening play | Same as the Home row | `latest` |
| Event detail row / play | That event's lectures, in data order | `event` |
| Search lecture result | Just that lecture | `search` (the query) |

- If the tapped lecture is already the current one, don't reload it. Open Now Playing, and resume if it's paused. Event detail's "active and playing" rule (HANDOFF §4.3.5) waits until rows read the store (mini-player stage).
- Queue order is data order. Never re-sort (HANDOFF §3).
- **Everything else stays static:** the mini player, the Continue listening progress, the active-row looks. A comment in each place points to the mini-player stage.

## 7. Mock data check

Every mock lecture needs a playable `url`. Repeated and generated lectures reuse the two real URLs from `sample.ts`. Check that no lecture has an empty or missing `url`. A lecture without one would load nothing; error states are a later stage.

## 8. Tests (extends Stage 9)

Automated tests cover everything that doesn't need real audio hardware: the store, the engine's decisions, the bridge, and the Now Playing wiring. Real sound, the lock screen and the notification can't run under Jest. They're covered by §10 (simulator, web, real devices).

### 8.1 Test setup

**A fake expo-audio** (`src/test-utils/fake-audio-player.ts`, registered in `jest.setup.ts` with `jest.mock('expo-audio', …)`):

```ts
// A stand-in for the one expo-audio player. It records calls and lets a test set its state.
export function createFakeAudioPlayer() {
  const fakePlayer = {
    playing: false,
    currentTime: 0,
    duration: 0,
    replace: jest.fn(),
    play: jest.fn(() => { fakePlayer.playing = true; }),
    pause: jest.fn(() => { fakePlayer.playing = false; }),
    seekTo: jest.fn(async (seconds: number) => { fakePlayer.currentTime = seconds; }),
    setActiveForLockScreen: jest.fn(),
    updateLockScreenMetadata: jest.fn(),
    clearLockScreenControls: jest.fn(),
  };
  return fakePlayer;
}
```

- The module mock returns this fake from `createAudioPlayer`. `setAudioModeAsync` and `requestNotificationPermissionsAsync` are `jest.fn()`s that resolve.
- `useAudioPlayerStatus` returns a status the test controls, through a small `setFakeStatus(partialStatus)` helper that triggers a re-render. Bridge tests use it to "play" without audio.
- Use the fake's field names exactly as in the installed `expo-audio` types (`node_modules/expo-audio/build/*.d.ts`). Check them when writing the mock. If a name differs from the docs, the types win.

**AsyncStorage:** in `jest.setup.ts`, `jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'))`. Check the current mock path in that package's docs.

**Fresh state for every test** (in `beforeEach`):
- reset the store to its initial state (`usePlayerStore.setState(initialPlayerState, true)`), and export `initialPlayerState` from the store file so tests use the same object;
- clear the fake player's calls and fields;
- `await AsyncStorage.clear()`.
- Because the engine keeps its "permission already asked" flag in module scope, load the engine module fresh where that matters, with `jest.isolateModules`.

**Platform:** test Android-only branches by setting `Platform.OS` in an isolated module (`jest.isolateModules` + `jest.doMock('react-native/Libraries/Utilities/Platform', …)`). Run the same test once as `'ios'` and once as `'android'`.

**Time:** use `jest.useFakeTimers()` and `jest.setSystemTime(…)` in the bridge's checkpoint tests, so "every ~10 s" can be tested without waiting.

**Fixtures:** reuse `src/test-utils/fixtures.ts` from Stage 9. Add `queueOfThree` (three lectures, each with a `url`) and `eventSource` / `searchSource` objects.

### 8.2 Store tests: `src/features/player/__tests__/player.store.test.ts`

| Test | Assertion |
|---|---|
| starts empty | `currentIndex` is `null`, the queue is empty, `isPlaying` is false |
| `setQueue` | stores the queue in the given order (no sorting), the start index and the source |
| `applyStatus` | copies each mirrored field. A duration of 0 stays 0 (no division anywhere in the store) |
| `saveProgress` | writes `progressById[slug]` and leaves the other slugs as they are |
| persists only resume points | after `setQueue` + `applyStatus` + `saveProgress`, the JSON written to AsyncStorage under `player` contains `progressById` and **no** `queue`, `positionSec` or `isPlaying` |
| rehydrates resume points | write a stored `{ progressById: { a: 120 } }`, rehydrate (`usePlayerStore.persist.rehydrate()`), and `progressById.a` is 120 |
| `selectCurrentLecture` | returns `null` when nothing is loaded, and `queue[currentIndex]` otherwise |
| `selectSourceLabel` | "Latest lectures" / the event title / “query” (curly quotes) for the three sources |

### 8.3 Engine tests: `src/features/player/__tests__/audio-engine.test.ts`

| Test | Assertion |
|---|---|
| one player | `createAudioPlayer` is called exactly once, with `updateInterval: 250`, however many lectures are played |
| `playLecture` loads, registers the lock screen, and plays | `replace` gets `{ uri: lecture.url, name: lecture.title }`. `setActiveForLockScreen` gets `(true, { title, artist: author, albumTitle: sourceLabel, artworkUrl: LOCK_SCREEN_ARTWORK_URL }, { showSeekBackward: true, showSeekForward: true, showNextTrack: false, showPreviousTrack: false })`. Then `play` is called. Check the **call order** (`mock.invocationCallOrder`) |
| `playLecture` with `autoplay: false` | loads and registers the lock screen, but never calls `play` |
| sets the store queue | after `playLecture(b, [a, b, c], eventSource)`, the store has the queue `[a, b, c]`, `currentIndex` 1 and the event source |
| resumes from a saved point | with `progressById[slug] = 300`, playing that lecture seeks to 300 (or sets the pending resume value, whichever approach §3 settled on) |
| same lecture isn't reloaded | calling `playLecture` for the lecture that's already loaded doesn't call `replace` again |
| `toggle` | playing → `pause` + a checkpoint saved at `currentTime`; paused → `play`, with no checkpoint |
| `skip(15)` | `currentTime` 100 → `seekTo(115)` |
| `skip(15)` near the end | `currentTime` 2770, `duration` 2781 → `seekTo(2781)` (clamped) |
| `skip(-15)` near the start | `currentTime` 5 → `seekTo(0)` (clamped) |
| `seek` outside the range | −10 → 0; duration + 50 → duration |
| `seek` waits for `seekTo` | the checkpoint is saved with the new position, after the promise resolves |
| `playNext` | in the middle of the queue: index + 1, `replace` with the next URL, and `setActiveForLockScreen` called again with the **new** title |
| `playNext` at the end | no `replace`; `pause` is called, the position is 0, and the lock-screen controls are **not** cleared |
| `stopAndClear` | `pause`, `clearLockScreenControls`, and `currentIndex` is `null` |
| Android permission | with `Platform.OS = 'android'`: the first `playLecture` calls `requestNotificationPermissionsAsync` once, and the second doesn't call it again. A **denied** result still plays |
| iOS permission | with `Platform.OS = 'ios'`: never called |
| audio mode | `setupAudio()` calls `setAudioModeAsync` once with `{ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }`. If it rejects, the error is logged, not thrown away silently |

### 8.4 Bridge tests: `src/features/player/__tests__/player-status-bridge.test.tsx`

Render `<PlayerStatusBridge />` with `render-with-providers`, then drive it with `setFakeStatus`.

| Test | Assertion |
|---|---|
| mirrors status | `setFakeStatus({ playing: true, currentTime: 12, duration: 2781, isBuffering: false, isLoaded: true })` → the store has `isPlaying` true, `positionSec` 12, `durationSec` 2781 |
| a pause from outside the app | `playing` true → false with no button press (as from the lock screen or a phone call) → the store's `isPlaying` is false, and a checkpoint is saved at the current time |
| auto-advance | `didJustFinish: true` → `playNext` runs **once**. The finished lecture's resume point is reset to 0. Sending the same finished status again doesn't advance twice |
| last lecture finishes | at the end of the queue, `didJustFinish` → no new `replace` |
| checkpoints are throttled | 40 status updates over 9 s of fake time → **no** save. Crossing 10 s → **one** save |
| background checkpoint | `AppState` changes to `background` → a save |
| track change checkpoint | changing `currentIndex` saves the previous lecture's position |
| media services reset | a status with `mediaServicesDidReset: true` doesn't call `play` |

### 8.5 Now Playing tests: `src/components/NowPlaying/__tests__/` and `__tests__/routes/player.test.tsx`

The engine module is mocked here (`jest.mock('@/features/player/audio-engine')`). These tests check the wiring, not playback.

| Test | Assertion |
|---|---|
| reads the store | with the store holding a lecture, the screen shows its title, author and source label |
| play/pause follows status, not the press | `isPlaying` true shows "Pause". Pressing it calls `toggle` once, and **the label still reads "Pause"** until a test sets `isPlaying` false in the store. This proves the button never sets state itself |
| skip buttons | "Back 15 seconds" → `skip(-15)`; "Forward 15 seconds" → `skip(15)` |
| times | `positionSec` 965, `durationSec` 2781 → "16:05" and "-30:16". Before load, remaining shows the data's duration string |
| seek bar tap | a tap at 75% of the measured width (fire `onLayout` with width 300, then a press at x = 225) → `seek(0.75 * duration)` |
| seek bar drag | while dragging, the shown position follows the finger even if the store's `positionSec` changes. On release, `seek` is called **once** with the release position |
| seek bar accessibility | role "adjustable", `accessibilityValue` with min, max, now and text. Accessibility increment → `skip(15)`, decrement → `skip(-15)` |
| play-button animation | with reduce motion turned on (mock `useReducedMotion` → true), toggling sets the radius at once (no `withTiming`) |
| fewer re-renders | changing `positionSec` re-renders the times and seek bar, but **not** `TrackInfo` (count renders with a `jest.fn` wrapper or the React Profiler) |
| deep link guard | the route test with `/player?slug=<known>` and an empty store → `playLecture` is called with `autoplay: false`; `/player` with nothing loaded → redirects to `/` |

### 8.6 Call-site tests (`__tests__/routes/`, extending Stage 9's route tests)

| Flow | Assertion |
|---|---|
| Home row | `playLecture` gets the loaded Home lectures, in data order, with the `latest` source, then the path is `/player` |
| Event detail row | queue = the event's lectures in data order, with the `event` source and the event title |
| Search result | queue = `[thatLecture]`, with the `search` source and the query. Search isn't left in the history |
| Mini player still static | pressing the mini player's controls calls **no** engine command (it's still inert in this stage) |

### 8.7 Guard tests (rules from AGENTS.md)

Add these to `scripts/check-theme.js` (renamed `scripts/check-rules.js` if it now covers more than the theme), or as a Jest test that reads the source files:
- `src/features/player/player.store.ts` doesn't import `expo-audio`.
- `setAudioModeAsync(` appears in exactly one file (`setup-audio.ts`).
- `createAudioPlayer(` appears in exactly one file (`audio-engine.ts`).
- No file imports `expo-av`.
- `useAudioPlayer(` isn't used anywhere in `src/` (only the shared module-level player is allowed).
- No `usePlayerStore()` call without a selector.

### 8.8 Running and proving the tests

- `npm test` runs all of these. `npx jest src/features/player` runs only the player tests while working on them.
- **Prove the tests can fail.** Make each break, confirm the named test fails with a clear message, then revert:
  1. remove `interruptionMode: 'doNotMix'` → the audio mode test fails;
  2. call `play()` before `setActiveForLockScreen` → the call-order test fails;
  3. take out the clamp in `skip` → the near-end / near-start tests fail;
  4. set `isPlaying` from the play button's `onPress` → the "follows status, not the press" test fails;
  5. save progress on every status update → the throttle test fails;
  6. persist the whole store → the "persists only resume points" test fails;
  7. import `expo-audio` in the store → the guard test fails.
- Run `npx jest --coverage src/features/player` and record the numbers in the stage summary. Expect complete coverage of the store and engine branches. The bridge's `AppState` branch must be covered.

## 9. Files touched

- New: `src/features/player/player.store.ts`, `audio-engine.ts`, `setup-audio.ts`, `player-status-bridge.tsx`, `lock-screen-artwork.ts`, `src/components/NowPlaying/now-playing-times.tsx`, `now-playing-seek-bar.tsx` (or the `@expo/ui` slider wrapper)
- Edited:
  - `app.json` (expo-audio plugin)
  - `.gitignore` (`/ios`, `/android`)
  - `package.json`
  - `src/app/_layout.tsx` (`setupAudio`, `<PlayerStatusBridge />`)
  - `src/app/player.tsx`
  - `src/components/SeekBar` (gestures, if custom)
  - `src/components/NowPlaying/PlayerControls` (animation)
  - `src/features/player/open-now-playing.ts`
  - the Home, Event detail and Search call sites
  - `jest.setup.ts` (expo-audio and AsyncStorage mocks), `src/test-utils/fake-audio-player.ts`, `src/test-utils/fixtures.ts`, the test files in §8
  - `AGENTS.md`: record the lock-screen ±15 finding

## 10. Verification

The agent runs what it can: the iOS simulator with **AXe**, and the web build with `playwright-cli`. The guide is clear that **lock screen, notification and background behaviour must be confirmed on real devices**. The agent prepares the dev builds and a checklist, and asks the user to run the device-only checks.

### 10.1 Static
`npx expo lint`, `npx tsc --noEmit`, `npm run check:theme` and `npm test` pass. Grep: there are no `expo-av` imports, `useAudioPlayer(` is never used for the main player, `setAudioModeAsync` appears exactly once, and `player.store.ts` never imports `expo-audio`.

### 10.2 Native config
After `npx expo prebuild --clean`, check the `Info.plist` and `AndroidManifest.xml` entries listed in §1.5.

### 10.3 iOS simulator (dev build via `npx expo run:ios`), driven by AXe
1. Home: `axe tap --label "Play Sacrifices of the Şahābā …"`. Now Playing opens, the audio starts (you can hear it on the Mac), and `describe-ui` shows the elapsed time increasing between two reads about 2 s apart.
2. `axe tap --label "Pause"`: the label becomes "Play", and the time stops. Then `axe tap --label "Play"`: it resumes.
3. `axe tap --label "Forward 15 seconds"`: elapsed jumps by about 15. "Back 15 seconds" goes back by about 15. Near the start, back 15 stops at 0:00.
4. Seek bar:
   - `axe tap` at about 75% of the bar: elapsed jumps to about 75% of the duration;
   - `axe drag` from 25% to 50%: the thumb follows the drag, then playback continues from about 50%.
5. Minimise ("Minimise player"), switch to the Events tab and back: the **audio keeps playing** (navigation doesn't stop playback).
6. **Resume point:** pause at a known time, force-quit the app (`xcrun simctl terminate booted <bundle id>`), and relaunch. Open the same lecture: it starts from the saved time.
7. **Auto-advance:** on Event detail, play the second-to-last lecture. Seek to the last 5 s and wait: the next lecture loads and plays, and the title and lock-screen metadata change. At the end of the queue, playback stops.
8. Simulator lock screen and Control Center: if the simulator shows Now Playing (Device → Lock), check the title, author and artwork, and that play/pause works from there. If the simulator doesn't show it, note that, and rely on §10.5.
9. Dark mode: the play button's radius animates on toggle, and the controls stay legible.

### 10.4 Web (Android stand-in for the UI)
`npx expo start --web` with `playwright-cli`: start a lecture, then check play/pause, ±15, click-to-seek and drag-to-seek. The times update, and the browser console shows no errors. (Lock screen and notification don't exist on web; this checks only the UI and the engine.)

### 10.5 Real devices (the user runs these; the agent provides the builds and this checklist)
Build a development client for a physical iPhone (`npx expo run:ios --device`) and an Android phone (`npx expo run:android --device`, or `eas build --profile development`). This uses the `expo-dev-client` skill. There's no Android emulator on this machine. Then run the guide's checklist (§7 of `docs/expo-audio.md`):
- [ ] iOS: Now Playing shows on the lock screen and in Control Center, with the title, author and artwork; play/pause, the scrub bar and the skip buttons work there; the skip step is noted (15 s or the system default, §3.2).
- [ ] iOS: plays with the silent switch on.
- [ ] Android: the media notification appears; play/pause, seek and the skip buttons work from it.
- [ ] Android: still playing in the background after 5+ minutes.
- [ ] Android 13+: tested with notification permission granted **and** denied (playback still works when denied).
- [ ] A track change updates the lock-screen / notification title and artwork.
- [ ] An incoming call pauses playback, and the Now Playing button shows "Play" afterwards.
- [ ] Unplugging headphones pauses, and the UI shows it.
- [ ] Moving between screens doesn't stop playback.
- [ ] Pauses from the lock screen / notification are reflected in the app when it's reopened (via the bridge).

Report each item as pass, fail or not checked. Don't mark the stage done while a device check is still unchecked without saying so.
