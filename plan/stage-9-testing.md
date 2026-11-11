# Stage 9: Component and unit testing

> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stages 1–8 (everything being tested exists).

## Goal

Add an automated test suite that locks in what Stages 1–8 built, so later stages (player, real API, error states) can change code safely:
- **Unit tests** for every pure function: formatting, matching, grouping, colour rotation, param parsing, and the stub fetchers.
- **Component tests** for the Stage 3 components: each one renders its states, exposes the right accessibility labels, and calls `onPress` only where one is wired.
- **Route integration tests** with Expo Router's in-memory router, for the navigation that works today: Home → Now Playing, Events → Event detail → Now Playing, Search → results → leaving Search.

Tests check **behaviour and output, not styling.** Visual correctness was checked against the artboards in each stage (AXe + Playwright), and the class names are checked by `npm run check:theme`.

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point. SDK 58 install rules (`npx expo install … --dev`) |
| `expo-router` | `expo-router/testing-library`: `renderRouter`, `testRouter`, the path and param matchers |
| `expo-data-fetching` | Testing query hooks: a fresh `QueryClient` per test, `retry: false` |
| `vercel-react-native-skills` / `vercel-composition-patterns` | Testing components through their public props, without reaching into internals |
| `react-native-best-practices` | Spotting re-render or list problems that tests expose (for example a missing `keyExtractor`) |

## References

- Expo unit testing guide (SDK 58): https://docs.expo.dev/develop/unit-testing/
- Expo Router testing reference: https://docs.expo.dev/router/reference/testing/
- Behaviour to assert comes from the stage plans and [HANDOFF.md](../docs/HANDOFF.md): §4.5 (folding rules), §4.7 (formatting), §4.4 to §4.6 (accessibility labels).
- Read both Expo pages again before installing. The notes below summarise them as of 11 Nov 2026.

## 1. Setup

1. Install the dev dependencies:
   - `npx expo install jest-expo jest @types/jest --dev`
   - `npx expo install @testing-library/react-native --dev`

   SDK 58 needs **Jest 30** with `jest-expo`, and RNTL **14 or later** for the router testing library. Upgrade these together. Don't install `react-test-renderer`: it's deprecated and doesn't support React 19.
2. In `tsconfig.json`, add `"jest"` to `compilerOptions.types`.
3. In `package.json`, add a `jest` block:
   - `"preset": "jest-expo"`;
   - `setupFilesAfterEnv`: `["<rootDir>/jest.setup.ts"]`;
   - `transformIgnorePatterns`: the npm pattern from the Expo guide, extended so that `lucide-react-native`, `react-native-svg` and `nativewind` are transpiled. Start from the guide's pattern and add a package only when a test fails because of it.
4. Scripts:
   - `"test": "TZ=America/Los_Angeles jest"`. The fixed time zone, far from the data's `+04:00`, makes the date tests fail if any helper ever converts through `new Date(isoString)` and shifts the day (HANDOFF §4.7).
   - `"test:watch": "TZ=America/Los_Angeles jest --watch"`.
5. `jest.setup.ts`, with only what the tests need:
   - the safe-area mock from `react-native-safe-area-context/jest/mock` (so insets are 0);
   - the Reanimated / Worklets mock, only if a component import needs it (check the Reanimated 4 docs for the current mock path);
   - nothing else to start with. Add a mock only when a test fails without it, with a one-line comment saying why.
6. NativeWind in Jest: `className` is compiled by the Babel preset already set up in Stage 2. If the classes cause errors under Jest, follow the NativeWind v4 testing notes. Tests never assert on class names.
7. AGENTS.md:
   - add `npm test` to "Commands";
   - add "tests pass" to the done checklist ("Run lint and typecheck before declaring any task done" becomes lint, typecheck, `check:theme` and tests).

## 2. Where tests live

