# Ulama Moris: app context

A short orientation for picking the app up again. It says how things work, what was decided, and
what's still open. Rules are in [AGENTS.md](../AGENTS.md). For visual style (colours, tokens, type)
go to [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md). The player's current design is "Now Playing and the mini player" below;
[Audio-Player-Animations.md](Audio-Player-Animations.md) is the retired motion spec.

## What the app is

An audio lecture app (Expo SDK 58, Expo Router, TypeScript, NativeWind 4). Users browse the latest
lectures (Home) and events (Events → Event detail), search by title, and listen through one
global player: a floating **mini player** bar above the tab bar, and a full **Now Playing** screen.

Data comes from the website's API (`/api/v1`, see "The website API" below), the local
website at `localhost:3000` until it's deployed. There is no sign-in and no bookmarks.

## Status (23 Nov 2026)

Build stages 1–12 are done and merged. Their plan files were deleted once this file held what
they decided; they are in git history before the commit that removed `plan/`. Lint, typecheck,
`check:theme` and `npm test` (53 suites, 554 tests) pass.

**Now Playing phase 1** (branch `feat/now-playing-phase-1`, plan in
[Now-Playing-Phase-1-Plan.md](Now-Playing-Phase-1-Plan.md)): the animated player surface is
replaced by a plain `/player` screen and a plain bar, with no animation and no gestures. It was
built because the animated surface could leave a value half-way on Android: Now Playing showed
with no background and the bar went invisible (`docs/bugs/`). Checked on the iOS simulator and on web.

The **error and offline states** (see "Error and offline states" below) are built: the list
cards and next-page footers (Home, Events, Search, and Event detail, which has no design and
reuses the card), the Now Playing and mini player audio states, and the blocking offline sheet.
Force any of them in development at `/dev/failures`.

**Before the first release:** `/dev/failures` still ships in the release bundle; it only
redirects to Home there. Remove it from production builds.

Built but not yet checked. Everything was verified in Expo Go on the iOS simulator and on web;
no development build exists yet. The checks below need one (`npx expo run:ios --device`,
`npx expo run:android --device` or `eas build --profile development`). Report each as pass,
fail or not checked.

