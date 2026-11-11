# Stage 1: Project architecture, folder structure and navigation

> **Status: ✅ Done (11 Nov 2026).** Verified on the web build (stand-in for Android): every route, deep links, scope parsing, back/forward and `+not-found`. Lint and typecheck pass. **Still open:** the iOS simulator walk (§6.2–6.3), once a simulator is available.
> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Build order:** this stage is the scaffolding that comes before HANDOFF §7 steps 1–4. It only sets up the structure, with placeholder screens. No styling, no player, no data.

## Goal

Before any feature work, decide where every kind of code lives. Then replace the starter template's navigation with the navigation map in [HANDOFF §2](../docs/HANDOFF.md). When this stage is done, every route opens with a placeholder screen in light and dark mode, on iOS and web. Tabs, the nested Events stack, the Search push, the Now Playing modal and deep links all work.

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Load first, as the entry point for Expo work. It holds the shared setup rules for SDK 58 |
| `expo-router` | Groups, nested stacks, `Tabs` with a custom `tabBar`, `fullScreenModal`, `slide_from_right`, typed routes, deep links |
| `expo-design-system` | Its folder conventions for components and tokens, so the Stage 2 folders are ready |
| `vercel-react-native-skills` | Mobile-first patterns and avoiding re-render traps in layouts |
| `vercel-composition-patterns` | Component folder and API conventions (composition over boolean props) |
| `playwright-cli` | Click through the routes on the web build. The web build stands in for Android (see AGENTS.md) |

Don't use `shadcn` here (it is for web only) or `expo-ui` (no sheets or pickers are needed yet).

## References

- [HANDOFF.md §2](../docs/HANDOFF.md): navigation map and the changes to the template
- [HANDOFF.md §3](../docs/HANDOFF.md): the global player that the root layout will host (player stage, after Stage 3 Components). Leave a slot for it
- [HANDOFF.md §4.5](../docs/HANDOFF.md): search `scope` param; [§4.4](../docs/HANDOFF.md): Now Playing is a full-screen modal
- [HANDOFF.md §4.7](../docs/HANDOFF.md): `src/utils/format-time.ts` location
- [DESIGN-SYSTEM.md §6](../docs/DESIGN-SYSTEM.md): component tokens live in `src/components/<Name>/tokens.ts`. The folder structure must keep these paths
- [docs/src/data/sample.ts](../docs/src/data/sample.ts): data shape (typed in Stage 3). The event `slug` (`the-sahaba-radiyyallahu-anhum`) is the `[slug]` route param
- Project [AGENTS.md](../AGENTS.md): safe areas, header and inset ownership, and the rule that routes live only in `src/app/`

## 1. Folder structure

Adapted to this app. It has two tabs, five screens and one global player. A full `features/*` tree with its own components would be over-built for this size. The docs also fix the component paths (`@/components/MiniPlayer/tokens`). So the rule is: **`components/` renders, `features/` owns state, data and logic.**

```
src/
├── app/                      # Routes only (Expo Router). No components or logic defined here
├── components/               # Everything that renders UI
│   ├── ui/                   # Generic building blocks with no domain knowledge (Text, IconButton, Chip, Pill, Screen)
│   ├── icons/                # Custom SVG icons (Skip15Icon, LogoBadge). lucide covers the rest
│   ├── artwork/              # Rosette illustration (fixed `palette`)
│   ├── HeroCard/             # Shared emphasis card (DESIGN-SYSTEM §12)
│   ├── MiniPlayer/           # index.tsx + tokens.ts (paths fixed by the docs)
│   ├── TabBar/               # index.tsx + tokens.ts
│   ├── Skeleton/             # index.tsx + tokens.ts
│   └── Search/               # search UI + tokens.ts
├── features/                 # State, data and pure logic per domain. No JSX screens
│   ├── player/
│   │   ├── audio-engine.ts           # The one expo-audio player + commands (playLecture, toggle, seek, skip)
│   │   ├── player.store.ts           # Zustand: queue, currentIndex, source, mirrored status, progressById (persisted)
│   │   └── player-status-bridge.tsx  # Mounted once in the root layout: status → store, auto-advance, progress checkpoints
│   ├── lectures/
│   │   ├── lectures.api.ts           # Async paginated fetcher: reads sample.ts directly for now (no network), real API later
│   │   └── lectures.queries.ts       # useInfiniteQuery hook for the Home list
│   ├── events/
│   │   ├── events.api.ts             # Paginated fetcher + fetch by slug
│   │   ├── events.queries.ts         # Infinite list + event detail queries
│   │   └── group-by-year.ts          # Groups events by their `year` field for the SectionList (pure)
│   └── search/
│       ├── scope.ts                  # parseSearchScope (this stage)
│       ├── match.ts                  # Accent-insensitive matching (pure)
│       ├── search.queries.ts         # Results query, keyed by scope + debounced text
│       └── recent-searches.store.ts  # Zustand, persisted: { lectures: string[], events: string[] }
├── providers/
│   └── app-providers.tsx     # QueryClientProvider and any other app-wide providers. Rendered once by app/_layout.tsx
├── data/                     # sample.ts (typed API-shaped static data) + mock-ui.ts (UI-only mock snapshots), both set up in Stage 3
├── hooks/                    # Cross-feature hooks only
├── theme/                    # primitives.ts, tokens.ts, README.md (Stage 2)
├── utils/                    # format-time.ts and other pure helpers (HANDOFF §4.7)
└── global.css                # NativeWind semantic tokens (Stage 2)
```

