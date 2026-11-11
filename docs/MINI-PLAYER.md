# Mini player: behaviour and implementation

React Native, Android first. This document is about when the mini player appears, what it shows and how it reacts. It is not about animation. Where an animation is mentioned, only its start and end matter here.

## 1. The rule

The mini player shows the lecture that is currently loaded, **only when the user is somewhere other than the now playing screen**, and only while that lecture is still in progress: playing, paused, loading or buffering. It never runs ahead of the user’s navigation, and it never shows a lecture the user has not yet seen open in the now playing screen.

Three consequences follow from that rule:

- **No mini player before or during the opening of now playing.** Tapping a card opens now playing; the mini player has no reason to exist yet.
- **The mini player appears after leaving now playing.** It is the “you’re still listening” reminder, and it persists across every other page.
- **Switching lectures dismisses the mini player first.** The new lecture is introduced by the now playing screen, never by the mini player.

## 2. Why the bugs happen

The three problems you observed share one root cause: **the mini player’s visibility is being derived from the audio state alone, and the audio state changes before the navigation state does.**

| What you see | Why it happens | Fix |
|---|---|---|
| The mini player appears first, or during the transition to now playing | The tap handler starts the audio (or the audio layer emits “track changed” / “playing”) before the app records that now playing is opening. For a few frames, the visibility check reads “audio active, not on now playing” and shows the bar. This gets worse when the “am I on now playing” flag is set in a `useEffect`, on screen focus or on transition end, all of which happen after the audio event. | Record the user’s intent (“now playing is opening”) synchronously in the tap handler, **before** touching audio. Visibility must read that intent, not wait for the screen to be focused (4.3). |
| The mini player shows the new lecture before now playing appears | The handler loads the new lecture first and navigates second. The mini player is still visible (the user is on the list) and simply re-renders with the new track. | Treat “tap a different card” as a sequence: hide the mini player and wait for it to finish, then record the opening intent, then navigate, then load the new audio (4.5). The bar’s content is frozen while it leaves. |
| The mini player flickers or disappears unexpectedly | Visibility is tied to `isPlaying`. Pausing, buffering, seeking or moving to the next track briefly reports “not playing”. | Tie visibility to “a lecture is loaded and not finished or stopped”, not to “is playing” (4.2). |
| The mini player appears on top of now playing while it closes | The mini player is rendered above the navigator and appears as soon as the route changes back to the list, which happens at the start of the closing transition. | Keep a `closing` state until the closing transition ends (4.3). |
| Taps reload the lecture or restart it from 0:00 | Opening now playing calls `load()` even when that lecture is already loaded. | Compare lecture ids and never reload the current lecture (4.5). |
| The mini player is out of sync after using the notification or lock screen | The UI state only changes on in-app actions. | Subscribe to the audio layer’s events for status and track (4.4). |

Underneath all of these: **two sources of truth with different timing.** The audio layer is asynchronous and lives in native code; navigation is synchronous in JavaScript. The mini player must combine both explicitly, with user intent taking priority over audio events.

## 3. The model

### 3.1 Three inputs

| Input | Owned by | Values |
|---|---|---|
| **Audio session** | Your audio layer (`react-native-track-player` or similar), mirrored into a store by event listeners | `track` (lecture id and metadata) and `status`: `idle`, `loading`, `buffering`, `playing`, `paused`, `ended`, `stopped`, `error` |
| **Now playing presentation** | Your app code, set synchronously by user actions and finalised by navigation events | `closed`, `opening`, `open`, `closing` |
| **Where the user is** | The navigator | The current route name, and whether the keyboard is open |

Plus one flag for the switch sequence:

| Flag | Meaning |
|---|---|
| `switching` | True from the moment a different card is tapped until the new now playing screen has started opening. The mini player is hidden and its content frozen. |

### 3.2 Derived visibility

The mini player’s visibility is never set directly. It is computed from the inputs:

```ts
const ACTIVE = new Set(['loading', 'buffering', 'playing', 'paused', 'error']);
const NO_MINI_ROUTES = new Set(['NowPlaying', 'Onboarding', 'SignIn']);

const miniVisible =
  session.track != null &&
  ACTIVE.has(session.status) &&
  presentation === 'closed' &&
  !switching &&
  !NO_MINI_ROUTES.has(currentRoute) &&
  !keyboardOpen;
```

Each condition prevents one class of bug:

| Condition | Prevents |
|---|---|
| `ACTIVE.has(status)` | Flicker on pause, buffering or seeking; a stale bar after the lecture ends or is stopped |
| `presentation === 'closed'` | The bar appearing while now playing is opening or closing |
| `!switching` | The bar showing the new lecture before now playing |
| `!NO_MINI_ROUTES.has(route)` | The bar on screens that must stay clean |
| `!keyboardOpen` | The bar covering a search field |

