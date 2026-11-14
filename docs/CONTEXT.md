# Ulama Moris: app context

A short orientation for picking the app up again. It says how things work, what was decided, and
what's still open. Rules are in [AGENTS.md](../AGENTS.md). For visual style (colours, tokens, type)
go to [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md); for the motion spec, [Audio-Player-Animations.md](Audio-Player-Animations.md).

## What the app is

An audio lecture app (Expo SDK 58, Expo Router, TypeScript, NativeWind 4). Users browse the latest
lectures (Home) and events (Events → Event detail), search by title, and listen through one
global player: a floating **mini player** bar that morphs into a full **Now Playing** sheet.

Data is static today: fetchers read `src/data/sample.ts`. There is no real API, no sign-in,
no bookmarks and no error or offline states yet.

## Status (14 Nov 2026)

Build stages 1–12 are done and merged. Their plan files were deleted once this file held what
they decided; they are in git history before the commit that removed `plan/`. Lint, typecheck,
`check:theme` and `npm test` (43 suites, 449 tests) pass.

Next stage: **error and offline states**. [ERROR-STATES.md](ERROR-STATES.md) has the spec, the
build order and the checklist; the screenshots are in `artboards/error-states/`.

Built but not yet checked. Everything was verified in Expo Go on the iOS simulator and on web;
no development build exists yet. The checks below need one (`npx expo run:ios --device`,
`npx expo run:android --device` or `eas build --profile development`). Report each as pass,
fail or not checked.

**Audio on real devices** (also [expo-audio.md](expo-audio.md) §7):
- [ ] iOS lock screen and Control Center: title, author, artwork; play/pause, scrub and ±15 s skip work.
- [ ] iOS plays with the silent switch on.
- [ ] Android media notification: play/pause, seek and skip work from it.
- [ ] Android keeps playing in the background after 5+ minutes.
- [ ] Android 13+: playback works with notification permission granted and denied.
- [ ] A track change updates the lock-screen / notification title and artwork.
- [ ] An incoming call pauses, and the play button shows "Play" afterwards.
- [ ] Unplugging headphones pauses, and the UI shows it.
- [ ] A pause from the lock screen shows in the app when it's reopened.

**Motion on real devices:**
- [ ] Android release build on the slowest phone: open, close, swipe and interrupt flows stay under 16 ms per frame (8 ms at 120 Hz).
- [ ] Android back on Now Playing collapses it and never leaves the app.
- [ ] Android three-button navigation: the bar and Now Playing's controls clear the navigation bar.
- [ ] TalkBack and VoiceOver: focus lands on "Minimise player" when Now Playing opens; the tabs behind can't be reached; the bar is reachable after closing.
- [ ] iPhone with ProMotion: 120 fps during the entrance.
- [ ] Feel: flick strength carries into the collapse; the bar drop isn't sluggish. Tune in `player-motion-config.ts` only.

**Release-build performance pass** (`npx expo run:ios --configuration Release`, Perf Monitor on):
- UI FPS stays at the display rate while Now Playing opens, closes and is swiped.
- To prove the motion runs on the UI thread, add a 300 ms busy loop at the start of `playLecture`
  locally (never commit it). The entrance must still be smooth while JS FPS drops.
- React Profiler during a close: `PlayerSurface` commits at most twice (`closing`, `closed`).

**Known gaps:**
- expo-audio 58 has no notification-tap or notification-stop event. Tapping the notification opens the app where it was.
- Seen once on iOS, not reproduced: the Home list ended up scrolled about 200 pt after opening and closing the player.

