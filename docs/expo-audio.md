---
name: expo-audio
description: How to implement audio playback with expo-audio (Expo SDK 55+), including background playback, iOS lock screen / Control Center controls and the Android media notification. Use this whenever the task touches audio playback, a music or podcast player, background audio, lock screen or notification-drawer media controls, playlists, migrating from expo-av, or any import from 'expo-audio' — even if the user doesn't name the library.
---

# expo-audio implementation guide

Written against Expo SDK 58 (`expo-audio` ~58.0.x). Before writing code, confirm the
project's SDK version (`package.json` → `expo`).

## Reference docs (fetch when more detail is needed)

- Latest API reference: https://docs.expo.dev/versions/latest/sdk/audio.md
- Version-matched reference (use if the project isn't on the latest SDK):
  `https://docs.expo.dev/versions/v<SDK>/sdk/audio.md`, e.g. `.../versions/v57.0.0/sdk/audio.md`
- Index of all Expo docs as Markdown, to find related pages (config plugins,
  development builds, expo-av migration, etc.): https://docs.expo.dev/llms.txt
  Any Expo docs URL also works as Markdown by appending `.md`.

Fetch the docs when: a method, option or type isn't covered here; something here doesn't
match the installed package's types; or you hit an error this file doesn't explain.
If the docs and this file disagree, the docs win.

`expo-av` is deprecated/removed. Never add `expo-av` or use `Audio.Sound`. Use
`useAudioPlayer` / `createAudioPlayer` from `expo-audio`.

## Workflow

1. Install: `npx expo install expo-audio` (never plain `npm install` — it can pick a
   version that doesn't match the SDK).
2. Configure the config plugin (below).
3. Set the audio mode once at app start.
4. Create ONE app-level player (or playlist).
5. Activate lock screen controls when playback starts; update metadata on track change.
6. Drive UI from `useAudioPlayerStatus`.
7. Rebuild the native app and verify on real devices using the checklist at the end.

## 1. Config plugin (app.json / app.config.*)

```json
{
  "expo": {
    "plugins": [
      ["expo-audio", { "enableBackgroundPlayback": true }]
    ]
  }
}
```

- Adds the iOS `audio` UIBackgroundMode, and on Android the `FOREGROUND_SERVICE` +
  `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions and the `AudioControlsService`.
- Only add `microphonePermission` / `enableBackgroundRecording` if the app records.
  Set `"microphonePermission": false` for playback-only apps to avoid an unused
  permission string in App Store review.
- These are native changes. Tell the user to rebuild (`npx expo prebuild --clean` then
  run, or a new EAS/dev-client build). A JS reload or Expo Go will NOT pick them up.
- If the project has committed `ios/` and `android/` folders (no CNG), the plugin won't
  run. Edit `AndroidManifest.xml` and `Info.plist` by hand per the docs instead.

## 2. Audio mode — call once, at startup

```ts
import { Platform } from 'react-native';
import { setAudioModeAsync, requestNotificationPermissionsAsync } from 'expo-audio';

export async function setupAudio() {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true, // default false
    interruptionMode: 'doNotMix', // REQUIRED for lock screen controls
  });
  if (Platform.OS === 'android') {
    await requestNotificationPermissionsAsync(); // Android 13+ drawer controls; throws on iOS
  }
}
```

Rules:
- `interruptionMode` must be `'doNotMix'` or `'doNotMixPersistent'` whenever
  `setActiveForLockScreen` is used. The default `'mixWithOthers'` silently breaks lock
  screen association. This is the #1 bug.
- `setAudioModeAsync` is global. Call it from the root layout, not from individual
  screens. If another feature (e.g. recording) changes the mode, restore it afterwards.
- Do not use the deprecated `interruptionModeAndroid`.

## 3. Player lifecycle

- `useAudioPlayer(source)` releases the player when the component unmounts. Use it only
  for sounds scoped to one screen (button clicks, previews).
- For a persistent player (music, podcasts, audiobooks), create ONE instance with
  `createAudioPlayer()` at module scope or in a root-level context provider. You own its
  cleanup: call `release()` only when the app truly no longer needs it.
- Change tracks with `player.replace(source)`. Do not create a new player per track —
  only one player/playlist can own the lock screen at a time.
- For queues with gapless playback and next/previous, prefer `useAudioPlaylist` /
  `createAudioPlaylist` (`next()`, `previous()`, `skipTo()`, `loop: 'none'|'single'|'all'`).

## 4. Lock screen + notification controls

```ts
player.replace({ uri: track.url, name: track.title });
player.setActiveForLockScreen(
  true,
  { title: track.title, artist: track.artist, albumTitle: track.album, artworkUrl: track.artworkUrl },
  { showSeekForward: true, showSeekBackward: true /*, isLiveStream: true for radio */ }
);
player.play();
```

- Android: `setActiveForLockScreen(true, ...)` is mandatory, not cosmetic. Without it,
  background playback is killed after ~3 minutes.
- On track change, call `updateLockScreenMetadata(...)` (or re-call
  `setActiveForLockScreen`) so the notification doesn't show the previous track.
- When the user stops listening for good, call `clearLockScreenControls()` so no stale
  notification / Now Playing card remains.
- `isLiveStream: true` hides duration and scrub bar and disables seeking — use for radio.
- `showNextTrack` / `showPreviousTrack`: the docs don't document a JS event for these
  presses on a plain `AudioPlayer`. If remote next/previous must work, use
  `AudioPlaylist` and verify on device. Do not invent event names; check the installed
  package's type definitions (`node_modules/expo-audio/build/*.d.ts`) if unsure.
- Use remote `https` artwork URLs; verify any local-asset artwork on device.

## 5. Status and UI

```ts
const status = useAudioPlayerStatus(player); // or useAudioPlaylistStatus(playlist)
```

- Read `playing`, `currentTime`, `duration`, `isBuffering`, `isLoaded`, `didJustFinish`,
  `error` from the status object. Don't keep a separate `isPlaying` in React state — it
  drifts when the OS pauses audio (headphones unplugged, phone call, lock screen tap).
- `duration` is 0 until loaded; guard progress-bar math against divide-by-zero.
- `seekTo()` returns a Promise; await it before reading the new position.
- `updateInterval` (ms, default 500) controls status frequency. Use ~250 for smooth
  progress bars; don't go very low on long lists of players.
- Playback rate: Android 0.1–2.0, iOS 0.0–2.0.
- For instant start on known tracks, call `preload(source)` at module scope.

## 6. Behaviors to handle, not fight

- Audio stops automatically when headphones/Bluetooth disconnect. Reflect it in the UI
  via status.
- iOS media services reset: `status.mediaServicesDidReset` — the player tries to
  recover; don't crash or double-play.
- Remote URLs that need auth: pass `{ uri, headers: { Authorization: ... } }`.
- `downloadFirst: true` downloads to a temp dir before playing — useful for flaky
  networks, but delays start on large files.

## 7. Verification checklist (real devices, not simulators)

- [ ] Rebuilt the native app after plugin changes; not testing in Expo Go.
- [ ] Android: notification appears in the drawer; play/pause from it works.
- [ ] Android: backgrounded playback still going after 5+ minutes.
- [ ] Android 13+: tested with notification permission granted AND denied.
- [ ] iOS: Now Playing shows on lock screen and Control Center with correct metadata.
- [ ] iOS: plays with the silent switch on.
- [ ] Track change updates lock screen title/artwork.
- [ ] Incoming call pauses audio; UI reflects it.
- [ ] Unplugging headphones pauses; UI reflects it.
- [ ] Navigating between screens doesn't stop playback.
- [ ] Stopping clears the notification / Now Playing card.

## Common mistakes to reject in review

- `useAudioPlayer` in a screen component for the main player.
- Missing `interruptionMode: 'doNotMix'`.
- `shouldPlayInBackground` not set.
- Lock screen controls not enabled on Android.
- New player created per track.
- `setAudioModeAsync` called in multiple places with conflicting values.
- Importing anything from `expo-av`.