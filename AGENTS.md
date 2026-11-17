This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
npm run check:theme         # colour parity across the theme files + no raw colours in UI code
npm test                    # unit and component tests (Jest + React Native Testing Library)
npm run test:watch          # the same, re-running on save
```

Run lint, typecheck, `npm run check:theme` and `npm test` before declaring any task done.

## Where to look

Start with [docs/CONTEXT.md](docs/CONTEXT.md): how the app works, what was decided, what's still open. Then, by task:

| Task | Read |
|---|---|
| Colours, tokens, type, spacing, shadows, any visual style | [src/theme/README.md](src/theme/README.md) (recipes), then [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) (full reference) |
| Changing a screen's layout | Its design screenshot (the table in CONTEXT.md "Design screenshots") and the existing code |
| Error and offline states | [docs/ERROR-STATES.md](docs/ERROR-STATES.md), `docs/artboards/error-states/*.png`, and the switches at `/dev/failures` |
| Audio playback, lock screen, background | AGENTS.md "Audio: expo-audio plays, Zustand remembers", the comments in `src/features/player/audio-engine.ts` and `setup-audio.ts`, then the Expo docs: https://docs.expo.dev/versions/latest/sdk/audio.md |
| Player motion | CONTEXT.md "Motion", then [docs/Audio-Player-Animations.md](docs/Audio-Player-Animations.md) |

Code comments never cite a doc. Docs change; a comment states the fact it needs.

## Project structure

The rule: **`components/` renders, `features/` owns state, data and logic.** Target tree (create a folder only when the stage that needs it starts):

```
src/
├── app/                 # Routes only (Expo Router). No components or logic defined here
├── components/          # Everything that renders UI
│   ├── ui/              # Generic building blocks with no domain knowledge (text.tsx, …)
│   ├── icons/           # Custom SVG icons (Skip15Icon, LogoBadge). lucide covers the rest
│   ├── artwork/         # Rosette illustration (fixed `palette`)
│   ├── HeroCard/        # Shared emphasis card
│   ├── MiniPlayer/      # index.tsx + tokens.ts (paths fixed by the docs)
│   ├── TabBar/          # index.tsx + tokens.ts
│   ├── Skeleton/        # index.tsx + tokens.ts
│   └── Search/          # search UI + tokens.ts
├── features/            # State, data and pure logic per domain. No JSX screens
│   ├── player/          # audio-engine.ts, player.store.ts, listening-history.store.ts, player-status-bridge.tsx
│   ├── api/             # api-client.ts: getJson, ApiError, the base URL from EXPO_PUBLIC_API_URL
│   ├── lectures/        # lecture.types.ts, lecture-series.ts, lectures.api.ts, lectures.queries.ts
│   ├── events/          # event.types.ts, events.api.ts, events.queries.ts, group-by-year.ts
│   ├── search/          # scope.ts, match.ts, search.queries.ts, recent-searches.store.ts
│   └── reminders/       # reminder-plan.ts (decisions), reminder-scheduler.ts (booking), reschedule-reminders.ts, reminders-bridge.tsx
├── providers/           # app-providers.tsx (QueryClientProvider …), rendered once by app/_layout.tsx
├── data/                # sample.ts + mock-ui.ts: mock data for /dev/components only
├── hooks/               # Cross-feature hooks only
├── theme/               # primitives.ts, tokens.ts, navigation-theme.ts, README.md
├── utils/               # format-time.ts and other pure helpers
└── global.css           # NativeWind semantic tokens
```

- A component folder is PascalCase (`MiniPlayer/`) and holds `index.tsx`, plus `tokens.ts` only when it has component tokens. Small generic pieces in `ui/` are single kebab-case files.
- A component used by only one screen still goes in `components/`, not `app/`.
- `features/*` never imports from `app/`. `components/*` may read hooks from `features/*`.
- Import through the `@/` alias. No barrel `index.ts` re-export files (they hurt tree-shaking).

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Tabs use the JS navigator: `import { Tabs } from 'expo-router/js-tabs'` (the `Tabs` export from `expo-router` is deprecated in SDK 58), not `NativeTabs`, because the mini player must stack above the tab bar. The custom tab bar receives `{ state, emitter, navigateToTab }`.
- `unstable_settings` uses `anchor` (SDK 58). `initialRouteName` is deprecated.
- Every screen hides the native header and draws its own top bar, so every screen owns its top inset.
- **Now Playing is not a route.** It is an overlay in `src/app/(tabs)/_layout.tsx` (`PlayerSurface`), drawn over the tabs together with the mini player, because the bar has to morph into Now Playing and the tabs behind have to shrink and dim (`TuckedContent`); a native modal can't do either. `src/app/player.tsx` exists only for deep links (`/player?slug=…`): it loads the lecture, calls `showNowPlayingFromDeepLink()` and steps back. Nothing in the app navigates to `/player`.
- `src/app/+html.tsx` (web only) must render `headNodes` and `bodyNodes` from `useServerDocumentContext()`, or the page loads no JavaScript.
- Docs: https://docs.expo.dev/router/introduction.md

## Design system

Read [src/theme/README.md](src/theme/README.md) before adding or changing any colour, token or text style. It has the step-by-step recipes; [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) is the full reference.

- Style with NativeWind (v4.2.7, Tailwind 3) **semantic classes only**: `bg-bg`, `bg-surface-1`, `text-fg-muted`, `bg-primary` … Never a hex, never a primitive. `npm run check:theme` fails on raw colours in `src/app` and `src/components`.
- Colours a class can't reach (icon `color`, SVG fills, navigation) come from `useThemeColors()`; shadows from `useThemeShadows()`. Both read NativeWind's `useColorScheme`, never React Native's, so classes and JS always agree.
- Text: `<Text variant="h1">` from `@/components/ui/text`. Variants: `display`, `h1`, `h2`, `section`, `headingSm`, `title`, `body`, `bodySm`, `meta`, `caption`, `label`, `overline`. Default colour `text-fg`; pass `className` to change colour or weight (the component drops its own default so yours wins, because NativeWind resolves conflicts by stylesheet order, not className order). Use `tabular` for every time value.
- Manrope is loaded in the root layout before the splash hides. Use `font-manrope-*` classes, never `font-bold`.
- `/dev/tokens` (development only) shows every token in the current theme. It and `/dev/components` have no in-app link: open them by URL (web: `localhost:8081/dev/components`; iOS in Expo Go: `xcrun simctl openurl booted "exp://127.0.0.1:8081/--/dev/components"`).
- `metro.config.js` sets NativeWind's `inlineRem: 16`. Tailwind's spacing scale is in rem, and NativeWind's native default is 14, which made every spacing class 12% smaller on iOS/Android than on web and in the designs (`min-h-10` came out 35, not 40). Don't remove it.
- Text scaling: the `Text` component caps `display`, `h1` and `h2` at 1.6× (they broke words mid-word at the largest accessibility sizes). Body text scales without limit. The mini player and the tab bar labels cap at 1.3×.

## Components

- Generic primitives with no domain knowledge are kebab-case files in `src/components/ui/` (`icon-button.tsx`, `pill.tsx`, `play-pause-button.tsx` …). Custom SVG icons live in `components/icons/`, illustrations in `components/artwork/`. Composites (`HeroCard`, `LectureRow`, `MiniPlayer` …) have PascalCase folders. Screens only put these together and connect them.
- **Components are static presentation.** They render what their props say: visual state is a prop (`state: 'idle' | 'active-paused' | 'active-playing'`, `selected`), never internal `useState`. No navigation, data fetching, stores or audio inside `src/components`.
- Every future control is already a `Pressable` with `accessibilityRole="button"` and its final `accessibilityLabel`, and takes an optional `onPress?`. Screens wire behaviour by passing handlers; they don't change the component.
- Props take **display-ready strings** ("35:48", "31 Oct", "2h 34m", "Masjid Muswalla, Highlands"). Formatting happens in the screen with the helpers in `src/utils/` (`formatVenue`, and the time helpers in `format-time.ts`).
- Category colours are chosen by the caller and passed as `category: Category`: `catAt(index)` by position, `catForTopic(topic)` by topic (worked out from the topic's letters, so it needs no list).
- Icons: `<Icon icon={…} color="fgMuted" />` with a semantic colour name. Import lucide icons one by one (`import Play from 'lucide-react-native/icons/play'`), never from the package root, which bundles every icon.
- `react-native-svg` on web passes unknown props to the DOM, so don't put `accessible` / `importantForAccessibility` on `<Svg>`; the button around an icon carries the label.
- `/dev/components` (development only) shows every component in every state with the mock data in `src/data/mock-ui.ts`, plus a Home screen mock. Add new components there.
- `/dev/failures` (development only) has switches that make one kind of request fail on purpose (first pages, next pages, search, event detail, lecture audio, no connection), so every error state can be seen in the real screens. A forced request fails like a lost connection. The switches reset on reload.
- **The `/dev` pages are still in the release build.** Expo Router makes every file in `src/app/` a route, so `/dev/tokens`, `/dev/components` and `/dev/failures` ship in the release bundle, together with the mock data they use (`src/data/sample.ts`, `mock-ui.ts`). Each one only redirects to Home when `__DEV__` is false. Before the first release, remove them from production builds, for bundle size and tidiness (for example by keeping them out of `src/app/` in release builds, or guarding them all in one `src/app/dev/_layout.tsx`).

## State management

### Deciding where a piece of state lives

Ask these questions in order and stop at the first "yes":

1. **Can it be calculated from other state, props or query data?** → Don't store it. Calculate it during render. Examples: whether the mini player is visible (`selectIsMiniPlayerVisible`), "N min left", the "81 lectures" count.
2. **Does it come from the server (the website API)?** → TanStack Query (`useQuery` / `useInfiniteQuery`). Load the `expo-data-fetching` skill.
3. **Is it used by only one component (and the children it passes props to), and is it fine to lose it when the screen closes?** → `useState` in that component.
4. **Is it read or changed on more than one screen, updated often, or must it survive an app restart?** → A Zustand store.
5. **Is it a value that rarely changes, set once near the root, or one that needs a different value per subtree?** → React Context.

If you can't choose between `useState` and Zustand, start with `useState`. Move it to a store when a second screen needs it. Don't create a store "just in case".

### What this app uses

| State | Owner | Why |
|---|---|---|
| Light/dark theme | NativeWind `dark:` classes + `useColorScheme()`. JS colour values come from `useThemeColors()` (`src/theme/tokens.ts`) | Set by the OS. No ThemeContext and no theme store |
| Lecture pages, event pages, event detail, search results | TanStack Query | Server data from the website API (`docs/mobile-app-api.md`) |
| Player queue, `currentIndex`, queue `source` | Zustand `player.store.ts` (not persisted) | The mini player, Now Playing and the list rows on every screen read it. Not persisted, so a launch shows no mini player |
| Where Now Playing is in its motion (`nowPlayingPresentation`: `closed` / `miniLeaving` / `opening` / `open` / `closing`), whether the queue has ended (`hasQueueEnded`), the lecture whose audio didn't load (`failedLectureSlug`, read through `selectHasAudioFailed`, cleared by every load) | Zustand `player.store.ts`. `nowPlayingPresentation` is written only by `open-now-playing.ts` | The mini player's visibility is calculated from these and the loaded lecture |
| Player motion (`expand`, `enterY`, `miniDrop`, `surfaceOpacity`, `reducedMotion`, `surfaceGeometry`) | Reanimated shared values at module scope in `player-surface-motion.ts`. Never in Zustand, never in React state | Every frame is computed on the UI thread; React never renders per frame |
| Playback status (`isPlaying`, `positionSec`, `durationSec`, buffering) | Comes from expo-audio `useAudioPlayerStatus`, copied into `player.store.ts` by one bridge component | Many components subscribe to it, and it updates several times a second (see below) |
| Resume points `progressById`, the Continue listening lecture `lastPlayedSlug` | Zustand `listening-history.store.ts`, persisted to AsyncStorage | Must survive a restart. Kept apart from `player.store.ts` (see Zustand rules) |
| Recent searches per scope | Zustand `recent-searches.store.ts`, persisted | Must survive a restart. The `persist` middleware is simpler than writing your own load/save effects |
| Search input text, the selected Home filter chip, whether a sheet or menu is open | `useState` | Belongs to one screen |
| Scheduled reminder notifications | The OS (expo-notifications), rebuilt from `listening-history.store.ts` (`lastPlayedSlug`, `lastPlayedAt`) | A local notification can't run code when it fires, so the schedule is recalculated, never stored |
| Online/offline | NetInfo, read where it's needed: TanStack Query's `onlineManager` (app-providers), the offline sheet (`features/offline/offline-gate.tsx`) | It's already a subscription. Don't copy it into a store |

Not in the spec yet: signed-in user, bookmarks, language. Don't add stores or contexts for them until a spec asks for them. When it does, use the questions above. A signed-in user would most likely go in Zustand, with tokens in `expo-secure-store`. Bookmarks would go in a persisted Zustand store, or in TanStack Query if they sync with a server. Language would go in Context or a persisted store.

### Audio: expo-audio plays, Zustand remembers

- `expo-audio` is the audio engine. Never add `expo-av` (deprecated) or use `Audio.Sound`. Exactly one player, created by `getPlayer()` in `features/player/audio-engine.ts` on first use (not when the file loads: the web build also renders on the server, where expo-audio's web player can't be created). That file also exports the commands: `playLecture`, `toggle`, `pause`, `resume`, `seek`, `skip`, `playNext`, `stopAndClear`.
- A saved resume point is applied once the new lecture has loaded (`finishPendingResumeIfReady`, called by the bridge). Seeking an item that hasn't loaded isn't safe on iOS.
- Lock screen / notification: back and forward step 15 s through `seekBackwardIntervalSeconds` / `seekForwardIntervalSeconds` (expo-audio 58). No next/previous track.
- A failed lecture (`failCurrentLecture`): paused, marked in `failedLectureSlug`, and its lock-screen card removed (its play could only fail again); the next load puts the card back. What counts as failed: an expo-audio `error`, except on web while `isLoaded` (the browser refusing an untapped `play()`: it just stays paused). A connection lost mid-lecture is not detected (iOS sends no error, just waits; no timer, on purpose).
- The Zustand store holds data only. It never holds the player object, and it never calls `play()`, `pause()` or `seekTo()`. Components call the engine commands. The commands control the player and update the queue in the store.
- Status flows in one direction: expo-audio → `PlayerStatusBridge` → store. The bridge is mounted once in the root layout. It runs `useAudioPlayerStatus(player)`, writes `isPlaying` / `positionSec` / `durationSec` into the store, and starts the next lecture when `didJustFinish` is true. Never set `isPlaying` or `positionSec` from a button press. Call the engine and let the next status update show the change. This keeps the UI correct when the OS pauses audio (phone call, headphones unplugged, lock screen).
- Save to `progressById` (with `saveProgress`) at checkpoints only: on start, on pause, on seek, on track change, and every ~10 s while playing. Each change rewrites AsyncStorage, so don't save on every status update.

### Mini player and Now Playing (one surface)

- The bar and Now Playing are one surface, `PlayerSurface` (`features/player/player-surface*.tsx`), rendered once in `src/app/(tabs)/_layout.tsx` over `TuckedContent`. Layers, bottom to top: background (grows from the bar's rectangle to the window), full content, the cover (Now Playing's artwork *and* the bar's thumbnail), bar content. The bar floats above the tab bar; tab screen lists add `useMiniPlayerSpace()` to their bottom padding. Search is a root-stack screen, so it covers the surface without route checks.
- Whether the bar shows comes only from `selectIsMiniPlayerVisible`: a lecture is active (loaded, queue not ended) and `nowPlayingPresentation` is `closed`. Never from `isPlaying`.
- Every way into and out of Now Playing goes through `features/player/open-now-playing.ts` (`openNowPlaying`, `openNowPlayingForLoadedLecture`, `closeNowPlaying`, `dismissMiniPlayer`, the swipe callbacks): store → engine → motion. Each function starts with an early-return guard on the presentation. A switch to another lecture drops the bar first (`MINI_EXIT_MS`), then loads, then the sheet rises.
- Motion completion callbacks act only when `finished` is true **and** the presentation is still the one they expect, so a retargeted (interrupted) animation never overwrites the newer state.
- Now Playing's event pill calls `openEventFromNowPlaying(slug)`: Now Playing collapses into the bar while `router.navigate` opens the event in the Events tab underneath. It uses the lecture's `eventSlug`, a MOCK field next to `event` (the title) until the API returns the link.
- The bar never introduces a lecture: rows and search results open Now Playing.
- A launch shows no bar (the queue isn't persisted). Continue listening (`ContinueListeningSection`) shows `lastPlayedSlug`: hidden until something plays, switched as soon as a lecture starts, hidden again when that lecture finishes (`markFinished`). Its progress follows the live position while its lecture plays, the saved resume point otherwise, and its play button resumes from there.
- Swipe the bar down to dismiss: React Native `PanResponder` writing `miniDrop`, not Gesture Handler (its v3 detector received no touches on the floating bar on iOS). Screen readers get a "Stop and close player" action. The swipe down on Now Playing uses Gesture Handler's `usePanGesture` and runs on the UI thread.
- Android back while Now Playing is open collapses it (`BackHandler` in `PlayerSurface`). Web has no back handler.

### Player motion rules

- Every number lives in `features/player/player-motion-config.ts`. Tune there only.
- Shared values: `.get()` / `.set()` only, never `.value`. `scheduleOnRN` (from `react-native-worklets`), never `runOnJS`, and never inside a gesture's `onUpdate`. `player-rules.test.ts` checks these.
- `player-surface-motion.ts` never imports the store or the engine.
- NativeWind `className` doesn't reach Reanimated's `Animated.View` here: give Animated views plain `style`s (or put the classes on a plain child `View`).
- React Compiler + worklets: a worklet that *captures another inline worklet* (e.g. an animation callback written inline inside a gesture callback) crashes at load with "Cannot access '_temp' before initialization". Make the inner one a named module-level worklet declared above.
- Components that read the player stores live in `src/features/player/*.tsx` (`player-surface*`, `tucked-content`, `now-playing-controls` …), because `src/components` never reads stores.
- Geometry is three shared values (`windowSizeValue`, `miniRectValue`, `coverRectValue`), each written whole and read in worklets through `readSurfaceGeometry()`. Reanimated re-runs an animated style only when a shared value read *directly* in it changes, and the helper hides the three values. So a style that must follow a new geometry at rest (the background and the cover, when a browser window is resized while the bar shows) reads the values itself and passes them to `combineSurfaceGeometry()`. Never "read, change one field, write back" a shared object: on native a JS write reaches the UI thread later, so the read can be stale and erase a field (this put the bar's thumbnail at the top-left on iOS while web looked fine).
- `miniRect` comes from the floating bar's own `onLayout`. `coverRect` is calculated from the measured Now Playing body (the artwork is a centred square below the body's top), so the body must stay a direct child of the full layer's root. Never `measureInWindow`: it includes the entrance offset.
- The swipe range is how far the cover's centre travels to the thumbnail, so a point on the cover stays under the finger. Now Playing's body is a plain `View`, not a `ScrollView`, so it never competes with the swipe (the artwork shrinks to fit instead).
- Now Playing's content rides down with the sheet's top edge, and its morph fade is squared: otherwise text stays behind during a swipe or shows below the shrinking sheet.
- `AccessibilityInfo.sendAccessibilityEvent` doesn't exist on react-native-web: guard it with `Platform.OS`.
- Deliberately not built (Stage 12): the big play button morph, the progress sweep on entrance, the moonlight reveal, haptics.
- Not yet checked: a release-build performance pass (Perf Monitor; the motion must stay smooth while JS is busy), VoiceOver focus landing on the chevron, the largest text size, and on real devices Android back, TalkBack and 120 Hz. Seen once on iOS and not reproduced: the Home list behind ended up scrolled ~200 pt after opening and closing the player.

### Reminder notifications

Spec: `docs/Audio Player Reminder Notifications — Logic Guide.md`. One type at a time: a continue listening series (10 booked ahead) for the last unfinished lecture, otherwise one inactivity reminder.

- **Decisions and scheduling are separate.** `reminder-plan.ts` is pure: a snapshot goes in, a list of `PlannedReminder` (id, time, text, `openPath`) comes out. `reminder-scheduler.ts` cancels every `reminder-*` notification and books exactly that list; it has no rules. Change the rules in the plan only.
- Timings live in `reminder-timings.ts`. Development builds (`__DEV__`) use the quick set in minutes (first continue reminder 1 min after the last listen, then every 2 min; inactivity after 3 min); release builds use 24 h / 3 days.
- The schedule is rebuilt when the app goes to the background (`RemindersBridge`, mounted after `PlayerStatusBridge` so the resume point is saved first), and on a pause or finish while in the background (`rescheduleRemindersIfInBackground`, called by the player bridge). Never on every pause while the app is open. Rebuilds run one after another.
- `lastPlayedAt` moves only when the position moved: the bridge also saves when the app leaves, even while paused, and that must not count as a listen.
- A reminder that arrives while the app is open isn't shown (`hideRemindersWhileAppIsOpen`). A tap pushes `openPath` (`/player?slug=…` for continue listening).
- iOS asks for permission on the first play; Android relies on the audio engine's prompt for the same permission. Without permission the scheduler only cancels.
- Web has no reminders: `.web.ts(x)` versions do nothing, so expo-notifications never loads there.
- Expo Go (iOS) shows local notifications; Android needs a development build to be checked.

### Zustand rules

- One store per domain, in a file named `<domain>.store.ts` inside its feature folder. Export one hook, e.g. `usePlayerStore`.
- Always read through a selector: `usePlayerStore((state) => state.positionSec)`. Never call `usePlayerStore()` with no selector, because position updates several times a second and every subscriber would re-render. Only progress bars and time labels should subscribe to `positionSec`. When a selector returns an object or array, wrap it in `useShallow`.
- A store holds state and plain synchronous setters. Side effects (audio, network) live outside the store.
- Persist with `persist` + `createJSONStorage(() => AsyncStorage)`, and persist **whole stores only**. `persist` writes storage after every `set`, and `partialize` only chooses what is written, not when. So state that changes often (`positionSec`, 4 times a second) must live in a store that isn't persisted. That's why the player has two stores: `player.store.ts` (live, not persisted) and `listening-history.store.ts` (persisted, changes only at checkpoints).

### TanStack Query rules

- Fetchers are plain async functions in `features/<domain>/<domain>.api.ts`. Query hooks are in `<domain>.queries.ts`. Query keys are arrays that start with the domain: `['lectures', { series }]`.
- Never copy query results into Zustand or `useState`. The one exception is the player queue. When the user presses play, copy that list of lectures into the queue, because it's a snapshot the user chose, not a cache.
- Create one `QueryClient` at module scope in `src/providers/app-providers.tsx`. It connects `onlineManager` to NetInfo and `focusManager` to `AppState` (native only), because React Native doesn't do this automatically.
- **The fetchers read the website API** (`/api/v1`, documented in `docs/mobile-app-api.md`) through `getJson` in `features/api/api-client.ts`. The base URL is `EXPO_PUBLIC_API_URL` in `.env` (the local website, `http://localhost:3000/api/v1`, until it's deployed). Restart Metro after changing it.
- Each fetcher turns the API's JSON into the app's types (`lecture.types.ts`, `event.types.ts`): a value the API sends as `null` becomes `undefined`, so it can go straight to an optional prop. A 404 for one lecture or event returns `null`; any other failure throws, so the query reports an error.
- Lists are paged by the API (page from 1, 10 per page). Stop on `hasMore`, never on `total` (it reads 0 past the last page). Join pages with `joinLecturePages` / `joinEventPages` / `joinSearchPages`, which drop an item a later page repeats.
- Home always sends a series (`type`); there is no "all lectures" request. Search sends none, so it searches every series.
- Cache settings: `staleTime` 1 minute, `gcTime` 5 minutes, `retry: 1`, `networkMode: 'always'`, on the `QueryClient` only. `'always'` makes a request made offline fail (so the screen shows its "didn’t load" state) instead of pausing behind a skeleton; `refetchOnReconnect` then tries it once more when NetInfo reports the connection back. Don't add per-query settings, `initialData`, `placeholderData` or a persisted query cache.

### Context rules

- Use Context only for values that rarely change. Every consumer re-renders whenever the value changes.
- App-wide providers (`QueryClientProvider`, plus any others) are combined in `src/providers/app-providers.tsx`, which `src/app/_layout.tsx` renders once.


## Screens, Safe Areas & Device Fit

"Looks fine on my phone, broken on theirs" bugs come from here. Follow these rules for every screen, modal, and sheet.

Current app config (`app.json`): `orientation: "portrait"`, `userInterfaceStyle: "automatic"` (dark mode is live), `ios.supportsTablet` not set (iPad runs in phone-compat mode). Android is edge-to-edge (always on in current SDKs). Change these only on purpose, and update this section if you do.

### Safe areas

- Use `react-native-safe-area-context` only. Never import `SafeAreaView` from `react-native` (iOS-only, deprecated).
- Prefer `useSafeAreaInsets()` and apply the inset as padding on the specific edge that needs it. Use the library's `SafeAreaView` with an explicit `edges` prop (e.g. `edges={['bottom']}`) when a wrapper is simpler. Never leave `edges` defaulted to all four.
- **No double padding.** Before adding a top inset, check who already handles it:
  - Screen with a visible Stack/navigation header → the header handles the top. Don't add a top inset.
  - Screen inside a tab navigator → the tab bar handles the bottom. Don't add a bottom inset.
  - Header hidden (`headerShown: false`) or a custom header → you own the top inset.
- Scrollable screens: put the bottom inset in `contentContainerStyle` (`paddingBottom: insets.bottom + spacing`), not on the outer view, so content scrolls under the home indicator but the last item stays reachable. With a native header on iOS, prefer `contentInsetAdjustmentBehavior="automatic"` on `ScrollView`/`FlatList` instead of manual top padding.
- Fixed bottom elements (CTA buttons, footers, input bars) must add `insets.bottom` themselves. This is the most common breakage.
- Landscape (if ever enabled): `insets.left`/`insets.right` are non-zero on notched devices. Apply them to full-bleed rows.

### Android edge-to-edge

- Android draws behind the status bar and navigation bar, exactly like iOS. Every inset rule above applies to Android too. Never treat insets as an iOS-only concern, and never branch on `Platform.OS` to skip them.
- Bottom inset differs between gesture navigation (small) and three-button navigation (large). Don't hardcode a bottom offset; always read `insets.bottom`.
- Don't use `StatusBar.setBackgroundColor` / `translucent` or `navigationBar` color settings. They are no-ops under edge-to-edge. The color behind the status bar is whatever view is drawn there.

### Status bar

- Use `StatusBar` from `expo-status-bar`, never from `react-native`.
- Default to `style="auto"` so icons follow the theme. A screen with a dark hero image or a forced-dark background must set `style="light"` explicitly (and the reverse for forced-light), or the icons become invisible.

### Bottom sheets, modals & overlays

These render outside the normal screen tree and do **not** inherit any padding from it. Every sheet/modal owns its own insets.

- Bottom sheets: default to `BottomSheet` from `@expo/ui` (already installed; see the `expo-ui` skill). Don't add `@gorhom/bottom-sheet` or hand-roll one with Reanimated without a stated reason.
- For a sheet presented as a route, use Expo Router's `presentation: 'formSheet'` / `'modal'` (see the `expo-router` skill) instead of a custom overlay.
- Sheet/modal content must add `paddingBottom: insets.bottom` (plus normal spacing) so the last button clears the home indicator and the Android navigation bar. Test with three-button Android navigation; it's where sheets collide most.
- Full-screen modals (`presentation: 'fullScreenModal'` or RN `Modal`) need the top inset too, because no header covers the notch. RN `Modal` on Android also needs `statusBarTranslucent` and `navigationBarTranslucent` so it draws edge-to-edge like the rest of the app.
- Sheets containing inputs must handle the keyboard (see below). Check the input stays visible when the keyboard opens on both platforms.
- Toasts/snackbars anchored to the bottom: offset by `insets.bottom`. Anchored to the top: offset by `insets.top`.

### Keyboard

- Any screen or sheet with a text input must keep the focused input and its submit button visible with the keyboard open on both iOS and Android.
- `KeyboardAvoidingView`: `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` is the starting point. If it isn't enough under Android edge-to-edge, install `react-native-keyboard-controller` (via `npx expo install`; needs a dev build) rather than stacking workarounds.
- Forms in a `ScrollView`: set `keyboardShouldPersistTaps="handled"` so tapping a button doesn't just dismiss the keyboard.

### Sizes, dimensions & orientation

- Layout with Flexbox (`flex: 1`, `gap`, percentages). No hardcoded screen-sized widths/heights. Fixed sizes are fine only for small things (icons, avatars, hit areas).
- Use `useWindowDimensions()` in components, never `Dimensions.get()`. The hook updates on rotation, split screen and foldables; `Dimensions.get()` is a one-time snapshot. Use `window` dimensions, not `screen`, for layout (they differ on Android by the system bars).
- Exception: anything that must cover the whole drawing area, edge to edge (the player surface), takes its size from `useSafeAreaFrame()`. On Android, React Native's `window` leaves out the status and navigation bars unless its edge-to-edge flag is on (off in Expo Go), so a full-screen sheet sized from it stops short and shows what's behind under the navigation buttons. Not on web: Expo Router's web safe-area provider always reports a 0 × 0 frame (and zero insets), so web uses `useWindowDimensions()` (see `useDrawingAreaSize` in `player-surface.tsx`).
- Content on wide screens (Android tablets/foldables, and iPad if `supportsTablet` is ever enabled): wrap screen content in a centered container with a `maxWidth` (~600) so it doesn't stretch.
- Orientation is locked to portrait. If one screen ever needs landscape, use `expo-screen-orientation` to unlock it on that screen and re-lock on leave, and make that screen's layout react to `useWindowDimensions()`.

### Text & font scaling

- Never set `allowFontScaling={false}`. It breaks accessibility.
- Design containers to grow with text: use `minHeight` and padding, not fixed `height`, on buttons, tab items, cards and list rows. Allow text to wrap (or `numberOfLines` with a sensible limit) instead of overflowing.
- Where layout genuinely can't grow (e.g. a tab bar label), cap with `maxFontSizeMultiplier` (~1.3–1.5) on that `Text` only.

### Dark mode

- `userInterfaceStyle` is `automatic`, so every screen must work in both themes. Take colors from the theme (semantic NativeWind classes, `useThemeColors()` from `src/theme/tokens.ts`, the `Text` component). Never hardcode `#fff`/`#000` text or backgrounds.
- Every screen, sheet and modal needs an explicit themed background. Don't rely on the default.
- Native elements (date pickers, keyboard, alerts, `@expo/ui` components) follow the system theme. Check they read well against your themed background.

### Splash screen & icons

- Splash is configured via the `expo-splash-screen` plugin in `app.json`. Keep the image a centered, padded mark (don't fill the canvas); devices crop differently.
- Android adaptive icon: keep the foreground artwork inside the central safe zone (~66% of the canvas) so circle and squircle masks don't clip it.

### Verifying

- Edge-to-edge, orientation, status bar config and splash can differ in Expo Go. Verify screen-fit work in a development build.
- Before declaring a UI task done, check ios simulator is working fine. we dont have android simulator. use the web version as a replacement for android
- iOS: `npx expo start --ios` installs Expo Go on the booted simulator and opens the app (every native module in use so far ships in Expo Go). Drive it with **AXe** (`axe screenshot | describe-ui | tap | swipe --udid <id>`). Notes:
  - The first `axe describe-ui` after launch can time out while it sets up; run it again.
  - A plain `axe tap` often doesn't fire a React Native `Pressable` (iOS 27, AXe 1.8). Press with `axe touch -x <x> -y <y> --down --up --delay 0.15` instead. Open Expo Go with `?__expo_disable_fab=1&__expo_disable_onboarding=1`, or its gear button covers the top-right controls.
  - `axe tap --label` refuses a label that matches several elements. The Home list repeats the sample lectures to reach 81 rows, so "Play {title}" labels repeat: tap those by coordinates (`-x/-y`) taken from `describe-ui`.
  - After `xcrun simctl ui booted content_size …`, terminate and reopen Expo Go (`xcrun simctl terminate booted host.exp.Exponent`); the running app doesn't pick up the new size.
  - In Expo Go, deep links are `exp://127.0.0.1:8081/--/<path>`. The app's own `ulamamoris://` scheme only works in a development build.
- Audio in the iOS simulator: this Mac's network goes through Netskope, which re-signs HTTPS. The simulator must trust its root certificate or every lecture fails with "The certificate for this server is invalid": `xcrun simctl keychain booted add-root-cert ~/Desktop/caadmin.netskope.com.cer` (done once per simulator; `xcrun simctl keychain booted reset` undoes it).
- AXe `swipe` doesn't deliver touch moves to React Native's JS responders (PanResponder, Pressable). Use `axe drag` for drags on JS-handled views. Gesture Handler gestures (Now Playing's swipe) do receive `axe swipe`.
- Screenshots take about a second, too slow for motion. Record with `xcrun simctl io booted recordVideo <file>.mov` (stop with `kill -INT`), then look at frames tiled with `ffmpeg -i <file>.mov -vf "fps=6,scale=180:-1,tile=10x6" -frames:v 1 sheet.png`.
- Player motion unit tests can't check timing: the test Reanimated stand-in finishes every animation at once. Check motion on a device or recording.
- Run Metro without `CI=1` while testing: with it, Metro doesn't watch files and edits never reach the app.
- Web: drive `localhost:8081` with `playwright-cli` at 390 × 844. React Native Web renders the screen in an inner scroll container, so full-page screenshots need the viewport made taller or the container scrolled.
- Known web-dev-only warning: "Can't perform a React state update on a component that hasn't mounted yet", from NativeWind's `useColorScheme` (react-native-css-interop). It fires only when the colour scheme changes at runtime (e.g. `emulateMedia({ colorScheme: 'dark' })` in a test) while a lazily loaded route is rendering. Without a theme switch it doesn't appear, and iOS never shows it. Not caused by app code; don't chase it.
- Sticky headers (`SectionList`): put the top safe-area inset on the screen container, not in `contentContainerStyle`. Sticky headers pin to the top of the list, and would otherwise hide under the status bar.

## Testing

- Run tests with `npm test`, not bare `npx jest`. The script sets `TZ=America/Los_Angeles`, far from the data's `+04:00`, so a date helper that goes through `new Date(isoString)` shows the wrong day and fails. A guard test in `format-time.test.ts` fails if the time zone isn't set.
- Tests go in a `__tests__` folder next to the code they test (`src/utils/__tests__/format-time.test.ts`). **Never inside `src/app/`**: every file there becomes a route.
- Shared helpers live in `src/test-utils/`: `renderWithProviders` (a new `QueryClient` per test plus `SafeAreaProvider`) and `fixtures.ts` (hand-written edge cases). Never import them from app code.
- RNTL 14 is async: `await` every `render`, `renderHook`, `fireEvent` and `act`. Query by role and accessibility label (`getByRole('button', { name: 'Play …' })`), the way VoiceOver finds things. That way the tests also enforce the labels.
- Test behaviour and text, not class names. No snapshot tests.
- A `console.error` or `console.warn` during a test fails it (`jest.setup.ts`). Fix the cause; don't silence it.
- Add a mock to `jest.setup.ts` only when a test fails without it, with a comment saying why.
- `package.json` maps `lucide-react-native/icons/*` to lucide's CommonJS build (jest-expo would otherwise load the `.mjs` files, which Jest can't run) and maps `@/assets/*` to `assets/` (the general `@/*` → `src/` rule would catch it first).
- A new component goes in the light/dark guard list in `src/components/__tests__/theme-guard.test.tsx`.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md