### 3.3 What the mini player displays

The bar shows `session.track`, except while `switching` is true, when it keeps showing the lecture it had when the switch began. Capture that lecture in the switch handler, or keep a separate `miniTrack` value that only follows `session.track` while not switching.

### 3.4 One entry point

Every way of opening a lecture goes through one function: card taps, the mini player, notifications, deep links, search, the Events tab and “up next” inside the player. Bugs come from each caller doing its own mix of `load()` and `navigate()`.

## 4. Implementation

### 4.1 Where the mini player lives

Render the mini player once, at the root, outside any single screen, so it survives navigation and never re-mounts:

```tsx
<NavigationContainer ref={navRef} onStateChange={onNavStateChange}>
  <RootStack />
</NavigationContainer>
<MiniPlayer />   // absolute, above the navigator
```

Do not put it inside the tab bar component or inside the list screen. Inside the tab bar, it disappears on stack screens that hide the tab bar, and it re-renders with every tab change. Inside the list screen, it disappears on every other page.

Its bottom offset depends on whether the current screen shows a tab bar. Keep that as a value in the store, set by the tab navigator’s layout (tab bar height plus the bottom safe-area inset), and set it to the inset alone on screens without a tab bar.

### 4.2 The store

```ts
type Status = 'idle' | 'loading' | 'buffering' | 'playing' | 'paused' | 'ended' | 'stopped' | 'error';
type Presentation = 'closed' | 'opening' | 'open' | 'closing';

interface PlayerUI {
  track: Lecture | null;
  status: Status;
  presentation: Presentation;
  switching: boolean;
  miniTrack: Lecture | null;   // frozen while switching
  currentRoute: string;
  keyboardOpen: boolean;
  busy: boolean;               // a transition is in progress; ignore new open requests
}
```

Keep the visibility selector next to the store (3.2), and have the mini player read only that selector and `miniTrack`.

### 4.3 Presentation from navigation

`presentation` is set to `opening` synchronously by the entry point (4.5). Navigation events then move it forward:

```ts
// In the NowPlaying screen
useEffect(() => {
  const unsubs = [
    navigation.addListener('transitionEnd', (e) => {
      setPresentation(e.data.closing ? 'closed' : 'open');
    }),
    navigation.addListener('beforeRemove', () => setPresentation('closing')),
  ];
  return () => unsubs.forEach((u) => u());
}, [navigation]);

// Safety net: if the screen unmounts without a transitionEnd (rare), close.
useEffect(() => () => setPresentation('closed'), []);
```

`transitionStart` and `transitionEnd` are available on both the JS stack and the native stack navigators in React Navigation. The `closing` flag in their data tells you which direction finished.

Keep `currentRoute` from the container’s `onStateChange`, which fires synchronously when navigation state changes:

```ts
const onNavStateChange = () => {
  setCurrentRoute(navRef.getCurrentRoute()?.name ?? '');
};
```

If your now playing is an overlay (as in the animation guides) rather than a route, set `presentation` from the overlay’s own animation callbacks instead: `open` when it finishes expanding, `closing` when collapse starts, `closed` when collapse ends.

### 4.4 Audio session from events

Mirror the audio layer into the store with its events, and re-sync on app resume:

```ts
TrackPlayer.addEventListener(Event.PlaybackState, ({ state }) => setStatus(mapState(state)));
TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, ({ track }) => setTrack(track ?? null));
TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => setStatus('ended'));
TrackPlayer.addEventListener(Event.PlaybackError, () => setStatus('error'));

AppState.addEventListener('change', async (s) => {
  if (s !== 'active') return;
  setTrack((await TrackPlayer.getActiveTrack()) ?? null);
  setStatus(mapState((await TrackPlayer.getPlaybackState()).state));
});
```

Map every native state into your seven statuses in one place (`mapState`). Native players report extra states (for example, “ready”, “connecting”, “none”), and leaking those into UI checks is how flicker starts.

### 4.5 The entry point

