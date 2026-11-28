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
| Error and offline states | CONTEXT.md "Error and offline states", `docs/artboards/error-states/*.png`, and the switches at `/dev/failures` |
| Website API, reminder notifications | CONTEXT.md "The website API" and "Reminder notifications", then the code in `src/features/` |
| Audio playback, lock screen, background | AGENTS.md "Audio: expo-audio plays, Zustand remembers", the comments in `src/features/player/audio-engine.ts` and `setup-audio.ts`, then the Expo docs: https://docs.expo.dev/versions/latest/sdk/audio.md |
| Now Playing and the mini player | CONTEXT.md "Now Playing and the mini player", then AGENTS.md "Mini player and Now Playing" |

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
- Tabs use the JS navigator: `import { Tabs } from 'expo-router/js-tabs'` (the `Tabs` export from `expo-router` is deprecated in SDK 58), not `NativeTabs`, because the player sheet sits between the screens and the tab bar. The navigator draws no tab bar (`tabBar={renderNoTabBar}`): the layout draws `PlayerTabBar` (`features/player/player-tab-bar.tsx`) over the sheet. It picks the selected tab from `usePathname()` and navigates with `router.navigate`: another tab goes back to that tab's last screen, the selected tab goes to its first screen. The screens no longer get room for the tab bar from the navigator, so each tab screen adds `useTabBarHeight()` (plus `useMiniPlayerSpace()`) to its bottom padding.
- `unstable_settings` uses `anchor` (SDK 58). `initialRouteName` is deprecated.
- Every screen hides the native header and draws its own top bar, so every screen owns its top inset.
- **Now Playing is a sheet, not a screen.** The mini player and Now Playing are one sheet, drawn in `src/app/(tabs)/_layout.tsx` between the screens and the tab bar. Whether it is open lives in the store (`nowPlayingPresentation`, `'open'` / `'closed'`), written only by `features/player/open-now-playing.ts`. `/player` stays in the root stack (`animation: 'none'`) only as the entry for deep links and reminder taps: it loads the linked lecture paused if nothing is loaded, opens Now Playing and steps out of the way. Nothing in the app navigates to it. Android back is handled by the sheet (`BackHandler` while open).
- `src/app/+html.tsx` (web only) must render `headNodes` and `bodyNodes` from `useServerDocumentContext()`, or the page loads no JavaScript.
- Docs: https://docs.expo.dev/router/introduction.md

## Design system

Read [src/theme/README.md](src/theme/README.md) before adding or changing any colour, token or text style. It has the step-by-step recipes; [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) is the full reference.

- Style with NativeWind (v4.2.7, Tailwind 3) **semantic classes only**: `bg-bg`, `bg-surface-1`, `text-fg-muted`, `bg-primary` … Never a hex, never a primitive. `npm run check:theme` fails on raw colours in `src/app` and `src/components`.
- Colours a class can't reach (icon `color`, SVG fills, navigation) come from `useThemeColors()`; shadows from `useThemeShadows()`. Both read NativeWind's `useColorScheme`, never React Native's, so classes and JS always agree.
- Text: `<Text variant="h1">` from `@/components/ui/text`. Variants: `display`, `h1`, `h2`, `section`, `headingSm`, `title`, `body`, `bodySm`, `meta`, `caption`, `label`, `overline`. Default colour `text-fg`; pass `className` to change colour or weight (the component drops its own default so yours wins, because NativeWind resolves conflicts by stylesheet order, not className order). Use `tabular` for every time value.
- Manrope is loaded in the root layout before the splash hides. Use `font-manrope-*` classes, never `font-bold`.
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
- `/dev/failures` (development only) has switches that make one kind of request fail on purpose (first pages, next pages, search, event detail, lecture audio, no connection), so every error state can be seen in the real screens. A forced request fails like a lost connection. The switches reset on reload. It has no in-app link: open it by URL (web: `localhost:8081/dev/failures`; iOS in Expo Go: `xcrun simctl openurl booted "exp://127.0.0.1:8081/--/dev/failures"`).
- **`/dev/failures` is still in the release build.** Expo Router makes every file in `src/app/` a route, so it ships in the release bundle and only redirects to Home when `__DEV__` is false. Before the first release, remove it from production builds (for example by keeping it out of `src/app/` in release builds, or guarding it in a `src/app/dev/_layout.tsx`).

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
| Lecture pages, event pages, event detail, search results | TanStack Query | Server data from the website API (`/api/v1`) |
| Player queue, `currentIndex`, queue `source` | Zustand `player.store.ts` (not persisted) | The mini player, Now Playing and the list rows on every screen read it. Not persisted, so a launch shows no mini player |
| Whether the queue has ended (`hasQueueEnded`), the lecture whose audio didn't load (`failedLectureSlug`, read through `selectHasAudioFailed`, cleared by every load) | Zustand `player.store.ts` | The mini player's visibility is calculated from these and the loaded lecture. Whether Now Playing is open is not state: it is the navigation stack |
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

### Mini player and Now Playing