- In a `__tests__` folder next to the code they test, for example `src/utils/__tests__/format-time.test.ts` and `src/components/MiniPlayer/__tests__/mini-player.test.tsx`.
- **Never inside `src/app/`.** Every file there becomes a route (Expo Router warning). Route integration tests go in `__tests__/routes/` at the project root.
- Shared helpers go in `src/test-utils/`. Exclude that folder from the app bundle by never importing it from app code.
  - `render-with-providers.tsx`: renders the UI inside a **new `QueryClient` per test** (`retry: false`, `gcTime: Infinity` so data isn't dropped mid-test) and a `SafeAreaProvider`.
  - `fixtures.ts`: small hand-written lecture and event objects built from the `sample.ts` types, including the edge cases: no `duration`, no `masjid` / `location`, no `event` / `category`, a 3-line title, an all-caps venue, the cedilla "Ş" and the dot-below "Ṣ".

## 3. Unit tests (pure functions)

One file per module. Each test name states the rule it protects, for example `"rounds to the nearest minute"`.

| Module | Cases |
|---|---|
| `utils/format-time.ts` | `clockToSeconds`: "35:48" → 2148, "1:02:05" → 3725, "" / "abc" → `null`. `minutesLabel`: 2148 → "36 min", 89 → "1 min", 30 → rounding rule as documented. `shortDateLabel`: `"2026-10-31T21:15:00.000+04:00"` → "31 Oct" (and still "31 Oct" under the test time zone). `longDateLabel` → "Saturday, 31 October 2026"; a date just after midnight +04:00 keeps its own weekday |
| `utils/format-venue.ts` | "MASJID MUSWALLA, HIGHLANDS" → "Masjid Muswalla, Highlands"; "Nuʿmān Ibn Thābit, Quatre Bornes" unchanged; a single word; an empty string |
| `theme/tokens.ts` category helpers | `catAt`: 0 → 1, 4 → 5, 5 → 1, negative index stays in 1–5. `catForTopic`: topics in `topicOrder` rotate in first-seen order; the same topic always gets the same colour; an unknown topic → 1 |
| `features/search/scope.ts` | `parseSearchScope`: "events" → events; "lectures", `undefined`, "other", an array value → lectures |
| `features/search/match.ts` | Folding: "sahaba" matches "Şahābā" (cedilla) and "Ṣaḥābā" (dot below); upper case matches; `’`, `'` and `ʿ` are treated the same. **Highlight ranges map to original indexes** (the highlighted substring of "Sacrifices of the Şahābā …" is exactly "Şahābā"). Empty query → `null`. `splitForHighlight`: match at the start, middle and end; no match → one un-highlighted part |
| `features/events/group-by-year.ts` | Keeps API order. A new section starts on every `year` change. Empty input → no sections. A year that appears again later (out of order) starts a new section rather than merging (documents the "no sorting" rule) |
| `data/mock-repeat.ts` | Repeats in order up to the requested count; slugs are unique (`--N`); count 0 → empty |
| Small screen helpers | `lectureNumberLabel` (0 → "01", 9 → "10"), `pickSearchView` (empty query → recent; results → results; zero results → no-results; text typed but debounce pending → keeps the previous view), `pickMiniPlayerLecture` (event detail route → the event's first lecture; any other route → the `mockPlayback` lecture) |

## 4. Stub fetcher tests

These protect the contracts the real API will have to meet, so that swapping in the API is safe.

| Fetcher | Cases |
|---|---|
| `fetchLecturePage` | Page 0 has `LECTURE_PAGE_SIZE` items; every page carries the same `total` (`latestLecturesTotal`); `nextPageIndex` counts up, then is `null` on the last page; the last page may be short; slugs are unique across all pages |
| `fetchLectureBySlug` | Finds a sample slug; finds a generated `--N` slug; unknown → `null` |
| `fetchEventPage` | Same shape checks as lectures; `total` is `eventsTotal`; order is unchanged from the data |
| `fetchEventBySlug` | The Sahaba event returns its 4 lectures in data order; an event without mock lectures returns `event.total` generated lectures whose slugs `fetchLectureBySlug` can find; unknown → `null` |
| `fetchSearchResults` | Lectures: title matches only (a topic word or an author's name returns nothing), unique lectures (no `--N` duplicates), `total` equals the number of items, `titleParts` contain a highlighted part. Events: title only. Empty query → no items |
| `useDebouncedValue` | With Jest fake timers: the value updates only after 150 ms of no change; the timer is cleared on unmount |

## 5. Component tests (Stage 3 components)

Use `render-with-providers` and query **by role and accessibility label**, the same way a screen-reader user (and AXe) finds things. That way the tests also enforce the accessibility labels the plans require.

For each component, test what its props promise:

| Component | Assertions |
|---|---|
| `Text` | Renders children; passes `numberOfLines`; never sets `allowFontScaling={false}` |
| `IconButton`, `PlayPauseButton` | Exposes `accessibilityRole="button"` and its label; `PlayPauseButton` switches the label/icon between "Play" and "Pause" with `state`; pressing calls `onPress` when given, and pressing without `onPress` doesn't throw |
| `Chip` | `selected` sets `accessibilityState.selected` |
| `Pill`, `IconLabel`, `SectionHeader`, `EmptyState` | Render their text; optional parts disappear when not given |
| `ProgressBar`, `SeekBar` | `SeekBar` exposes `accessibilityValue` (now / min / max) and the elapsed / remaining text; `progress` is clamped to 0–1 |
| `LectureRow` | Title, author and meta show; the play button's label is "Play {title}"; `state="paused"` vs `"idle"` changes the button's state; row press and play press both call their handlers |
| `NumberedLectureRow` | Number label; meta for idle ("31 Oct · 35:48"), paused ("Paused · …") and playing ("Now playing · …"); "Pause {title}" label when playing |
| `EventRow`, `DateTile` | Day / month text; no venue line when `location` is missing; label "Open {title}" |
| `HeroCard` presets | `continueListening` renders **no** rosette; `latestEvent` / `eventHero` render one (query by `testID` on the rosette) |
| `ContinueListeningCard`, `LatestEventCard`, `EventHeroCard` | Their text and buttons; the venue pill is absent when there's no venue |
| `SearchInput` | Placeholder per scope; mic when empty, "Clear search" ✕ when there's text; `onChangeText` fires |
| `RecentSearchList` | Renders the given items in order, with "Remove “{text}” from recent searches" labels; empty list → "Your searches will appear here." |
| `HighlightedText`, `SearchResultRow` | Highlighted part is a separate text node; lecture vs event tile (AudioLines vs date tile) |
| `NowPlaying/TrackInfo` | Venue / date lines and tag pills are left out when the data is missing; event pill label "Open event: {name}" |
| `NowPlaying/PlayerControls` | "Back 15 seconds", "Play", "Forward 15 seconds" labels |
| `MiniPlayer` | Title and author; **no cover art or thumbnail** (no image in the tree); labels "Open player", "Pause", "Skip forward 15 seconds" |
| `TabBar` | Home and Events tabs with `accessibilityRole="tab"`, and the selected state on the active tab |

Also add one guard test: render every component in its default state in both colour schemes (set NativeWind's colour scheme to light, then dark) and assert that nothing throws. This catches a component that reads a theme value that doesn't exist.

No snapshot tests. The Expo guide recommends end-to-end checks for how the UI looks, and snapshots of NativeWind output would break on every token change without catching real bugs.

## 6. Route integration tests (`__tests__/routes/`)

Use `renderRouter` from `expo-router/testing-library`. Use a **fixture with overrides**: point `appDir` at the real `src/app`, so the real layouts and screens are used. Await `renderRouter` and every `testRouter` call. Use `screen` matchers such as `toHavePathname`, `toHavePathnameWithParams` and `toHaveSegments`.

| Flow | Assertions |
|---|---|
| Home loads | Shows "Latest lectures", "{total} lectures", and the first page of rows. The mini player and both tabs are present |
| Home → Now Playing | Pressing a row's "Play {title}" → pathname `/player` with `slug` set; the screen shows that title and "Latest lectures". "Minimise player" → back to `/` |
| Now Playing guard | `initialUrl: '/player'` (no slug) → ends on `/`. `/player?slug=unknown` → `/` |
| Events → detail | Pressing "Open The Sahaba Radiyyallahu Anhum" → `/events/the-sahaba-radiyyallahu-anhum`; the segments show the Events tab is active; the mini player shows the event's first lecture |
| Event detail → Now Playing | A row's play → `/player` with `slug` and `fromEventSlug`; the source reads the event title |
| Event detail guard | `/events/unknown` → `/events` |
| Search, lectures | From Home, pressing "Search by topic" → `/search?scope=lectures`. Type "sahaba" (advance fake timers by 150 ms) → "N lectures found". Press a result → `/player` with `fromQuery`; going back does **not** land on `/search` |
| Search, events | `scope=events`, "jummah" → one event result. Press it → Event detail in the Events tab |
| Search, recents static | Press a recent item → its results show. Clear the input → the same recent items in the same order |
| Placeholders stay inert | Pressing controls that have no action yet (Home chips, "Share event", the mini player controls, recent-search ✕ and "Clear all") doesn't change the pathname |
| Infinite scroll | Fire `onEndReached` on the Home list (via `fireEvent.scroll` to the end, or by calling the list's `onEndReached` prop) → the second page's first title appears; on the last page nothing more loads |

If the fixture route tree can't load a native-only module under Jest, mock that module in `jest.setup.ts`, with a comment saying why. Don't mock the screens themselves: these tests exist to cover them.

## 7. What is *not* in this stage

- End-to-end tests on a device. The per-stage AXe (iOS) and Playwright (web) checks cover that. Turning them into a repeatable E2E suite, with Maestro as the Expo guide suggests or AXe `batch` scripts, is a separate stage if you want it.
- Coverage thresholds in CI. There's no CI yet. Run `npx jest --coverage` once at the end and record the numbers in the stage summary. Aim for complete coverage of `src/utils`, `src/features/*/match.ts`, `group-by-year.ts` and the stub fetchers. For components, the target is "every state in the Stage 3 inventory has a test", not a percentage.
- Testing the player, audio or persistence, which don't exist yet.

## 8. Files touched

- New:
  - `jest.setup.ts`
  - `src/test-utils/render-with-providers.tsx`, `src/test-utils/fixtures.ts`
  - `__tests__` folders beside the modules and components listed above
  - `__tests__/routes/*.test.tsx`
- Edited: `package.json` (dev dependencies, `jest` block, `test` scripts), `tsconfig.json` (`types: ["jest"]`), `.gitignore` (`coverage/`), `AGENTS.md` (commands and done checklist)

## 9. Verification

1. `npm test` passes from a clean checkout, with no skipped tests and no console errors or warnings printed during the run. Unexpected `console.error` output counts as a failure.
2. **Prove the tests can fail.** Make each of these temporary breaks, confirm a test fails with a clear message, then revert:
   - `shortDateLabel` built with `new Date(iso)`: the time-zone test fails;
   - remove the apostrophe mapping from `foldCharacter`;
   - make search also match `category`;
   - change "Play {title}" to "Play";
   - make `fetchLecturePage` return the same `nextPageIndex` forever;
   - remove `<Redirect>` from `player.tsx`.
3. `npx expo lint`, `npx tsc --noEmit` (test files included) and `npm run check:theme` pass.
4. `npx jest --coverage`: record the coverage table in the stage summary and point out any gaps in `src/utils` or `src/features`.
5. Spot-check that the app still runs: start it on the iOS simulator and the web build, and open Home. Test-only code (`src/test-utils`) must not be in the bundle (search the web bundle for `render-with-providers`).