**Open questions and gaps** (decide before release; don't build without asking):
- **Data to confirm:** "Who were the ṣaḥābā…" is assumed to be the Sahaba event's 4th lecture, with 2377 s derived from the event total. "A Country on Fire" has no duration.
- **Recent searches:** the 5 seeds are invented. Ship an empty list, or keep them as hints that real searches replace?
- **Share and mic:** the Event detail share button and the Search mic are visual only. Their behaviour (and the share payload) is undecided.
- **App icons:** `app.json` still has Expo's default icons and Android adaptive background `#E6F4FE`. Derive them from the logo, on the ivory background.
- **Spelling:** titles are kept exactly as on the website ("Sahaba Radiyyallahu Anhum" vs "Ṣaḥābā Radiyallāhu ’Anhum"; "Islahi" vs "Islāhi"). Don't "fix" one side; accent-insensitive search covers both.
- **Not designed, improvised with a `// TODO(design)`:** the loading look in the mini player, Continue listening with nothing played, the events-scope search results, the no-results and empty-recents cards. Still missing: full-screen skeletons for the first load of Home and Events, and how the fixed heights (40 chips, 34 tags, 32 tab pill, 52 search field) behave at the largest text sizes.
- **Only the Sahaba event** has a designed detail page; the other events use the same template.

## Routes (`src/app/`)

| Route | What |
|---|---|
| `(tabs)/index.tsx` | Home: Continue listening, filter chips (not wired yet, `TODO(series stage)`), the latest lectures with infinite scroll |
| `(tabs)/events/index.tsx`, `events/[slug].tsx` | Events list (year sections, paging) and Event detail |
| `search.tsx` | Root-stack screen over the tabs, so it covers the player too. Accent-insensitive title match |
| `player.tsx` | **Deep links only** (`/player?slug=…`). Loads the lecture paused, shows Now Playing without an entrance, steps back. Nothing navigates here |
| `(tabs)/_layout.tsx` | JS tabs (`expo-router/js-tabs`) wrapped in `TuckedContent`, with `PlayerSurface` drawn over them |
| `dev/components`, `dev/tokens` | Development-only galleries, opened by URL |

## Design screenshots

The visual reference for each screen, 2× PNGs in a 390-wide frame. The top 44 pt is a fake status
bar: use safe-area insets instead. Where a screenshot disagrees with the built screen or with this
file, the built screen and this file win (the decisions below list the deliberate differences).

| Screenshot | Screen (route) | State shown |
|---|---|---|
| `artboards/screens/home.png` | Home (`(tabs)/index.tsx`) | "Local" chip selected, first lecture active and paused |
| `artboards/screens/events.png` | Events (`(tabs)/events/index.tsx`) | Default list |
| `artboards/screens/event-detail.png` | Event detail (`(tabs)/events/[slug].tsx`) | Lecture 02 active and paused |
| `artboards/screens/now-playing.png`, `now-playing-dark.png` | Now Playing (`PlayerSurface`, not a route) | Playing, light and dark |
| `artboards/screens/search.png` | Search (`search.tsx`) | Lectures scope, empty query, recent searches |
| `artboards/screens/search-results.png` | Search (`search.tsx`) | "Ṣaḥābā" typed, results |
| `artboards/design-system.png` | — | The colour board (see DESIGN-SYSTEM.md) |
| `artboards/error-states/*.png` | The next stage | See ERROR-STATES.md |
| `videos/mini-player.mov` | Mini player ↔ Now Playing | The reference motion |

## Decisions

What was built, where it differs from the original design spec:

- **Lectures:** the bar never introduces a lecture. Rows and search results open Now Playing.
- **Event date tiles:** show the data's `day` / `month` as given, which is the start day ("24"), not the end day.
- **Venues:** all-caps venue strings are title-cased for display by `formatVenue`. Mixed-case strings are kept as they are, so diacritics survive.
- **Category colours:** rotate cat-1 → cat-5 and wrap. There is no fixed topic → colour map. By topic: `catForTopic(topic, topicOrder)`; by position: `catAt(index)`.
- **Search:** matches **titles only** (the lecture or event title), accent-insensitive.
  - No-results copy is "Try another lecture title." / "Try another event title.".
  - **Popular topics is removed** from both scopes.
  - Recent searches are **static seeds**: nothing is saved, and ✕ / "Clear all" do nothing. Create `recent-searches.store.ts` (persisted, max 5, de-duped, newest first) when recents become real.
- **Motion:** where the build departs from [Audio-Player-Animations.md](Audio-Player-Animations.md):
  - The surface is rendered in `(tabs)/_layout.tsx`, not at the root, so Search still covers it.
  - The spec's seven UI states map onto the five `nowPlayingPresentation` values. There is no second state machine.
  - The tuck is derived from `expand` and `enterY`. There is no separate `tuck` value.
  - Waits use the fixed `MINI_EXIT_MS`, not completion callbacks, which can hang.
  - Colours come from the theme, not the spec's hex values.

**Mock-only data** (in `src/data/sample.ts` and `mock-ui.ts`). Replace each with the API field when the API exists:
- `eventSlug` on lectures, next to `event` (the title).
- `dateRangeLong` on events (the API will return it formatted).
- The static totals "81 lectures" and "11 events" (the app never counts).
- The repeated `--N` slugs that pad the lists (`src/data/mock-repeat.ts`).
- `seedRecentSearches`.

## Where code lives

- `src/components/` renders from props only. No stores, no navigation, no fetching.
- `src/features/<domain>/` owns state, data and logic.
- Components that read the player stores live in `src/features/player/*.tsx`.

## State: who owns what

| State | Owner |
|---|---|
| Lecture/event pages, event detail, search results | TanStack Query. One `QueryClient` with `staleTime: 0, gcTime: 0` while the data is static |
| Queue, `currentIndex`, `source`, `hasQueueEnded`, `nowPlayingPresentation`, the mirrored audio status | Zustand `player.store.ts`. **Not persisted**, so a launch shows no bar |
| Resume points `progressById`, `lastPlayedSlug` | Zustand `listening-history.store.ts`, persisted to AsyncStorage |
| Motion values | Reanimated shared values at module scope in `player-surface-motion.ts`. Never in Zustand or React state |
| Theme | NativeWind `dark:` + `useColorScheme()`. JS colours from `useThemeColors()` |
| Search text, selected chip, open menus | `useState` in the screen |

**React Context:** the app defines none. The only providers are library ones
(`GestureHandlerRootView`, `QueryClientProvider`) in `src/providers/app-providers.tsx`.
Add Context only for rarely changing, near-root values (a future language setting, for example).

**Zustand rules that matter:**
- Always read through a selector. Never call `usePlayerStore()` bare: `positionSec` updates about 4 times a second.
- Calculate derived values in selectors: `selectCurrentLecture`, `selectActiveLectureSlug`, `selectIsMiniPlayerVisible`, `selectSourceLabel`.
- Stores hold data and plain setters only.
- **Why two player stores:** `persist` writes storage on every `set`. The live store changes constantly, so only the checkpoint store is persisted.

**Query data is never copied into a store**, with one exception: pressing play copies the chosen
list into the queue. It's a snapshot the user picked, not a cache.

## Audio: expo-audio plays, Zustand remembers

- `audio-engine.ts` creates exactly one player, lazily through `getPlayer()`.
  - It isn't created at import because web server-renders, and expo-audio's web player can't be created there.
  - Commands: `playLecture`, `toggle`, `pause`, `resume`, `seek`, `skip`, `playNext`, `stopAndClear`.
- Status flows one way: **expo-audio → `PlayerStatusBridge` → store.**
  - The bridge is mounted once in the root layout.
  - It copies `isPlaying`, `positionSec`, `durationSec`, buffering and loaded into the store.
  - On `didJustFinish` it auto-advances, once per finish.
  - Buttons never set `isPlaying` themselves. That keeps the UI right when the OS pauses audio (a call, the lock screen, unplugged headphones).
- **Resume:** `loadCurrent` stores the saved position as pending. The bridge calls `finishPendingResumeIfReady()`, which seeks once the item has loaded (seeking earlier isn't safe on iOS).
- **Progress checkpoints:** on pause, on seek, on a track change, every 10 s while playing, when the app goes to the background, and on stop. Never on every tick.
- **Lock screen:** ±15 s skip (`seekForward/BackwardIntervalSeconds`). No next or previous track. Artwork is a hosted https PNG.

## Now Playing and the mini player: one surface

The bar and Now Playing are a single overlay, `PlayerSurface`, drawn over the tabs. They aren't a
route and they aren't a native modal, because the bar has to morph into the sheet while the tabs
behind shrink and dim.

**Layers**, bottom to top:
1. The background, which grows from the bar's rectangle to the window.
2. The full Now Playing content.
3. The cover: one view that is Now Playing's artwork and also the bar's 44 px thumbnail.
4. The bar's content.

**Presentation** (`nowPlayingPresentation` in the store):
`closed → opening → open → closing → closed`, plus `miniLeaving` while the bar drops away.

**When the bar shows:** only `selectIsMiniPlayerVisible`. That is: a lecture is loaded, the queue
hasn't ended, and the presentation is `closed`. It never depends on `isPlaying`, so pausing or
buffering doesn't make it flicker.

**Every entry and exit goes through `open-now-playing.ts`.** It is the only writer of the
presentation. Each function starts with a guard on the presentation, which also absorbs double
taps. The order is always **store → engine → motion**.

| Action | What happens |
|---|---|
| Tap a row, nothing showing | The sheet springs up from below (`enterFresh`). The lecture starts |
| Tap the loaded lecture while the bar shows | The bar grows into Now Playing (`expandFromMini`). No reload. A play button also resumes |
| Tap a different lecture while the bar shows | `miniLeaving`: pause, drop the bar, wait `MINI_EXIT_MS` (320 ms). Then load the new lecture and spring the sheet up. **The bar never shows the new lecture** |
| Tap the bar | The bar grows into Now Playing. This also works mid-collapse: it reverses from where it is |
| Chevron or Android back | Collapse into the bar (`collapseToMini`, 390 ms timing). Works mid-opening. Playback continues |
| Swipe Now Playing down | Follows the finger. Collapses past 18 % of the screen or a flick over 1000 pt/s; otherwise springs back |
| Swipe the bar down | Follows the finger. Past 24 pt or a flick over 800 pt/s it drops away and `stopAndClear()` runs; otherwise it springs back. Screen readers get "Stop and close player" |
| Event pill on Now Playing | Collapses into the bar while `router.navigate` opens the event in the Events tab underneath |
| Search result | Search slides back (`router.back`) while the sheet rises behind it |
| Deep link `/player?slug=` | Shown at once with no entrance (`showNowPlayingWithoutMotion`) |

The bar never introduces a lecture: rows and results always open Now Playing.

## Motion: how it should behave

There are three driving shared values, all in `player-surface-motion.ts`:
- `expand`: 0 = the bar, 1 = the full player. Drives the morph, and the swipe scrubs it.
- `enterY`: the sheet's offset during a fresh entrance only. It runs from the window height to 0, and is 0 at all other times.
- `miniDrop`: 0 = the bar in place, 1 = dropped away (70 px down, transparent).

`surfaceOpacity` is used only for Reduce Motion crossfades.

**Feel:**
- **Fresh entrance:** a spring with a slight overshoot (stiffness 230, damping 25). The cover leads, and the text arrives after it.
- **Morph (bar → sheet) and a swipe collapse:** a spring with no bounce (stiffness 220, damping 26). It carries the finger's speed.
- **Chevron collapse:** a 390 ms timing on `bezier(0.4, 0, 0.2, 1)`.
  - The cover lands exactly on the thumbnail, with no jump in the last frames.
  - The bar's text fades in over the last quarter.
- **Bar drop:** lifts 5 px over the first 18 % of the drop, then falls 70 px and fades while accelerating away (320 ms). After a drag it keeps falling from where the finger left it, with no lift.
- **Snap back:** stiffness 260, damping 22.
- **The tuck behind the sheet:**
  - Tied to openness, which is `expand × entrance progress`.
  - The tabs scale to 0.92, move down 12 px, round to radius 26, and dim to 30 % over a charcoal backdrop.
  - One formula covers the entrance, the morph and the finger.
- **Swipe tracking:** the range is the distance the cover's centre travels to the thumbnail, not the window height. So a point on the cover stays under the finger.
- **Now Playing's content:** rides down with the sheet's top edge. Its fade is squared, so text never lingers behind a swipe.
- **Reduce Motion:** every change becomes a short crossfade (200 ms; the bar 150 ms). The tuck only dims, with no scale. The swipe still follows the finger.
- **Interruptions:** any motion can be retargeted mid-flight and continues from its current value and speed. Completion callbacks act only when `finished` is true **and** the presentation is still the one they expect.

**Rules that keep it smooth and correct:**
- Every number lives in `player-motion-config.ts`. Tune there only.
- Every frame runs on the UI thread. React re-renders only at phase changes, never per frame.
- Use `.get()` / `.set()`, never `.value`.
- Use `scheduleOnRN`, never `runOnJS`, and never inside a gesture's `onUpdate`. `player-rules.test.ts` enforces these.
- `player-surface-motion.ts` never imports the store or the engine. The flows decide *whether* something happens; the motion file decides *how it moves*.
- Geometry is three shared values: `windowSizeValue`, `miniRectValue`, `coverRectValue`.
  - Write each one whole. Never read, change one field and write back: on native the read can be stale. That bug once put the thumbnail at the top-left on iOS.
  - `miniRect` comes from the bar's own `onLayout`.
  - `coverRect` is calculated from the measured Now Playing body. Never use `measureInWindow`, because it includes the entrance offset.
- Now Playing's body is a plain `View`, not a `ScrollView`, so it never fights the swipe. The artwork shrinks to fit instead.
- **Gestures:**
  - Now Playing uses Gesture Handler `usePanGesture`, on the UI thread.
  - The bar uses React Native `PanResponder` writing `miniDrop`. Gesture Handler v3 got no touches on the floating bar on iOS.
- **Animated views:** use plain `style`, because NativeWind `className` doesn't reach them. Don't put shadows on them either: on Android they stopped the sheet and the artwork from drawing.
- **React Compiler:** a worklet that captures another inline worklet crashes at load. Declare the inner one as a named module-level worklet.
- **Accessibility:** while Now Playing is in front, the tabs behind are hidden from screen readers.

Deliberately not built: the big play button morph, the progress sweep on entrance, the moonlight
reveal, and haptics.

## Design system in one breath

- Use semantic NativeWind classes only (`bg-bg`, `text-fg-muted`, `bg-primary` …). Never a hex or a primitive in `src/app` or `src/components`; `npm run check:theme` fails on it.
- JS colours come from `useThemeColors()`.
- Text uses `<Text variant="…">`.
- Fonts use `font-manrope-*`.
- Use `tabular` for every time value.
- Light and dark must both work.

Read [src/theme/README.md](../src/theme/README.md) before touching tokens.

## Verifying

- **Commands:** `npx expo lint`, `npx tsc --noEmit`, `npm run check:theme`, `npm test`. Use `npm test`, not bare jest: it sets the time zone.
- **iOS:** Expo Go on the simulator (open DeviceHub on Xcode 27), driven with AXe.
  - Use `axe drag` for the bar, because `axe swipe` doesn't reach PanResponder.
  - Record motion with `simctl io recordVideo`.
- **Web stands in for Android:** use `playwright-cli` at 390 × 844.
- **Motion timing:** unit tests can't check it, because the test Reanimated stand-in finishes every animation at once. Check timing on a recording.