Rules to write down in AGENTS.md (one short "Project structure" section):
- A component folder uses PascalCase (`MiniPlayer/`) and holds `index.tsx`, plus `tokens.ts` only when it has component tokens. Small generic pieces in `ui/` are single kebab-case files, which matches the template.
- A component used by only one screen still goes in `components/`, not `app/`.
- `features/*` never imports from `app/`. `components/*` may read hooks from `features/*`.
- Import through the `@/` alias (already in `tsconfig.json`). No barrel `index.ts` re-export files, which hurt tree-shaking (see `react-native-best-practices` → bundle-barrel-exports).
- In this stage, create only the folders you need now (`app/`, `components/ui/`, `components/TabBar/`, `utils/`). Others appear when their stage needs them. List the target tree in AGENTS.md so later stages follow it.

### 1.1 Where state lives (pointers for later stages)

The decision rules are in the "State management" section of [AGENTS.md](../AGENTS.md). This is how they apply to each stage of the build order (HANDOFF §7):

| Build step | Add | Notes |
|---|---|---|
| 1. Design system | Nothing | The theme comes from NativeWind + `useColorScheme()`. No `contexts/theme` and no theme store |
| 2. Data layer | `@tanstack/react-query`, `providers/app-providers.tsx`, `lectures.api.ts` / `events.api.ts` + their `.queries.ts` | The fetchers are async functions that read `sample.ts` directly and return the requested page, with no network and no delay. **No caching:** the `QueryClient` uses `staleTime: 0, gcTime: 0`, and nothing is persisted. When the real API arrives, only the fetcher body and the caching settings change. The query hooks and screens stay the same |
| 3. Player | `expo-audio`, `zustand`, AsyncStorage, the three `features/player/` files | The store never plays audio. The bridge replaces the "PlayerProvider" slot named in HANDOFF §2 and below. It isn't a Context provider |
| 5. Home | `useState` for the selected filter chip | Continue listening is calculated from `progressById` + lecture data. Don't store it |
| 8. Search | `match.ts`, `search.queries.ts` | The input text is `useState`. Only the debounced value goes into the query key. `recent-searches.store.ts` is deferred: recents stay static until the API is connected (Stage 8) |
| 10. Error states | NetInfo, `onlineManager` / `focusManager` wiring in `app-providers.tsx` | Retry comes from Query's `refetch()` and the player engine, not from a new store |

How this differs from a generic `store/` + `contexts/` layout, and why:
- **No top-level `store/` folder.** Each store lives with its domain in `features/`, following the rule "`features/` owns state".
- **No `contexts/` folder.** Nothing needs Context yet. Create the folder when the first real case appears.
- **No `auth`, `bookmark` or `preferences` stores.** None of these is in the spec.
- **Recent searches use one persisted key** (`recent-searches`, holding both scopes), not the two keys `recent:lectures` / `recent:events` from HANDOFF §4.5. One `persist` store is simpler, and nothing else reads those keys. The behaviour (max 5, de-dupe, newest first, per scope) doesn't change.

## 2. Remove the starter template

Delete these files:
- `src/app/explore.tsx`
- `src/components/app-tabs.tsx`, `app-tabs.web.tsx`, `animated-icon.tsx`, `animated-icon.web.tsx`, `animated-icon.module.css`, `web-badge.tsx`, `hint-row.tsx`, `external-link.tsx`, `ui/collapsible.tsx`
- `assets/images/tabIcons/`, the `react-logo*` images, `expo-badge*`, `tutorial-web.png`, `logo-glow.png`
- `scripts/reset-project.js` and its `package.json` script

Keep these for now, so the placeholder screens are themed: `themed-text.tsx`, `themed-view.tsx`, `hooks/use-theme.ts`, `hooks/use-color-scheme*.ts`, `constants/theme.ts`. Stage 2 replaces and deletes them.

Before deleting anything, grep for imports of each file.

## 3. Route tree

Follows HANDOFF §2, plus one file the brief leaves implicit: `(tabs)/events/_layout.tsx`. Without it, `[slug]` can't be pushed *inside* the Events tab with the tab bar still visible.

```
src/app/
├── _layout.tsx              Root Stack. Imports "@/global.css" (Stage 2). Slot for AppProviders (data layer) + PlayerStatusBridge (player stage)
├── +not-found.tsx           Unknown deep links → themed message + link to Home
├── (tabs)/
│   ├── _layout.tsx          JS <Tabs> from expo-router, tabBar={(props) => <TabBar {...props} />}
│   ├── index.tsx            Home
│   └── events/
│       ├── _layout.tsx      Stack for the Events tab (headerShown: false)
│       ├── index.tsx        Events list
│       └── [slug].tsx       Event detail
├── search.tsx               Stack screen, animation 'slide_from_right', ?scope=lectures|events
└── player.tsx               presentation 'fullScreenModal', animation 'slide_from_bottom', gestureEnabled
```

