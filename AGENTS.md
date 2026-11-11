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
```

Run lint, typecheck and `npm run check:theme` before declaring any task done.

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
│   ├── player/          # audio-engine.ts, player.store.ts, player-status-bridge.tsx
│   ├── lectures/        # lectures.api.ts, lectures.queries.ts
│   ├── events/          # events.api.ts, events.queries.ts, group-by-year.ts
│   └── search/          # scope.ts, match.ts, search.queries.ts, recent-searches.store.ts
├── providers/           # app-providers.tsx (QueryClientProvider …), rendered once by app/_layout.tsx
├── data/                # sample.ts (API-shaped static data) + mock-ui.ts
├── hooks/               # Cross-feature hooks only
├── theme/               # primitives.ts, tokens.ts, navigation-theme.ts, README.md
├── utils/               # format-time.ts and other pure helpers
└── global.css           # NativeWind semantic tokens
```

- A component folder is PascalCase (`MiniPlayer/`) and holds `index.tsx`, plus `tokens.ts` only when it has component tokens. Small generic pieces in `ui/` are single kebab-case files.
- A component used by only one screen still goes in `components/`, not `app/`.
- `features/*` never imports from `app/`. `components/*` may read hooks from `features/*`.
- Import through the `@/` alias. No barrel `index.ts` re-export files (they hurt tree-shaking).
- `components/PlaceholderScreen/` is temporary Stage 1 scaffolding. Each screen stage replaces its placeholder; delete the folder once no route imports it.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Tabs use the JS navigator: `import { Tabs } from 'expo-router/js-tabs'` (the `Tabs` export from `expo-router` is deprecated in SDK 58), not `NativeTabs`, because the mini player must stack above the tab bar. The custom tab bar receives `{ state, emitter, navigateToTab }`.
- `unstable_settings` uses `anchor` (SDK 58). `initialRouteName` is deprecated.
- Every screen hides the native header and draws its own top bar, so every screen owns its top inset.
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
- Props take **display-ready strings** ("35:48", "31 Oct", "2h 34m", "Masjid Muswalla, Highlands"). Formatting happens in the screen with the helpers in `src/utils/` (`formatVenue`, and the time helpers in HANDOFF §4.7).
- Category colours are chosen by the caller and passed as `category: Category`: `catAt(index)` by position, `catForTopic(topic, topicOrder)` by topic.
- Icons: `<Icon icon={…} color="fgMuted" />` with a semantic colour name. Import lucide icons one by one (`import Play from 'lucide-react-native/icons/play'`), never from the package root, which bundles every icon.
- `react-native-svg` on web passes unknown props to the DOM, so don't put `accessible` / `importantForAccessibility` on `<Svg>`; the button around an icon carries the label.
- `/dev/components` (development only) shows every component in every state with the mock data in `src/data/mock-ui.ts`, plus a Home screen mock. Add new components there.

## State management

### Deciding where a piece of state lives

Ask these questions in order and stop at the first "yes":

1. **Can it be calculated from other state, props or query data?** → Don't store it. Calculate it during render. Examples: the Continue listening lecture (the most recent entry in `progressById`), "N min left", the "81 lectures" count.
2. **Does it come from the server, or from an API stub standing in for one?** → TanStack Query (`useQuery` / `useInfiniteQuery`). Load the `expo-data-fetching` skill.
3. **Is it used by only one component (and the children it passes props to), and is it fine to lose it when the screen closes?** → `useState` in that component.
4. **Is it read or changed on more than one screen, updated often, or must it survive an app restart?** → A Zustand store.
5. **Is it a value that rarely changes, set once near the root, or one that needs a different value per subtree?** → React Context.

If you can't choose between `useState` and Zustand, start with `useState`. Move it to a store when a second screen needs it. Don't create a store "just in case".

### What this app uses

| State | Owner | Why |
|---|---|---|
| Light/dark theme | NativeWind `dark:` classes + `useColorScheme()`. JS colour values come from `useThemeColors()` (`src/theme/tokens.ts`) | Set by the OS. No ThemeContext and no theme store |
| Lecture pages, event pages, event detail, search results | TanStack Query | Server data (static stubs today, real API later) |
| Player queue, `currentIndex`, queue `source` | Zustand `player.store.ts` | The mini player, Now Playing and the list rows on every screen read it |
| Playback status (`isPlaying`, `positionSec`, `durationSec`, buffering) | Comes from expo-audio `useAudioPlayerStatus`, copied into `player.store.ts` by one bridge component | Many components subscribe to it, and it updates several times a second (see below) |
| Resume points `progressById` | Zustand `player.store.ts`, persisted to AsyncStorage | Must survive a restart |
| Recent searches per scope | Zustand `recent-searches.store.ts`, persisted | Must survive a restart. The `persist` middleware is simpler than writing your own load/save effects |
| Search input text, the selected Home filter chip, whether a sheet or menu is open | `useState` | Belongs to one screen |
| Online/offline (error-states stage) | NetInfo's `useNetInfo()` where it's needed | It's already a subscription. Don't copy it into a store |

