# Stage 4: Home screen (composition)

> **Status: ✅ Done (11 Nov 2026).** Verified on the iOS simulator (Expo Go, driven with AXe) and the web build, light and dark: visual match with `home.png`, element sizes, infinite scroll to the 81st row, placeholder taps, tab switching, the Event detail deep link and the largest accessibility text size. Lint, typecheck and `check:theme` pass. Deliberate differences: the Continue listening card, active row and mini player show the `mockPlayback` lecture (paused), and the dev pages are opened by URL.
> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 1 (routes, tabs), Stage 2 (tokens, fonts, `Text`), Stage 3 (all components, typed `sample.ts`, `mock-ui.ts`, `formatVenue`, `catForTopic`).

## Goal

Assemble the Home screen from the Stage 3 components so it matches [artboards/screens/home.png](../docs/artboards/screens/home.png). The only working behaviour in this stage is **infinite scrolling over fake data**. Everything else is put in place but does nothing yet. The tab layout gets its final shape: the mini player stacked above the Home / Events tab bar, on every tab screen. The Events tab gets a title-only screen, so moving between tabs works.

## Scope

| Part | This stage | Later |
|---|---|---|
| Header, greeting | Static, as designed | — |
| Search bar | Rendered as the field-style button. **No `onPress`**: tapping does nothing | Search screen stage pushes `search?scope=lectures` |
| Continue listening card | Always shown, always the **first lecture** of `sample.ts` with the `mockPlayback` progress from `mock-ui.ts`. No show/hide logic | Player stage: calculated from `progressById`, hidden on first launch |
| Card play button | Rendered, shows the "play" icon (paused state). No `onPress` | Player stage |
| Filter chips (Local / Guest / Islāhi Majlis) | Rendered with "Local" selected. No `onPress`, no filtering, no empty-series state | A later stage adds `useState` for the selected chip, plus filtering |
| Lecture list | Real list from static data, **infinite scroll via a fake fetcher** | Real API: only the fetcher body changes |
| Row play buttons | Rendered. No `onPress`. The first row shows the "active, paused" look so it matches the artboard (it's the `mockPlayback` lecture) | Player stage |
| Mini player | **Always visible** on every tab screen, showing the `mockPlayback` lecture. Play/pause, forward 15 and the text area have no `onPress` | Player stage: hidden until something has played, opens Now Playing |
| Tab bar (Home, Events) | Working navigation between the two tabs (Stage 1 wiring + Stage 3 look) | — |
| Events tab | Title-only screen ("Events") | Events screen stage |

Not built here: audio, the player store, Zustand, AsyncStorage, the search screen, error and offline states (HANDOFF §9), and any loading or empty states beyond the infinite-scroll footer.

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point. SDK 58 install rules |
| `expo-data-fetching` | `useInfiniteQuery` with a stub fetcher, `getNextPageParam`, footer loading state |
| `expo-router` | Custom `tabBar` on JS `Tabs`, stacking the mini player above it, tab screens without headers |
| `vercel-react-native-skills` / `react-native-best-practices` | `FlatList` tuning (stable `keyExtractor`, `renderItem` outside JSX, `onEndReachedThreshold`, no inline components), keeping the header out of re-renders |
| `frontend-design` | Required for user-facing UI (root AGENTS.md). Matching the artboard spacing |
| `expo-native-ui` | Safe-area ownership (headerless tab screen), status bar |
| `playwright-cli` | Web check of scrolling, tab switching, and a screenshot compared with the PNG |

## References

- [HANDOFF.md §4.1](../docs/HANDOFF.md): Home, section by section. §4.6: mini player + tab bar. §4.7: formatting helpers.
- [ARTBOARD-MAP.md §1](../docs/ARTBOARD-MAP.md): y-ranges, margins and token classes for every Home region, including the margin-tops between sections (24, 18, 24, 34, 8, 14).
- [html/screens/home.html](../docs/html/screens/home.html): working page. Measure spacing in a browser.
- [DESIGN-SYSTEM.md §12](../docs/DESIGN-SYSTEM.md): lecture row, chip, emphasis card, and mini player recipes.
- [docs/src/data/sample.ts](../docs/src/data/sample.ts), as typed and extended in Stage 3.
- Project [AGENTS.md](../AGENTS.md): "State management" → TanStack Query for lecture pages, with stub fetchers and **no caching**. "Safe areas" → a headerless screen owns its top inset, and the tab bar owns the bottom.

## 1. Dependencies

- `npx expo install @tanstack/react-query`. This is the first stage that needs it (AGENTS.md "State management", Stage 1 §1.1 table, "Data layer" row).
- Don't add Zustand or AsyncStorage yet. Nothing in this stage persists or shares state.

## 2. Fake data fetching (infinite scroll)

The one piece of real logic in this stage. AGENTS.md describes how it is laid out:

- **`src/providers/app-providers.tsx`:** one `QueryClient` at module scope, with `defaultOptions.queries = { staleTime: 0, gcTime: 0 }`. It renders `QueryClientProvider` around its children. `src/app/_layout.tsx` renders `<AppProviders>` once, around the root `Stack`.
- **`src/features/lectures/lectures.api.ts`:**
  - `export const LECTURE_PAGE_SIZE = 10;`
  - `export async function fetchLecturePage(pageIndex: number): Promise<LecturePage>` returns `{ items: LectureSummary[]; total: number; nextPageIndex: number | null }`.
  - **`total` comes from the API, not from counting.** The app never counts lectures. The response carries the library size, and the "81 lectures" label shows it as given. For now it is static: add `latestLecturesTotal = 81` to `src/data/sample.ts`, next to the lecture list, as the value the API will return. Every page returns the same `total`.
  - **Making enough rows to scroll:** the static list is only about 10 lectures. A separate named function, `buildMockLibrary()`, builds a longer list once, at module scope:
    - repeat the sample lectures in order, up to `latestLecturesTotal` items, so the list length and the label agree;
    - give each copy a unique slug (`${slug}--${copyNumber}`), so list keys stay unique.
    - Write it as a plain `for` loop, and keep the result in a module-level constant.
  - `fetchLecturePage` slices that list for the requested page. It returns `nextPageIndex: null` once the end is reached. No network and no artificial delay (AGENTS.md).
  - Leave a short comment: the real API replaces this function body only.
- **`src/features/lectures/lectures.queries.ts`:** `useLatestLecturesQuery()` wraps `useInfiniteQuery`:
  - `queryKey: ['lectures', 'latest']`;
  - `initialPageParam: 0`;
  - `queryFn: ({ pageParam }) => fetchLecturePage(pageParam)`;
  - `getNextPageParam: (lastPage) => lastPage.nextPageIndex ?? undefined`.
- **On the screen:**
  - flatten `data.pages` into one array with a plain loop inside `useMemo`, or leave the memo to the React Compiler, which is enabled;
  - `onEndReached`: if `hasNextPage && !isFetchingNextPage`, call `fetchNextPage()`;
  - set `onEndReachedThreshold` to about 0.5.
- **Footer:** when `isFetchingNextPage`, render the Stage 3 `LoadingFooter` (skeleton row + "Loading more lectures"). When `hasNextPage` is false, render nothing. Because the fetcher has no delay, the footer will only flash. That is expected: the gallery already checks how it looks. Don't add a delay to make it visible.

## 3. Screen composition: `src/app/(tabs)/index.tsx`

**One `FlatList` for the whole screen** (HANDOFF §4.1). Everything above the rows is its `ListHeaderComponent`. Build the header as a separate named component in `src/components/HomeListHeader/index.tsx`, so the route file stays short and the header doesn't re-render with list pages.

Top to bottom (margins from ARTBOARD-MAP §1):
1. `HomeHeader`: `LogoBadge` + "Ulama Moris" / "Islamic Audio Library". Inset `pl-5 pr-bar`.
2. Greeting, `mt-6`, gap 6: "Assalāmu ’alaykum" (`text-primary`, 14 Bold) above "Nurture your heart with today’s reminders" (`h1`). Inset `px-gutter`.
3. `SearchFieldButton`, `mt-[18px]`, "Search by topic". No `onPress`. Keep the `accessibilityRole="button"` and the label "Search by topic".
4. `ContinueListeningCard`, `mt-6`, with no rosette artwork:
   - the overline, the first lecture's title and author;
   - play button in the "play" state;
   - progress and the elapsed / "31 min left" values from `mockPlayback`.
5. `SectionHeader` "Latest lectures", trailing "{total} lectures". `total` is read from the first page of the query (`data.pages[0].total`), never counted. While the first page hasn't arrived, leave the count out. `mt-[34px]`.
6. Chips row, `mt-2`, gap 8: Local (selected), Guest, Islāhi Majlis, from `lectureSeries`.
7. Rows (`renderItem`), `mt-3.5` before the first row, 10 between rows (`ItemSeparatorComponent`). Each row is a `LectureRow`:
   - `title`;
   - `author`;
   - `metaLabel`: `"31 Oct · 36 min · Masjid Muswalla, Highlands"`, built from `shortDateLabel(date)`, `minutesLabel(duration)` and `formatVenue(masjid)`. Leave out any part that is missing;
   - `state`: `'paused'` for the `mockPlayback` lecture, otherwise `'idle'`.

Layout and fit:
- The screen background is `bg-bg`. The rows use `px-gutter` through `contentContainerClassName`, or a padded wrapper around each row.
- **Top inset:** the tab screen has no header, so it owns the top. Add `paddingTop: insets.top` to the list's content container, so the header scrolls with the content.
- **Bottom:** the custom tab bar (with the mini player) sits *below* the screen in the `Tabs` layout, so the list doesn't need `insets.bottom`. Add only normal spacing (`paddingBottom` ~24) so the last row doesn't touch the mini player (HANDOFF §4.1.6).
- `<StatusBar style="auto" />` (the ground is ivory or charcoal).
- Wide screens: wrap the content in a centred `maxWidth: 600` container (AGENTS.md).
- `renderItem` and `keyExtractor` (`item.slug`) are defined outside the JSX. The rows stay pure.

## 4. Formatting helpers: `src/utils/format-time.ts`

The rows need display strings built from the API-shaped data. Add only the helpers this screen uses, one plain function each (HANDOFF §4.7):

| Helper | Input → output | Rule |
|---|---|---|
| `clockToSeconds(clock)` | `"35:48"` → 2148, `"1:02:05"` → 3725 | Split on `:`, then a plain loop. Returns `null` for an empty or invalid value |
| `minutesLabel(seconds)` | 2148 → `"36 min"` | Round to the nearest minute |
| `shortDateLabel(isoDateTime)` | `"2026-10-31T21:15:00.000+04:00"` → `"31 Oct"` | Read the `YYYY-MM-DD` part of the string directly. Don't use `new Date(...)`, which converts to the device's time zone and can shift the day (HANDOFF §4.7) |

`minutesLeftLabel`, `clockLabel` and `longDateLabel` are left for the stages that use them. The Continue listening values come pre-formatted from `mockPlayback` in this stage.

## 5. Tabs layout: `src/app/(tabs)/_layout.tsx`

- Keep the JS `Tabs` navigator from Stage 1. Its `tabBar` prop renders a small named component, `TabsFooter`, which stacks:
  1. **`MiniPlayer`**, always visible, filled from `mockPlayback`'s lecture:
     - title and author;
     - play/pause in the "pause" state, since it looks as though it's playing;
     - forward 15;
     - progress line.
     - No `onPress` anywhere. The accessibility labels stay ("Open player", "Pause", "Skip forward 15 seconds").
  2. **`TabBar`**, from Stage 3, given the navigator's `state` / `navigation` props:
     - Home (house icon) and Events (calendar icon);
     - selecting a tab uses the Stage 1 wiring (`navigation.navigate`);
     - active and inactive looks from the `tabBar` tokens.
- Container: `bg-bg`, `tabBar.divider` (top hairline), `px-bar`, gap 8. `paddingBottom: insets.bottom` lives here, once (HANDOFF §4.6).
- The bar shows on every tab screen, including Event detail, which is pushed inside the Events stack. Search and Now Playing are root-stack screens and cover it, as designed (HANDOFF §2).
- Remove the Stage 1 `// TODO: MiniPlayer goes here` marker.

## 6. Events tab placeholder: `src/app/(tabs)/events/index.tsx`

- A `bg-bg` screen with top-inset padding. Only `<Text variant="display">Events</Text>` sits in the `px-gutter` inset (ARTBOARD-MAP §2 title position).
- Remove the Stage 1 test buttons (Search, Event detail) from this screen. Keep `events/[slug].tsx` from Stage 1 as it is, so its deep link still works.
- The Events screen stage replaces this file.

## 7. Cleanup

- Remove the Stage 1 placeholder buttons from Home (the links to Search and Player). Home now has no ways out except the tab bar. Search and Player are still reachable by deep link for testing.
- Keep the link to `/dev/components` and `/dev/tokens` behind `__DEV__`. Put it somewhere unobtrusive, such as a long-press on the logo, or remove it and open the gallery by URL. **Decide during implementation**, and note which.

## 8. Files touched

- New:
  - `src/providers/app-providers.tsx`
  - `src/features/lectures/lectures.api.ts`, `lectures.queries.ts`
  - `src/utils/format-time.ts`
  - `src/components/HomeListHeader/index.tsx`
  - `TabsFooter`, in `src/components/TabBar/tabs-footer.tsx`
- Rewritten: `src/app/(tabs)/index.tsx`, `src/app/(tabs)/events/index.tsx`, `src/app/(tabs)/_layout.tsx`
- Edited: `src/app/_layout.tsx` (wrap in `AppProviders`), `package.json` (`@tanstack/react-query`)

## 9. Verification

The stage is done only after the agent has **opened the app itself** on the iOS simulator (iOS, driven with AXe) and the web build (standing in for Android, since there's no Android simulator; see AGENTS.md "Verifying"), compared Home with the artboard, and scrolled the list. Report what was checked, with the screenshots, and anything that didn't match.

### 9.1 Static checks

`npx expo lint`, `npx tsc --noEmit` and `npm run check:theme` pass.

### 9.2 iOS simulator: tooling

The iOS checks use **AXe** (`axe`, installed with Homebrew, v1.8.0), which drives the booted simulator from the terminal:

| Need | Command |
|---|---|
| Simulator id | `axe list-simulators` (or `xcrun simctl list devices booted`), then use it as `--udid <id>` |
| Screenshot | `axe screenshot --udid <id> --output <scratchpad>/<name>.png` (or `xcrun simctl io booted screenshot <file>`) |
| What's on screen | `axe describe-ui --udid <id>`: the accessibility tree, with labels and frames |
| Tap an element | `axe tap --label "Search by topic" --udid <id>` (by accessibility label) or `axe tap -x <x> -y <y> --udid <id>` |
| Scroll | `axe swipe --start-x 195 --start-y 700 --end-x 195 --end-y 250 --duration 0.3 --udid <id>` (finger moves up, so the list moves down), or the presets `axe gesture scroll-up` / `scroll-down`. Check which way a preset moves the list on the first try; don't assume |

- Before writing commands, check `axe <subcommand> --help`, since flags can change between versions.
- If AXe can't do something that's needed (for example, it doesn't see an element, or can't scroll the list), switch to an MCP server (`XcodeBuildMCP` or `ios-simulator-mcp`, added with `claude mcp add`) and note it in AGENTS.md "Verifying".
- The accessibility labels required by the plans ("Play {title}", "Search by topic", "Open player", tab names) are what AXe targets. A missing label shows up as a failed tap, which is also an accessibility bug to fix.

### 9.3 iOS simulator: visual match

1. Start the app: `npx expo start --ios`. This boots the simulator and opens Home.
2. Take a screenshot in light mode: `home-ios-light.png`.
3. Open it next to [artboards/screens/home.png](../docs/artboards/screens/home.png) and compare region by region, using the y-ranges in [ARTBOARD-MAP.md §1](../docs/ARTBOARD-MAP.md):
   - header (badge, name, tagline) and its left inset of 20;
   - greeting sizes and line breaks;
   - search bar height (52), radius and placeholder;
   - Continue listening card: radius 28, ochre play button, progress bar, times. **No rosette** in the top-right corner: that difference from the artboard is deliberate (Stage 3, `HeroCard` `continueListening` preset);
   - "Latest lectures" heading with "81 lectures", and the chip row with Local selected;
   - lecture rows: padding, radius 22, gaps of 10, title / author / meta styles, and the first row in the active, paused look;
   - mini player above the tab bar, with no cover art or thumbnail (deliberate difference from the artboard), Home tab active.

   The artboard's top 44 pt is a fake status bar. On the simulator, the header must sit just below the real status bar.
4. Use `axe describe-ui` to check sizes the eye can't judge. The search bar frame should be 52 high, the row play buttons 44 × 44, and the tab items at least 44 high.
5. Dark mode: run `xcrun simctl ui booted appearance dark`, take `home-ios-dark.png`, and check:
   - every surface and text colour changed;
   - the mini player is forest with its hairline outline;
   - nothing is left in a light colour.

   Switch back with `appearance light`.
6. If something doesn't match, fix it and take a new screenshot. List any difference that is deliberate (the ARTBOARD-MAP ⚠ notes).

### 9.4 iOS simulator: scrolling the static data

Don't count rows. The count shown is whatever the API returns (static 81 for now). The check is that scrolling keeps loading pages until the data runs out.

1. Check that the heading reads "81 lectures", matching `latestLecturesTotal`.
2. Loop: swipe up once with `axe swipe`, then run `axe describe-ui` and read the visible "Play {title}" labels.
   - While there is more data, new rows appear after each swipe. That shows `onEndReached` is fetching the next page.
   - Stop when two swipes in a row show the same last row.
3. At the end:
   - nothing comes after the last row (no loading footer, no blank skeleton);
   - further swipes load nothing.
   - Take `home-ios-end.png`.
4. Watch the Metro terminal the whole time: no duplicate-key warnings, no "VirtualizedList … slow to update" warning, no errors.
5. Scroll back to the top with the reverse swipe (start y 250 → end y 700), repeated. The header, card and chips are back, with no jump.
6. **Placeholders:** `axe tap --label` on "Search by topic", the card's play button, one row's "Play {title}", the "Guest" chip, and the mini player's "Open player", "Pause" and "Skip forward 15 seconds". After each tap, `describe-ui` shows the same screen, and Metro logs no error.
7. **Tabs:** `axe tap --label "Events"`. The "Events" title shows, and the mini player and tab bar are still there. `axe tap --label "Home"` brings the list back.

### 9.5 Web build (stands in for Android)

Start `npx expo start --web` and drive it with `playwright-cli` at a 390 × 844 viewport:
1. **Visual:** a full-page screenshot in light mode, compared with `home.png` using the §9.3 checklist. Repeat with `colorScheme: 'dark'`.
2. **Scroll:** check that the heading shows "81 lectures". Scroll the list to the end in steps, using the same check as §9.4: new rows keep appearing, nothing follows the last row, and scrolling further loads nothing. Don't count rows.
3. **Tabs and placeholders:** the same checks as §9.4 steps 6–7, with clicks instead of taps. The browser console shows no errors.

### 9.6 Other checks

1. Deep link `ulamamoris://events/the-sahaba-radiyyallahu-anhum` (`xcrun simctl openurl booted …`). Event detail opens inside the Events tab, with the mini player and tab bar visible.
2. Largest Dynamic Type size on the simulator: titles wrap (at most 2 lines), and chips and rows grow instead of clipping.
3. Grep `src/app/(tabs)/index.tsx` and `src/components` for `onPress=`. The only matches should be the tab bar items.