```ts
async function openLecture(id: string, source: 'card' | 'mini' | 'notification' | 'deeplink' | 'upnext') {
  const s = store.getState();
  if (s.busy) return;                                   // ignore double taps and taps mid-transition

  // Already loaded: just show it. Never reload.
  if (s.track?.id === id) {
    if (s.presentation === 'closed') {
      store.setState({ presentation: 'opening' });      // intent first: hides the bar now
      navRef.navigate('NowPlaying', { id });
    }
    return;
  }

  store.setState({ busy: true });

  // A different lecture while the bar is showing: dismiss it first.
  if (selectMiniVisible(s)) {
    store.setState({ switching: true, miniTrack: s.track });  // freeze + hide
    await audio.pauseAndSavePosition();                       // old lecture stops now
    await miniPlayerExit();                                   // resolves when the exit finishes
  }

  // Intent first, audio second.
  store.setState({ presentation: 'opening', switching: false });
  navRef.navigate('NowPlaying', { id });
  audio.loadAndPlay(id);                                      // not awaited

  store.setState({ busy: false });
}
```

The order matters: by the time any audio event for the new lecture arrives, `presentation` is already `opening`, so the bar cannot appear.

`miniPlayerExit()` should resolve when the exit has finished, or immediately when the bar is not visible or reduce motion is on. If you trigger the exit from the store, resolve it from the animation’s completion callback.

Use `navigate`, not `push`, for `NowPlaying`, so a second request can never stack a second copy of the screen.

## 5. Situations

| # | Situation | Correct behaviour |
|---|---|---|
| 1 | Tap a card, nothing playing | Now playing opens; the bar never appears |
| 2 | Leave now playing while audio is active | The bar appears once now playing has fully closed |
| 3 | Navigate to other pages | The bar stays on every page except excluded ones |
| 4 | Tap the mini player | Now playing opens for the same lecture, without reloading |
| 5 | Tap the card that’s already loaded | Same as 4 |
| 6 | Tap a different card while the bar shows | Bar leaves, then now playing opens with the new lecture |
| 7 | Switch lectures inside now playing | Content updates in place; no bar |
| 8 | Pause from the bar | The bar stays, showing “paused” |
| 9 | Loading, buffering, slow network, error | The bar stays and shows the state |
| 10 | The lecture finishes | Depends on where the user is and on the queue |
| 11 | The user dismisses the bar | Audio stops, the notification goes, the bar leaves |
| 12 | Notification or lock-screen controls | The bar mirrors them |
| 13 | Tapping the media notification | Now playing opens; the bar is hidden |
| 14 | Back button | Closes now playing; never closes the bar |
| 15 | App in background, resumed, or killed | The bar re-syncs with the real audio state |
| 16 | App launch with a saved session | The bar is there from the first frame, or not at all |
| 17 | Keyboard opens | The bar hides until it closes |
| 18 | Screens that must not show the bar | Hidden by an explicit list |
| 19 | Rapid or repeated taps | One action at a time |
| 20 | Content behind the bar | Lists reserve space for it |
| 21 | Screen reader users | The bar is reachable and announced, without stealing focus |

### 5.1 Tap a card, nothing playing

**Correct behaviour:** now playing opens for that lecture and starts playing. The bar does not appear at any point, not even for a frame, and not under or over the opening screen.

**Caveats to avoid:**
- Starting audio before recording the opening intent. This is the main cause of the bar appearing first.
- Setting the “on now playing” flag in a `useEffect`, on focus or on `transitionEnd` of the opening. Those all happen after audio events can arrive.
- Waiting for audio to load before navigating. Navigation must not depend on the network.

### 5.2 Leave now playing while audio is active

Triggers: the chevron, the back button or a swipe down.

**Correct behaviour:** the bar appears once now playing has finished closing (`presentation` becomes `closed` on `transitionEnd` with `closing: true`). Audio continues without interruption. If the user leaves while the lecture is still loading, the bar appears in its loading state.

**Caveats to avoid:**
- Showing the bar as soon as the route changes back to the list. `onStateChange` fires at the start of the closing transition, so the bar would draw on top of the closing screen. That’s why `closing` exists.
- Never showing the bar because visibility waits for the list screen to be focused, and the user left to a different screen.
- Pausing or reloading the audio as part of closing the screen. The screen’s unmount must not touch playback.

### 5.3 Navigate to other pages

**Correct behaviour:** the bar stays visible on every page that is not excluded (5.18): Home, Events, lecture details, search results, settings and so on. It keeps its position above the tab bar, or above the system navigation bar on screens without a tab bar. It does not re-mount or restart its own state when pages change.

**Caveats to avoid:**
- Rendering the bar inside the tab bar or a single screen.
- A fixed bottom offset that leaves a gap, or hides the bar behind the tab bar, on screens where the tab bar visibility differs.
- Re-rendering the bar on every navigation change. Select only the values it needs from the store.

### 5.4 Tap the mini player

**Correct behaviour:** now playing opens for the lecture in the bar, at its current position, with its current play or pause state. The bar is hidden from the moment of the tap (`presentation: 'opening'`).