**Audio on real devices** (after any change to the `expo-audio` plugin settings in `app.json`, rebuild the app: Expo Go and a JS reload don't pick them up):
- [ ] iOS lock screen and Control Center: title, author, artwork; play/pause, scrub and ±15 s skip work.
- [ ] iOS plays with the silent switch on.
- [ ] Android media notification: play/pause, seek and skip work from it.
- [ ] Android keeps playing in the background after 5+ minutes.
- [ ] Android 13+: playback works with notification permission granted and denied.
- [ ] A track change updates the lock-screen / notification title and artwork.
- [ ] An incoming call pauses, and the play button shows "Play" afterwards.
- [ ] Unplugging headphones pauses, and the UI shows it.
- [ ] A pause from the lock screen shows in the app when it's reopened.
- [ ] Moving between screens doesn't stop playback.
- [ ] Stopping (the bar's screen-reader "Stop and close player" action) clears the notification and the lock-screen card.

**Now Playing on real devices:**
- [ ] Android back on Now Playing closes it and never leaves the app.
- [ ] Android three-button navigation: the bar and Now Playing's controls clear the navigation bar.
- [ ] TalkBack and VoiceOver: focus lands on Now Playing when it opens; the tabs behind can't be reached; the bar is reachable after closing.
- [ ] A reminder tapped while the app is closed opens Now Playing (Expo Go drops the path on a cold start, so check in a development build).

**Known gaps:**
- expo-audio 58 has no notification-tap or notification-stop event. Tapping the notification opens the app where it was.
- Seen once on iOS, not reproduced: the Home list ended up scrolled about 200 pt after opening and closing the player.

**Open questions and gaps** (decide before release; don't build without asking):
- **Data to confirm:** "Who were the ṣaḥābā…" is assumed to be the Sahaba event's 4th lecture, with 2377 s derived from the event total. "A Country on Fire" has no duration.
- **Share and mic:** the Event detail share button and the Search mic are visual only. Their behaviour (and the share payload) is undecided.
- **App icons:** `app.json` still has Expo's default icons and Android adaptive background `#E6F4FE`. Derive them from the logo, on the ivory background.
- **Spelling:** titles are kept exactly as on the website ("Sahaba Radiyyallahu Anhum" vs "Ṣaḥābā Radiyallāhu ’Anhum"; "Islahi" vs "Islāhi"). Don't "fix" one side; accent-insensitive search covers both.
- **Not designed, improvised with a `// TODO(design)`:** the loading look in the mini player, Continue listening with nothing played, the events-scope search results, the no-results and empty-recents cards. Still missing: full-screen skeletons for the first load of Home and Events, and how the fixed heights (40 chips, 34 tags, 32 tab pill, 52 search field) behave at the largest text sizes.
- **Only the Sahaba event** has a designed detail page; the other events use the same template.

## Routes (`src/app/`)

| Route | What |
|---|---|
| `(tabs)/index.tsx` | Home: Continue listening, the series chips (Local selected at first; every request sends a series), that series' latest lectures with infinite scroll |
| `(tabs)/events/index.tsx`, `events/[slug].tsx` | Events list (year sections, paging) and Event detail |
| `search.tsx` | Root-stack screen over the tabs, so it covers the player too. Accent-insensitive title match |
| `player.tsx` | **Now Playing.** A root-stack screen (`fullScreenModal`, no animation, no swipe, singular). Opened only through `open-now-playing.ts`, and by deep links (`/player?slug=…`: with nothing loaded, loads the lecture paused) |
| `(tabs)/_layout.tsx` | JS tabs (`expo-router/js-tabs`), with the mini player (`MiniPlayerBar`) floating above the tab bar |
| `dev/failures` | Development-only forced-failure switches, opened by URL. In the release bundle too (redirect to Home): remove before release |

## Design screenshots

The visual reference for each screen, 2× PNGs in a 390-wide frame. The top 44 pt is a fake status
bar: use safe-area insets instead. Where a screenshot disagrees with the built screen or with this
file, the built screen and this file win (the decisions below list the deliberate differences).

| Screenshot | Screen (route) | State shown |
|---|---|---|
| `artboards/screens/home.png` | Home (`(tabs)/index.tsx`) | "Local" chip selected, first lecture active and paused |
| `artboards/screens/events.png` | Events (`(tabs)/events/index.tsx`) | Default list |
| `artboards/screens/event-detail.png` | Event detail (`(tabs)/events/[slug].tsx`) | Lecture 02 active and paused |
| `artboards/screens/now-playing.png`, `now-playing-dark.png` | Now Playing (`player.tsx`) | Playing, light and dark |
| `artboards/screens/search.png` | Search (`search.tsx`) | Lectures scope, empty query, recent searches |
| `artboards/screens/search-results.png` | Search (`search.tsx`) | "Ṣaḥābā" typed, results |
| `artboards/design-system.png` | — | The colour board (see DESIGN-SYSTEM.md) |
| `artboards/error-states/*.png` | Lists, Search, Now Playing, mini player, offline sheet | Each error and offline state (see "Error and offline states") |
| `videos/mini-player.mov` | Mini player ↔ Now Playing | The retired reference motion (not built in phase 1) |

## Decisions

What was built, where it differs from the original design spec:

- **Lectures:** the bar never introduces a lecture. Rows and search results open Now Playing.
- **Event date tiles:** show the data's `day` / `month` as given, which is the start day ("24"), not the end day.
- **Venues:** all-caps venue strings are title-cased for display by `formatVenue`. Mixed-case strings are kept as they are, so diacritics survive.
- **Category colours:** rotate cat-1 → cat-5 and wrap. There is no fixed topic → colour map. By topic: `catForTopic(topic)`, worked out from the topic's letters so the same topic has the same colour everywhere; by position: `catAt(index)`. Topics show exactly as the API sends them.
- **Search:** matches **titles only** (the lecture or event title), accent-insensitive.
  - No-results copy is "Try another lecture title." / "Try another event title.".
  - **Popular topics is removed** from both scopes.
  - Recent searches are real: `recent-searches.store.ts`, persisted, the last 5 per scope, newest first, a repeat (any capitalisation) moved to the top. A query is saved only when the user commits to it: the keyboard's Search key, or opening one of its results. Search starts empty ("Your searches will appear here."). ✕ removes one; "Clear all" (shown only when there is something to clear) empties the scope.
- **Now Playing (phase 1):** a plain screen with no animation and no gestures, instead of the morph in [Audio-Player-Animations.md](Audio-Player-Animations.md). No visible way to stop and close the bar: pausing is enough. A Search result replaces Search. See "Now Playing and the mini player".

## Where code lives

- `src/components/` renders from props only. No stores, no navigation, no fetching.
- `src/features/<domain>/` owns state, data and logic.
- Components that read the player stores live in `src/features/player/*.tsx`.

## State: who owns what

| State | Owner |
|---|---|
| Lecture/event pages, event detail, search results | TanStack Query, from the website API. One `QueryClient`: `staleTime` 1 min, `gcTime` 5 min |
| Queue, `currentIndex`, `source`, `hasQueueEnded`, the mirrored audio status | Zustand `player.store.ts`. **Not persisted**, so a launch shows no bar |
| Resume points `progressById`, `lastPlayedSlug` | Zustand `listening-history.store.ts`, persisted to AsyncStorage |
| Whether Now Playing is open | The navigation stack only (the `/player` screen). Never stored |
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

## Now Playing and the mini player

Now Playing is the `/player` screen in the root stack. The mini player (`MiniPlayerBar`) is a plain
view in the tabs layout, floating above the tab bar. Only the navigation stack knows whether Now
Playing is open; the store holds no copy of it.

**When the bar shows:** only `selectIsMiniPlayerVisible`: a lecture is loaded and the queue hasn't
ended. It never depends on `isPlaying`, so pausing or buffering doesn't make it flicker. While Now
Playing is open, its screen simply covers the bar.

**Every entry and exit goes through `open-now-playing.ts`**: the audio first, then the navigation.
Nothing in it is async or waits for an animation. A double tap is harmless: the screen is
`dangerouslySingular`, and opening the loaded lecture never reloads it.

| Action | What happens |
|---|---|
| Tap a row | The lecture loads and Now Playing shows at once |
| Tap the loaded lecture | Now Playing shows. No reload. A play button also resumes |
| Tap a different lecture while one plays | `playLecture` saves the old one's position and loads the new one; Now Playing shows it |
| Tap the bar | Now Playing shows the loaded lecture. A lecture whose audio failed loads again |
| Chevron | `router.back()` (or `router.replace('/')` when opened cold by a deep link). Playback continues |
| Android back | Handled by the stack, like the chevron |
| Event pill on Now Playing | Now Playing closes and `router.navigate` opens the event in the Events tab |
| Search result | Now Playing replaces Search, so closing it returns to the tab Search was opened from |
| Deep link `/player?slug=` | Now Playing. With nothing loaded, the linked lecture loads paused |
| Swipes on the bar or Now Playing | Nothing. No gestures in phase 1 |

The bar never introduces a lecture: rows and results always open Now Playing.

**No motion.** Phase 1 has no animation. Phase 2 may set the screen's native
`animation: 'slide_from_bottom'`; nothing may wait for it, and no shared value or gesture may
decide what is on screen. `player-rules.test.ts` enforces "no Reanimated, Gesture Handler or
PanResponder" in the player files.

## The website API

The website's read-only JSON API (`GET` only, no auth). Production base URL
`https://www.ulama-moris.org/api/v1`; the app reads `EXPO_PUBLIC_API_URL` from `.env`.

| Endpoint | Used for |
|---|---|
| `GET /lectures?page&limit&type&search` | Home list (`type` is `local`, `guest` or `islahi-majlis`; anything else is a 400), lecture search |
| `GET /lectures/{slug}` | Now Playing deep links, reminder taps. 404 when unknown |
| `GET /events?page&limit&search` | Events tab, event search |
| `GET /events/{slug}` | Event detail: `{ event, lectures }`, every lecture, not paged (at most 10). 404 when unknown |

What the app relies on:
- **Paging:** lists return `{ items, total, page, hasMore }`, page from 1. Stop on `hasMore`: past the last page `/lectures` reports `total: 0`. Pages are offset based, so a newly published item can make the next page repeat one; the join helpers drop repeats (by `id` for lectures, `slug` for events). Keep the same `limit` for every page of a list.
- **Search** matches titles only, ignoring case and accents.
- **Missing values are `null`** (the fetchers turn them into `undefined`), except `category`, always an array.
- **Dates** are recorded in Mauritius time (`+04:00`) and shown in Mauritius time, not the device's. Event date fields (`dateRange`, `day`, `month`, `year` …) arrive ready to display. Events are grouped by `year`, with `year: null` under a final "Other events".
- A lecture's `duration` is editor text for display; the real length comes from the player. A `null` `url` means there is nothing to play.
- **Errors** have the body `{ "error": "…" }`; read the status, the text is for logs only.
- Responses are `no-store`: no extra HTTP caching, the query cache is enough.

## Error and offline states

Each has a screenshot in `artboards/error-states/`; the built screens are the reference now.
Force any of them at `/dev/failures`.

- **Colour:** the semantic `danger` family (`bg-danger-subtle`, `text-danger-subtle-fg`, `danger` for lines and icons), `miniPlayer.errorFg` / `errorLine` on the mini player, `scrim` for the offline pop-up. Never a category colour, no separate red.
- **Copy** (`features/errors/error-copy.ts`): say what happened and what to do, never apologise ("Lectures didn’t load" + "Check your internet connection, then try again.").
- **Try again:** every list error has one. While retrying, the icon becomes a spinner, the label stays (the button keeps its width), it's `busy` and ignores taps. A second failure shows the same message: no second wording.
- **No retry loops:** retry on a tap, or once automatically when NetInfo reports the connection back.
- **Lists:** a failed first page replaces the rows with an error card (header, search and chips stay usable). A failed next page keeps the loaded rows and swaps the "Loading more" footer for one shared retry footer (Home and Events). Search results use the same card, "Results didn’t load".
- **Audio:** a failed lecture keeps Now Playing's artwork and text, replaces the progress bar with an alert row and disables play and both skips. The mini player says "Didn’t load. Tap to open again." with a `danger` progress line. **No "Try again" in the players**, on purpose: opening the lecture again (its row, Continue listening, or the bar) reloads it from the saved position. It never reloads by itself, so sound never starts without a tap.
- **Offline sheet:** on launch and on return to the app, when NetInfo reports no connection. It blocks the app (no dismiss, Android back does nothing), is modal for screen readers, and closes once a check finds the connection.
- **Accessibility:** errors are announced (Android live region, iOS `announceForAccessibility`); disabled controls expose `disabled`.
- Known gap: `danger` on the dark-mode mini player bar is about 2.8:1, below the 3:1 floor for lines.

## Reminder notifications

Local notifications (expo-notifications) to bring the user back. **One type at a time**, and
continue listening wins:

| Reminder | When | Repeats | Tap |
|---|---|---|---|
| Continue listening | The last listened lecture is unfinished (past 5 s and under 95 %) | First 24 h after the last listen, then every 3 days, until it's finished. 10 booked ahead (about a month; iOS allows 64 pending). Times stay fixed from the last listen: on a rebuild, a reminder whose time has passed (or is under a minute away) is skipped, never moved to "now" | Opens Now Playing on it, at the saved position |
| Inactivity | Nothing unfinished, or every continue reminder has passed | Once, 3 days after the last use of the app; rebooked each visit | Opens the app |

- A notification can't run code when it fires, so the decision is made when booking: every rebuild cancels all `reminder-*` notifications and books the plan again. Fixed IDs (`reminder-continue-0…9`, `reminder-inactive`) mean no duplicates.
- **When it's rebuilt:** when the user leaves the app, and on a pause or finish while in the background (the lock screen may be the user's last action). Not on pauses while the app is open: one rebuild per visit, and no overlapping rebuilds from fast taps.
- Starting another lecture moves the continue reminders to it. Finishing it hands over to the inactivity reminder.
- Development builds use minutes instead of hours and days (`reminder-timings.ts`). Web has no reminders. Android needs a development build to check them.

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
  - `axe swipe` doesn't reach React Native's JS responders (Pressable); use `axe drag` for those.
  - Record motion with `simctl io recordVideo`.
- **Web stands in for Android:** use `playwright-cli` at 390 × 844.