Layout details:
- **Root `_layout.tsx`:** a `Stack` with `screenOptions={{ headerShown: false }}`. Every screen draws its own top bar, so every screen owns its top inset (AGENTS.md safe-area rules). Export `unstable_settings = { initialRouteName: '(tabs)' }`, so a deep link straight to `/search` or `/player` still has the tabs underneath to go back to. Keep `SplashScreen.preventAutoHideAsync()`. In this stage, hide the splash once the layout mounts. Stage 2 moves this to "once fonts are loaded".
- **`(tabs)/_layout.tsx`:** use `Tabs` from `expo-router`, not `NativeTabs`. A native tab bar can't host the mini player stacked above it (HANDOFF §2). Pass `headerShown: false`. The custom `tabBar` is a minimal `components/TabBar/index.tsx`: two `Pressable`s (Home, Events) with `accessibilityRole="tab"`, a selected state, a 44px minimum height and `paddingBottom: insets.bottom`. Stage 3 (Components) styles it, and the tabs-layout screen stage stacks `MiniPlayer` above it. Leave a `// TODO: MiniPlayer goes here` marker where it will go.
- **`(tabs)/events/_layout.tsx`:** a `Stack` with `headerShown: false` and `unstable_settings = { initialRouteName: 'index' }`, so a deep link to `/events/the-sahaba-radiyyallahu-anhum` gets a back button to the list.
- **`search.tsx`:** read `scope` with `useLocalSearchParams<{ scope?: string }>()`. Parse it in a small named function, `parseSearchScope(raw): 'lectures' | 'events'`, that defaults to `'lectures'` for a missing or unknown value. Put the function in `features/search/scope.ts`.
- **`player.tsx`:** `presentation: 'fullScreenModal'`, swipe down to dismiss. No header covers the notch, so this screen owns its top *and* bottom insets. The placeholder has a close button that calls `router.back()`. Later, if nothing is loaded in the player (for example on a cold deep link to `/player`), the screen should `router.replace('/')`. Add a `// TODO(player stage)` comment for that.
- **Placeholder screens:** each shows its route name and any params, plus the navigation buttons for that screen (Home → Search with scope=lectures, Home → Player; Events → Search with scope=events, Events → `/events/the-sahaba-radiyyallahu-anhum`). Use `ThemedView`/`ThemedText` with safe-area padding. No hex values.

## 4. Deep links

- Expo Router maps every route to a URL automatically. With typed routes on, use `Link`/`router.push` with typed `href`s only.
- Scheme: `ulamamoris` (set in app.json). A scheme change only takes effect in a new native build, so rebuild the dev client after changing it.
- URLs to verify: `ulamamoris://`, `…://events`, `…://events/the-sahaba-radiyyallahu-anhum`, `…://search?scope=events`, `…://player`, and an unknown path (should show `+not-found`).
- Universal links and `+native-intent.tsx` are out of scope. No incoming URL needs rewriting yet.

## 5. Files touched

- New: `src/app/(tabs)/_layout.tsx`, `(tabs)/index.tsx`, `(tabs)/events/_layout.tsx`, `(tabs)/events/index.tsx`, `(tabs)/events/[slug].tsx`, `src/app/search.tsx`, `src/app/player.tsx`, `src/app/+not-found.tsx`, `src/components/TabBar/index.tsx`, `src/features/search/scope.ts`
- Rewritten: `src/app/_layout.tsx`
- Deleted: `src/app/index.tsx` (moves to `(tabs)/index.tsx`), `src/app/explore.tsx`, plus the template files listed in §2
- Edited: `AGENTS.md` (add a "Project structure" section), `package.json` (remove the `reset-project` script)

## 6. Verification

1. `npx expo lint` and `npx tsc --noEmit` pass. Typed routes regenerate (`.expo/types`).
2. iOS simulator (`npx expo start --ios`):
   - Switch tabs.
   - Open Event detail from Events, and check the tab bar stays visible and back works.
   - Search slides in from the right.
   - Player slides up as a full-screen modal and closes with a swipe down.
   - Check light and dark mode.
3. Deep links on iOS: `xcrun simctl openurl booted "ulamamoris://events/the-sahaba-radiyyallahu-anhum"`. Check the back button goes to the Events list. Repeat for every URL in §4.
4. Web (`npx expo start --web`), checked with `playwright-cli`:
   - The same route walk.
   - Browser back and forward.
   - Open `/events/the-sahaba-radiyyallahu-anhum` directly.
   - Open `/search?scope=events` and check the parsed scope.
   - Open an unknown URL and check it reaches `+not-found`.
5. Grep shows no imports left from any deleted file.