**Caveats to avoid:**
- Calling `load()` or `play()` again. That restarts the lecture or causes an audible gap.
- Treating taps on the bar’s own buttons (play/pause, forward 15) as taps on the bar. They control playback and must not open the screen.

### 5.5 Tap the card that’s already loaded

**Correct behaviour:** exactly 5.4. Compare by lecture id, not by URL or title, since URLs can change (signed URLs, CDN variants) for the same lecture.

**Caveats to avoid:**
- Comparing the wrong identifiers and reloading the same lecture.
- If the lecture is loaded but paused, starting playback because the user opened the screen. Opening shows; it doesn’t change playback. (If your product wants “tap card = play”, make that an explicit decision and apply it consistently.)

### 5.6 Tap a different card while the bar shows

**Correct behaviour:** in this order:

1. The bar’s content freezes on the old lecture, and the bar is hidden (`switching: true`).
2. The old lecture pauses and its position is saved, so there is never a moment with two lectures audible, and coming back to it later resumes where it stopped.
3. The bar finishes its exit.
4. The opening intent is recorded, now playing opens for the new lecture, and the new audio starts loading.

The bar never shows the new lecture. The next time the bar appears, after leaving now playing, it shows the new lecture.

**Caveats to avoid:**
- Loading the new lecture before the bar has left. This is the bug where the bar updates first.
- Unfreezing `miniTrack` too early. If the bar re-renders with `session.track` during its exit, the user sees the new title flash in the leaving bar.
- Letting the old lecture keep playing during the bar’s exit, or stopping it without saving its position.
- Accepting another card tap during the sequence (5.19).

### 5.7 Switch lectures inside now playing

Triggers: “up next”, a series list or a related lecture inside the player.

**Correct behaviour:** the now playing screen stays open and its content updates in place. The bar does not appear, because the user never left now playing. Save the previous lecture’s position as in 5.6.

**Caveats to avoid:**
- Routing this through the “different card” path, which would try to dismiss a bar that isn’t there.
- Pushing a second now playing screen for the new lecture (use `navigate` with new params, or `setParams`).

### 5.8 Pause from the bar

**Correct behaviour:** audio pauses and the bar stays, showing the play icon. It remains on every page until the user resumes, dismisses it, or opens another lecture.

**Caveats to avoid:**
- Visibility tied to `isPlaying`, which makes the bar disappear on pause.

### 5.9 Loading, buffering, slow network, error

**Correct behaviour:** the bar stays visible through `loading` and `buffering`, with a small loading indicator in place of the play/pause icon. On `error`, it stays and shows a retry action. Tapping the bar still opens now playing, where the full error message lives.

**Caveats to avoid:**
- Passing raw native states to the UI (5 different “not playing” states will each flicker the bar).
- Hiding the bar on error, which leaves the user with no way back to the lecture.

### 5.10 The lecture finishes

**Correct behaviour:**

| Where the user is | Queue | Result |
|---|---|---|
| Not on now playing | A next lecture is queued (auto-advance) | The bar stays and updates in place to the next lecture. This is the one case where the bar may change lecture, because playback changed it, not a tap. |
| Not on now playing | Nothing next | The bar leaves with its exit, and the session ends (`ended`). |
| On now playing | Any | Now playing stays, showing the ended state (or the next lecture). If the session ended, leaving now playing shows no bar. |

**Caveats to avoid:**
- The bar flickering out and in between `ended` and the next track’s `loading`. Treat the gap between tracks in a queue as active, by not marking `ended` until the queue itself ends.
- Leaving a bar on screen for a lecture that has finished with nothing to resume.

### 5.11 The user dismisses the bar

Triggers: swiping the bar down, or a close button if you add one.

**Correct behaviour:** audio stops, the position is saved, the session is cleared, the media notification and the foreground service are removed, and the bar leaves. Tapping a card afterwards behaves like 5.1.

**Caveats to avoid:**
- Hiding the bar without stopping audio (“ghost audio” with no visible control).
- Stopping audio without removing the notification, so the notification outlives the bar.
- Clearing the session before the exit finishes, which re-renders the leaving bar empty. Freeze its content as in 5.6.

### 5.12 Notification or lock-screen controls

**Correct behaviour:** play, pause and skip from the notification, lock screen, headphones or a car are reflected in the bar immediately, because the store follows audio events. “Stop” from the notification behaves like 5.11.

**Caveats to avoid:**
- Updating the store only from in-app buttons.
- Audio events arriving while the app is in the background being missed. Re-sync on resume (4.4).

### 5.13 Tapping the media notification