Not in the spec yet: signed-in user, bookmarks, language. Don't add stores or contexts for them until a spec asks for them. When it does, use the questions above. A signed-in user would most likely go in Zustand, with tokens in `expo-secure-store`. Bookmarks would go in a persisted Zustand store, or in TanStack Query if they sync with a server. Language would go in Context or a persisted store.

### Audio: expo-audio plays, Zustand remembers

- `expo-audio` is the audio engine. Follow [docs/expo-audio.md](docs/expo-audio.md). Create exactly one player with `createAudioPlayer()` at module scope in `features/player/audio-engine.ts`. That file also exports the commands: `playLecture`, `toggle`, `seek`, `skip`.
- The Zustand store holds data only. It never holds the player object, and it never calls `play()`, `pause()` or `seekTo()`. Components call the engine commands. The commands control the player and update the queue in the store.
- Status flows in one direction: expo-audio → `PlayerStatusBridge` → store. The bridge is mounted once in the root layout. It runs `useAudioPlayerStatus(player)`, writes `isPlaying` / `positionSec` / `durationSec` into the store, and starts the next lecture when `didJustFinish` is true. Never set `isPlaying` or `positionSec` from a button press. Call the engine and let the next status update show the change. This keeps the UI correct when the OS pauses audio (phone call, headphones unplugged, lock screen).
- Save to `progressById` at checkpoints only: on pause, on seek, on track change, and every ~10 s while playing. Each change rewrites AsyncStorage, so don't save on every status update.

### Zustand rules

- One store per domain, in a file named `<domain>.store.ts` inside its feature folder. Export one hook, e.g. `usePlayerStore`.
- Always read through a selector: `usePlayerStore((state) => state.positionSec)`. Never call `usePlayerStore()` with no selector, because position updates several times a second and every subscriber would re-render. Only progress bars and time labels should subscribe to `positionSec`. When a selector returns an object or array, wrap it in `useShallow`.
- A store holds state and plain synchronous setters. Side effects (audio, network) live outside the store.
- Persist with `persist` + `createJSONStorage(() => AsyncStorage)`. Use `partialize` to save only what must survive a restart (`progressById`, not `positionSec`).

### TanStack Query rules

- Fetchers are plain async functions in `features/<domain>/<domain>.api.ts`. Query hooks are in `<domain>.queries.ts`. Query keys are arrays that start with the domain: `['lectures', { series }]`.
- Never copy query results into Zustand or `useState`. The one exception is the player queue. When the user presses play, copy that list of lectures into the queue, because it's a snapshot the user chose, not a cache.
- Create one `QueryClient` at module scope in `src/providers/app-providers.tsx`. In the error-states stage, connect `onlineManager` to NetInfo and `focusManager` to `AppState`. React Native doesn't do this automatically.
- **For now the fetchers read the static data, and nothing is cached.** Each fetcher reads `src/data/sample.ts` directly and returns the requested page. There's no network call and no artificial delay. Set `defaultOptions.queries` to `{ staleTime: 0, gcTime: 0 }` on the `QueryClient`, so query data is dropped as soon as no screen uses it and every mount reads the stub again. Don't add per-query `staleTime`/`gcTime`, `initialData`, `placeholderData` or a persisted query cache. Choose caching settings when the real API replaces the stubs.

### Context rules

- Use Context only for values that rarely change. Every consumer re-renders whenever the value changes.
- App-wide providers (`QueryClientProvider`, plus any others) are combined in `src/providers/app-providers.tsx`, which `src/app/_layout.tsx` renders once.

Install these with `npx expo install zustand @tanstack/react-query @react-native-async-storage/async-storage` when the first stage that needs them starts. They're not installed yet.

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
  - `axe tap --label` refuses a label that matches several elements. The Home list repeats the sample lectures to reach 81 rows, so "Play {title}" labels repeat: tap those by coordinates (`-x/-y`) taken from `describe-ui`.
  - After `xcrun simctl ui booted content_size …`, terminate and reopen Expo Go (`xcrun simctl terminate booted host.exp.Exponent`); the running app doesn't pick up the new size.
  - In Expo Go, deep links are `exp://127.0.0.1:8081/--/<path>`. The app's own `ulamamoris://` scheme only works in a development build.
- Web: drive `localhost:8081` with `playwright-cli` at 390 × 844. React Native Web renders the screen in an inner scroll container, so full-page screenshots need the viewport made taller or the container scrolled.


## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md