- **One sheet that morphs.** `NowPlayingPanel` (`features/player/now-playing-panel.tsx`) is one `@gorhom/bottom-sheet` with two snap points: the bar (index 0, `tabBarHeight + MINI_PLAYER_GAP_ABOVE_TAB_BAR + barHeight`) and the whole screen (index 1); −1 is gone, below the screen. Inside it a card (an `Animated.View`) grows from the bar into the full player. It holds `NowPlayingView` (laid out once at full-screen size, clipped by the card, fading in), the bar's row `MiniPlayerBar` (`mini-player-bar.tsx`, fading out) and one `CoverArt` that flies between the bar's empty 44 px thumbnail slot and Now Playing's empty artwork slot (both measured, never re-laid out: it is always laid out at `size.artwork` and moved with translate and scale). The tab bar slides down as the player grows. Based on the animation lab example `expo-apple-music-bottom-sheet`.
- **One driver.** The sheet's `animatedIndex` (`sheetIndex`, created in the tabs layout and shared with `PlayerTabBar`) drives every visual, plus its `animatedPosition` for the card's height (pinned to the screen's bottom). Every interpolation is in `use-player-morph.ts`, which doesn't import gorhom.
- **The store holds intent; the sheet follows it.** `nowPlayingPresentation` is the only "is it open". `open-now-playing.ts` is its only writer (`openNowPlaying`, `openNowPlayingForLoadedLecture`, `closeNowPlaying`, `handleSheetSettled`, `dismissMiniPlayer`, `openEventFromNowPlaying`, `showNowPlayingFromDeepLink`): store first, then the audio. The sheet goes to `'full'` when open, `'bar'` when a lecture is active, `'gone'` otherwise (`snapToIndex` / `close()`).
- **Drags reach the store through the resting check.** gorhom's own release decides where a drag ends (nearer snap point, a flick wins). A `useAnimatedReaction` on the index reports only when the sheet comes to rest at an end (≥ 0.99 full, ≈ 0 bar, ≤ −0.99 gone) and the end changed, and calls `handleSheetSettled`, which writes only if the store says otherwise. A `headingTo` ref stops the store's echo from restarting a spring. **No gorhom callbacks** (`onAnimate`, `onChange`, `onClose`): they fire late, or not at all when a spring is interrupted. The sheet has `accessible={false}` (gorhom's default makes it one element for VoiceOver).
- **A row tap with nothing loaded** (the sheet is gone): the sheet jumps to the bar without animating (`SHEET_JUMP`), and the resting check starts the growth into the full player once it has landed.
- **Never change `enableContentPanningGesture`** (it stays `{true}`): gorhom swaps the view around its content when it changes, remounting the player.
- **The bar's tap is a Gesture Handler tap** (`useTapGesture`, 10 pt `maxDistance`) on a view drawn under the bar's row, not a `Pressable`, so it never fights the sheet's drag. `MiniPlayer` lets touches through everywhere but play/pause (its "Open player" view is `pointerEvents="none"` and only for screen readers: `activate` opens, `dismiss` stops). While Now Playing is open the row (which sits over the top of the full player) takes no touches.
- **Swiping the bar down stops playback.** The sheet has `enablePanDownToClose`: a drag or flick that leaves it below the screen (index −1) reaches the resting check as `'gone'`, and `handleSheetSettled('gone')` calls `dismissMiniPlayer` (stop and clear). If the drag started on Now Playing (presentation `'open'`), it only closes Now Playing and the sheet springs back to the bar. Screen readers use the bar's "Stop and close player" action. The bar has play/pause only (back / forward 15 are on Now Playing and the lock screen). Nothing on Now Playing can stop playback.
- `selectIsMiniPlayerVisible`: a lecture is active (loaded, queue not ended) **and** Now Playing is closed. Never from `isPlaying`. While Now Playing is open the bar's row is hidden from screen readers and untouchable, `BehindNowPlaying` hides the tab screens, and `PlayerTabBar` hides itself.
- A Search result closes Search first (`leaveSearchFirst`: `router.back()`), then the bar grows into Now Playing over the tab Search was opened from. The event pill closes Now Playing and `router.navigate` opens the event in the Events tab. It uses the lecture's `eventSlug`, a MOCK field next to `event` (the title) until the API returns the link.
- Every motion number is in `features/player/player-motion-config.ts` (the spring is the example's: heavily damped, no overshoot, through `useBottomSheetSpringConfigs` so Android matches iOS). Tune there only.
- Rules (`player-rules.test.ts`): only the coordinator writes the presentation; nothing navigates to `/player`; only `now-playing-panel.tsx` imports gorhom, with no callbacks, `accessible={false}` and `enableContentPanningGesture={true}` only; `use-player-morph.ts` doesn't import gorhom; Now Playing has no path to `stopAndClear`; `.get()` / `.set()`, never `.value`; `scheduleOnRN`, never `runOnJS`; no `PanResponder`.
- Tests: gorhom is mocked in `jest.setup.ts` (it renders the sheet's children); `test-utils/reanimated-mock.ts` finishes animations at once and its `useAnimatedReaction` never fires; gestures aren't simulated. Drags and springs are checked on a device; the decisions live in the coordinator, which is tested.
- In development, gorhom logs Reanimated's "Dependencies should only be used on the web" warning: it passes a dependency list to `useAnimatedReaction` when given `animatedIndex` / `animatedPosition`. Library code, harmless; don't chase it.
- Known limits: on Android a slow drag down that starts near the top of the full player springs back (accepted, from the example's setup; see its `KNOWN_ISSUES.md`). The keyboard can't open the bar on web (its tap is a gesture; screen readers use the `activate` action).
- The bar never introduces a lecture: rows and search results open Now Playing.
- A launch shows no bar (the queue isn't persisted). Continue listening (`ContinueListeningSection`) shows `lastPlayedSlug`: hidden until something plays, switched as soon as a lecture starts, hidden again when that lecture finishes (`markFinished`). Its progress follows the live position while its lecture plays, the saved resume point otherwise, and its play button resumes from there.
- Components that read the player stores live in `src/features/player/*.tsx` (`mini-player-bar`, `now-playing-panel`, `now-playing-view`, `now-playing-controls`, `player-tab-bar` …), because `src/components` never reads stores.
- Not yet checked: Android (phone), the largest text size, VoiceOver/TalkBack walkthroughs on a device.
- Expo Go (iOS simulator): a `/player?slug=…` link opened while the app is closed lands on Home; the same link while the app runs works (it opens Now Playing). Check reminder taps on a cold start in a development build.

### Reminder notifications

The rules are in CONTEXT.md "Reminder notifications". One type at a time: a continue listening series (10 booked ahead) for the last unfinished lecture, otherwise one inactivity reminder.

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
- **The fetchers read the website API** (`/api/v1`, summarised in CONTEXT.md "The website API") through `getJson` in `features/api/api-client.ts`. The base URL is `EXPO_PUBLIC_API_URL` in `.env` (the local website, `http://localhost:3000/api/v1`, until it's deployed). Restart Metro after changing it.
- Each fetcher turns the API's JSON into the app's types (`lecture.types.ts`, `event.types.ts`): a value the API sends as `null` becomes `undefined`, so it can go straight to an optional prop. A 404 for one lecture or event returns `null`; any other failure throws, so the query reports an error.
- Lists are paged by the API (page from 1, 10 per page). Stop on `hasMore`, never on `total` (it reads 0 past the last page). Join pages with `joinLecturePages` / `joinEventPages` / `joinSearchPages`, which drop an item a later page repeats.
- Home always sends a series (`type`); there is no "all lectures" request. Search sends none, so it searches every series.
- **First loads use Suspense.** Home, Events and Event detail read `useSuspenseInfiniteQuery` / `useSuspenseQuery` inside `QueryBoundary` (`features/api/query-boundary.tsx`): `loading` is the screen's skeleton, `renderError(retry)` its error card ("Try again" resets the boundary, so the skeleton shows while it reloads). Never branch on `isPending` for a skeleton. Next pages can't suspend: `isFetchingNextPage` / `isFetchNextPageError` stay in the list's footer. The boundary shows its error only for `ApiError` and fetch's `TypeError` (anything else is rethrown), and keeps those two out of LogBox by their message (`ApiError` messages start with `API <status>:`). Event detail opened from the list draws its real header from the list's cache (`useEventSummaryFromList`) and only skeletons the rows.
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

- Bottom sheets: default to `BottomSheet` from `@expo/ui` (already installed; see the `expo-ui` skill). Don't add `@gorhom/bottom-sheet` or hand-roll one with Reanimated without a stated reason. The one exception is the player sheet (`now-playing-panel.tsx`): the mini player that grows into Now Playing under the finger, between the screens and the tab bar, driving the morph from its live index, which `@expo/ui` and route presentations can't do.
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
- Exception: anything that must cover the whole drawing area, edge to edge, takes its size from `useSafeAreaFrame()`. On Android, React Native's `window` leaves out the status and navigation bars unless its edge-to-edge flag is on (off in Expo Go), so a full-screen view sized from it stops short and shows what's behind under the navigation buttons. Not on web: Expo Router's web safe-area provider always reports a 0 × 0 frame (and zero insets), so web uses `useWindowDimensions()`.
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
- AXe `swipe` doesn't deliver touch moves to React Native's JS responders (PanResponder, Pressable). Use `axe drag` for drags on JS-handled views. Gesture Handler gestures (the mini player and Now Playing) do receive `axe swipe`; for a quick flick pass `--delta 3` to `--delta 6`, or AXe sends too few touch points and the pan never activates. Each AXe command takes about a second before it touches, so don't read that as app latency. `axe type` didn't reach the Search field; tap a recent search instead.
- Screenshots take about a second, too slow for motion. Record with `xcrun simctl io booted recordVideo <file>.mov` (stop with `kill -INT`), then look at frames tiled with `ffmpeg -i <file>.mov -vf "fps=6,scale=180:-1,tile=10x6" -frames:v 1 sheet.png`.
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