**Correct behaviour:** the app opens on now playing for the loaded lecture, through `openLecture` with source `notification`. The bar is hidden while now playing is open, and appears when the user leaves it, as usual. If the app was killed, cold-start directly into now playing, with the screen beneath it being your normal home screen, so leaving now playing lands somewhere sensible.

**Caveats to avoid:**
- Opening the app on Home with the bar visible, making the user tap again.
- A cold start where the store rehydrates a stale lecture before the audio service reports the real one, briefly showing the wrong title.

### 5.14 Back button

**Correct behaviour:** on now playing, back closes now playing and the bar appears (5.2). On any other screen, back behaves normally; the bar is not a back target and stays. On the root screen, back leaves the app as usual and audio continues in the background with its notification.

**Caveats to avoid:**
- A back handler that hides or stops the bar.
- Stopping audio when the activity is backgrounded.

### 5.15 App in background, resumed, or killed

**Correct behaviour:** while backgrounded, audio continues and the store may miss events. On resume, re-sync `track` and `status` from the audio layer before the next render that matters. If the audio service was killed by the system, the session is gone and the bar must not appear.

**Caveats to avoid:**
- Trusting the in-memory store after a long background period.
- Showing a bar whose controls do nothing because the service is gone.

### 5.16 App launch with a saved session

**Correct behaviour:** decide one product rule and apply it everywhere. Either restore the last lecture (paused, at its saved position) and show the bar from the first frame, or don’t restore and show nothing. Don’t let the bar appear a moment after launch.

**Caveats to avoid:**
- Rendering the bar from persisted store data before the audio layer has confirmed the track is loaded. Wait for the audio layer’s setup to finish before computing visibility, and keep the splash screen up until then if needed.

### 5.17 Keyboard opens

**Correct behaviour:** the bar hides while the keyboard is open (for example, on the search screen) and comes back when it closes. Audio is unaffected.

**Caveats to avoid:**
- The bar riding up above the keyboard and covering the input, which happens on Android when the window resizes for the keyboard (`adjustResize`).

### 5.18 Screens that must not show the bar

**Correct behaviour:** keep an explicit list (`NO_MINI_ROUTES`): now playing itself, onboarding, sign-in, and anything full-screen such as a video player or an image viewer. Every other screen shows the bar.

**Caveats to avoid:**
- Hiding it per screen with ad-hoc flags in each screen’s code. Screens added later will get it wrong.
- Forgetting nested navigators. Check the deepest focused route (`getCurrentRoute()`), not the top-level one.

### 5.19 Rapid or repeated taps

**Correct behaviour:** one action at a time. While `busy` is true (from the tap until now playing has started opening), further card taps and bar taps are ignored.

**Caveats to avoid:**
- Two now playing screens stacked from a double tap (use `navigate`, and the `busy` guard).
- Two lectures loaded in quick succession, ending with the bar or the screen showing one and the audio playing the other. The guard prevents it, and the store must always take the track from audio events, not from the last tap.

### 5.20 Content behind the bar

**Correct behaviour:** while the bar is visible, every scrollable page reserves space at the bottom equal to the bar’s height plus its gap, so the last item can scroll fully into view. When the bar leaves, that space goes too.

**Caveats to avoid:**
- Hard-coding the padding on some screens only.
- A list whose last card can’t be tapped because the bar covers it.

### 5.21 Screen reader users

**Correct behaviour:** the bar is one focusable element labelled with the lecture and speaker (“Now playing: Sacrifices of the Ṣaḥābā…, Mawlana Zyad Ally Quenette”), with its play/pause and forward-15 buttons focusable separately. When it appears, it does not take focus away from what the user was reading.

**Caveats to avoid:**
- An unlabelled bar announced only as “button”.
- Moving focus to the bar when it appears after closing now playing.

## 6. Checklist

- Tap a card with nothing playing: no bar at any moment, on a slow network too.
- Close now playing with chevron, back and swipe: the bar appears only after the screen has closed.
- Visit Events, a details page, search and settings: the bar stays and sits in the right place.
- Pause from the bar and navigate: the bar stays.
- Tap the bar and the playing card: no restart, same position.
- With the bar showing, tap a different card: the bar never shows the new title; the old lecture stops before the new one starts.
- Swipe the bar away: audio stops and the notification disappears.
- Pause and stop from the notification, the lock screen and headphones.
- Let a lecture finish with and without a next lecture, on and off now playing.
- Background the app for a long time, then resume.
- Kill and relaunch with a saved session.
- Open the search keyboard with the bar showing.
- Double-tap cards and the bar.
- Test with TalkBack.