# Stage 3: Components (static presentation layer)

> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 1 (folders, routes) and Stage 2 (tokens, NativeWind, fonts, `Text`).
> **Comes before:** every screen stage. Screens only put these components together and connect them.

## Goal

Before any screen is built, build every reusable UI building block the designs need. Each one should look exactly like the designs, in light and dark. They are **static presentation components**: they render what their props say and nothing else. A development-only gallery route shows each component in every visual state, filled with mock data, so layout, spacing, type, colour and text scaling can be checked against the PNGs before any screen exists.

## Scope

**In scope:** visual structure, styling, every visual *state* (selected, active, playing/paused, empty, loading skeleton), accessibility roles and labels, safe text wrapping and truncation, and both themes.

**Out of scope for this stage:**

| Not here | Added later, in |
|---|---|
| Press handlers, gestures, drag-to-seek, swipe-to-dismiss | Screen stages |
| Player state, audio, queue, resume points | Player stage (`docs/expo-audio.md`) |
| Navigation (`router.push`, `Link`) | Screen stages |
| Search matching, debounce, recent-search saving | Search screen stage |
| Data fetching, pagination, TanStack Query, Zustand | Screen and data stages (AGENTS.md "State management") |
| The play-button radius animation, press animations | Screen stages (`expo-animation`) |
| Error and offline UI (error cards, retry, offline sheet) | Error-states stage (HANDOFF §9, `docs/ERROR-STATES.md`) |

**Rules that keep the components ready for wiring later, without wiring them now:**
- A control that will become tappable (a button, a row, a chip) renders as a `Pressable` with `accessibilityRole="button"` and its final `accessibilityLabel`. Its props type includes an optional `onPress?: () => void`, but **nothing in this stage passes one**. That way, the screen stages connect behaviour without changing any component.
- Visual state is a prop, never internal state. Use `state: 'idle' | 'paused' | 'playing'` and `selected: boolean`, not `useState`.
- The text input in `SearchInput` is controlled by its props (`value`, `placeholder`). No submit, no clearing, no validation.
- Numbers and labels arrive as **display-ready strings** ("35:48", "31 Oct", "2h 34m"), so components contain no formatting or business logic. The gallery passes mock values. The screen stages compute them with the formatting helpers (HANDOFF §4.7).

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point. SDK 58 install rules |
| `expo-design-system` | Variant/size/state prop conventions, when to pull a component out, auditing for drift (hardcoded spacing, fonts, colours) |
| `frontend-design` | Required for every user-facing UI change (root AGENTS.md). Matching the designs and visual polish |
| `vercel-composition-patterns` | Explicit `variant` props instead of piles of boolean props. Slot-style props for `TopBar` and `HeroCard` |
| `vercel-react-native-skills` / `react-native-best-practices` | Row components that will sit in `FlatList`/`SectionList` must be cheap: no inline component definitions, flat views, `expo-image` for images |
| `expo-native-ui` | Touch targets, how SF Symbols compare with lucide, how `TextInput` looks natively in both themes |
| `playwright-cli` | Screenshot the gallery on web in light and dark, and compare with the PNGs |

Not needed in this stage: `expo-animation` (no motion yet), `expo-ui` (no sheets or pickers in the designs' happy path), `expo-data-fetching`.

## References

- **Data shape:** [docs/src/data/sample.ts](../docs/src/data/sample.ts). This is the primary reference for prop shapes (see §2).
- **Visual reference:**
  - [docs/html/screens/](../docs/html/screens/): working pages, opened in a browser and measured with devtools.
  - [docs/artboards/screens/](../docs/artboards/screens/): 2× PNGs.
  - [docs/ARTBOARD-MAP.md](../docs/ARTBOARD-MAP.md): every region mapped to its HTML line, spacing and token classes. Its **⚠ Build** notes override the HTML.
- **Spec:**
  - [docs/HANDOFF.md](../docs/HANDOFF.md): §1 principles, §4.1–§4.6 per screen, §4.6 mini player + tab bar.
  - [docs/DESIGN-SYSTEM.md](../docs/DESIGN-SYSTEM.md): §5.1 category rules, §10 type/radii/spacing, §11 shadows, **§12 component recipes**, §13 15-second icons, **§15 the complete component set**.
  - Where the HTML and HANDOFF.md disagree, HANDOFF.md wins.
- **Tokens:** `src/theme/tokens.ts` (`catClasses`, `catAt`, `catForTopic`, `palette`, `size`, `radius`, `useThemeColors`, `useThemeShadows`) and the component tokens in `src/components/{MiniPlayer,TabBar,Skeleton,Search}/tokens.ts`. All of these come from Stage 2.

## 1. Dependencies

- `npx expo install react-native-svg lucide-react-native`. `react-native-svg` is needed for the rosette (event cards), the logo badge, the 15-second icons and the spinner. The Now Playing cover is a bitmap shown with `expo-image`, which is already installed (§3.2). lucide covers the rest (HANDOFF §1 lists the icons).
- Before writing code, check the current lucide-react-native README for SDK 58 / React Native 0.88 notes.

## 2. Data: what `sample.ts` gives us and what's missing

The updated `docs/src/data/sample.ts` is shaped like the real API: `Lectures` (list items), `Lecture` (a detail item), `Events` and `Event`. Copy it to `src/data/sample.ts` and make it usable. Keep every existing field name and value. **Add** fields and mock records; don't rename anything.

### 2.1 Make it importable and typed
- The constants are neither exported nor typed. Add `export type LectureSummary`, `Lecture` (summary plus the detail fields), `EventSummary`, and export the arrays (`lectures`, `events`).
- Shared fields: `slug` (identity, and the `[slug]` route param), `title`, `author`, `date` (ISO with time and offset), `duration` ("35:48" or "1:02:05" string), `masjid`. Detail-only fields: `id`, `event` (the event title), `category: string[]`, `url`.
- The audio file is always `url` (confirmed; `sample.ts` now uses it everywhere).

### 2.2 Gaps found against the designs (add as mock data)

| Gap | Needed by | Mock addition |
|---|---|---|
| Only 2 lectures | Home list shows 6+ rows plus placeholders (ARTBOARD-MAP §1) | 10+ lectures, with variety: 2-line and 3-line titles, a missing `duration`, a missing `masjid` |
| Event → lectures link | Event detail numbered rows | Give the 4 Sahaba lectures `event: "The Sahaba Radiyyallahu Anhum"`, in data order |
| Only 2 events, one year | Events `SectionList` with years 2026 + 2025, plus an event without a venue (HANDOFF §4.2) | 11 events, including Jummah (2023–2025, no `location`) |
| Series (Local / Guest / Islāhi Majlis) | Home filter chips, empty-series state | `lectureSeries` label list. `series` on each lecture, for later screens |
| Topic → category colour | Now Playing topic pill, lecture search tiles | **Decided:** no fixed topic map. Colours rotate through cat-1 … cat-5 and wrap when there are more topics (see §2.3). The data's `category` strings (`"sahaba r.a"`) are used as they are; no topic key is needed |
| Topic labels ("Ṣaḥābā r.a") | Topic pill text | `topicLabels` (it was in the old sample file) |
| Totals ("81 lectures", "11 events") | Home section header, Events count chip | The API returns these counts; the app never counts. For now they are static values in `sample.ts` (`latestLecturesTotal = 81`, and an events total of 11), passed to components as display strings |
| Hero date with full month ("24 – 31 October 2026") | Event hero card | **Decided:** the API will return this string already formatted. Add it to the mock events as `dateRangeLong` (rename to the API's field name when it's known). The app does no date maths for it |
| Date tile day | Event rows | **Decided:** show the data's `day` / `month` as they are (`day: "24"`, the start day). This overrides HANDOFF §4.2, which asks for the end day (31). The ARTBOARD-MAP §2 ⚠ note about showing 31 no longer applies |
| Playback snapshot | Continue listening, mini player, Now Playing, active rows | `mockPlayback = { lectureSlug, elapsed: "16:05", remaining: "-30:16", progress: 0.35, minutesLeft: "31 min left", sourceLabel: "Latest lectures" }` |
| Recent searches | Search empty-query state | `seedRecentSearches` (Ṣaḥābā, Islamic finance, Fire, Sacrifices, Ummah). No `popularTopics`: that section is removed from Search |
| Search results with highlights | `SearchResultRow` | `mockSearchResults` for the query "Ṣaḥābā", with precomputed `titleParts: { text, highlighted }[]`, so no matching logic is needed |
| Display casing | Venue lines | **Decided:** the app transforms it. Data has `"MASJID MUSWALLA, HIGHLANDS"`; show "Masjid Muswalla, Highlands". Add `formatVenue()` (§2.4). Components still receive the display string; the gallery and later the screens call `formatVenue` before passing it |
| Spelling | — | The data uses "Ş" (S-cedilla). The designs use "Ṣ" (S with a dot below). Keep both as they are (HANDOFF §6). Search folding covers them later |

### 2.3 Category colour rule (decided)

Category colours carry no meaning. They only tell items apart, so assign them by **rotation**: cat-1 → cat-2 → … → cat-5, then back to cat-1.
- **Lists by position** (event date tiles, search result tiles): `catAt(index)` (already in tokens.ts).
- **Topics** (Now Playing topic pill, lecture search tiles): a topic should keep the same colour on every screen. So rotate by the topic's position in **one ordered list of known topics**, rather than by its position in whichever list is on screen.
  - The list is `topicOrder`: every distinct `category` string in the order it first appears in the data. It's built once in `src/data/sample.ts`; later it comes from the API.
  - `catForTopic(topic)` returns `catAt(topicOrder.indexOf(topic))`. An unknown topic falls back to cat-1.
- **Why not `Math.random()`:** a truly random colour changes on every render and on every launch, so a row would flicker between colours. Rotation looks varied and stays stable.
- This **replaces** the fixed `topicCategory` map (`sahaba: 1, finance: 2, fire: 3`) and `catForItem` from `docs/src/theme/tokens.ts`. Stage 2 notes the change. Update DESIGN-SYSTEM §5.1 and HANDOFF §5 (the "by topic" rule) so the docs match.
- `DateTile`, `Chip`, `Pill` and `SearchResultRow` just take a `category: Category` prop. Which rule supplies it is decided by whoever renders the component.

### 2.4 Venue display transform (decided)

`src/utils/format-venue.ts` exports `formatVenue(raw: string): string`:
- If the string has no lower-case letters (it's all caps, like `"MASJID MUSWALLA, HIGHLANDS"`), lower-case it and capitalise the first letter of each word. Keep the punctuation as it is, so the result is `"Masjid Muswalla, Highlands"`.
- Otherwise return it unchanged, so names that are already mixed case (`"Nuʿmān Ibn Thābit, Quatre Bornes"`) keep their diacritics and spelling.
- Write it as a plain loop over the words. Show both examples above in the gallery to check them. This is display formatting only, not business logic.

Keep the mock in `src/data/sample.ts` (data matching the API shape) and `src/data/mock-ui.ts` (UI-only snapshots: `mockPlayback`, `mockSearchResults`, display strings). The screen stages replace `mock-ui.ts` with real computed values and then delete it.

## 3. Component inventory

Folder rules come from Stage 1: generic pieces are kebab-case files in `components/ui/`; components with their own folder use PascalCase and contain `index.tsx`, plus `tokens.ts` when they have component tokens. The **Used on** column is the reusability analysis: anything used on two or more screens was a candidate to pull out, and anything used on one screen was pulled out only if it is a repeated row or a large self-contained block.

### 3.1 Primitives: `src/components/ui/`

| Component | Props (visual) | Variants / states | Used on | Spec |
|---|---|---|---|---|
| `Text` (Stage 2) | `variant`, `className`, `tabular`, `numberOfLines` | 12 type variants | All | DS §10 |
| `Icon` | `icon` (lucide component), `size`, `color: SemanticColor`, `filled?` | — | All | HANDOFF §1. Resolves the colour with `useThemeColors()`, so callers never pass hex. Play/Pause are filled |
| `IconButton` | `icon`, `accessibilityLabel`, `size: 'md' \| 'lg'`, `tone`, `onPress?` | size md 44 / lg 60. tone `surface` (`bg-surface-2`), `ghost` (transparent), `ground` (`bg-bg`), `primary` (`bg-primary`) | Event detail (back, share), Events (search), Search (back), Now Playing (close, skip), rows | DS §12, ARTBOARD-MAP §3–§5 |
| `PlayPauseButton` | `state: 'play' \| 'pause'`, `variant`, `accessibilityLabel`, `onPress?` | `row` 44 (`bg-bg`, active `bg-primary`), `hero` 52 (`bg-secondary`), `mini` 44 (transparent on the mini player), `nowPlaying` 96 × 76 (`bg-primary`, radius 26 playing / 38 paused, `playButton` shadow) | Home rows, Event rows, Continue listening, Mini player, Now Playing | HANDOFF §4.1–§4.6. Its own component because the icon, fill and size rules vary by state |
| `Chip` | `label`, `selected`, `onPress?` | 40 high. Selected `bg-primary` / `text-primary-fg`, otherwise `bg-surface-2` / `text-fg` | Home filter chips | DS §12. No category variant: its only user, Search's "Popular topics", was removed |
| `Pill` | `label`, `icon?`, `variant`, `size`, `trailingIcon?`, `onPress?` | `onEmphasis` (`bg-emphasis-fg/[0.12]`), `category` (cat-N), `outline` (`border-[1.5px] border-border-strong`). sizes 28 / 32 / 34 | Hero cards (info chips, "EVENT"), Events count chip, Now Playing topic + event link | DS §12, ARTBOARD-MAP §2–§4 |
| `SurfaceCard` | `children`, `padding` | `bg-surface-1 rounded-row` | Empty series, no results, no recents, recents card | ARTBOARD-MAP §1, §5 |
| `EmptyState` | `title?`, `message` | with or without a title | Home (empty series), Search (no results, no recents) | HANDOFF §4.1, §4.5 |
| `SectionHeader` | `title`, `size: 'section' \| 'small'`, `trailing?: ReactNode` | trailing = count text or a text button ("Clear all") | Home, Events, Event detail, Search | ARTBOARD-MAP §1–§5 (note the margin-top differences: 34 vs 30) |
| `Divider` | — | `h-px bg-border` | Recent searches card | DS §10 |
| `ProgressBar` | `progress: number` (0–1), `variant` | `onEmphasis` (4px, `secondary` on `emphasis-fg/[0.18]`), `miniLine` (3px `miniPlayer.progress` along the bottom edge) | Continue listening, Mini player | DS §12 |
| `SeekBar` | `progress`, `elapsed`, `remaining`, `accessibilityValue` | 5px `track`, `primary` fill, 16px thumb with a 2.5px `border-bg` ring, touch area at least 44 high, tabular times underneath | Now Playing | HANDOFF §4.4. Visual only: no drag |
| `Spinner` | `size` | ring `fg` at `spinner.trackOpacity`, arc `primary` (svg). Static arc in this stage; rotation comes later | Loading footers | DS §6 Skeleton |
| `IconLabel` | `icon`, `label`, `tone` | 16px icon + one-line text | Now Playing venue/date, Event row venue | ARTBOARD-MAP §2, §4 |

### 3.2 Icons and artwork: `src/components/icons/`, `src/components/artwork/`

| Component | Props | Notes | Used on |
|---|---|---|---|
| `Skip15Icon` | `direction: 'back' \| 'forward'`, `size` (22 / 26), `color` | Paths from DS §13. Back mirrors the arc only, not the digits | Now Playing, Mini player |
| `LogoBadge` | `size` (40) | SVG from `html/screens/home.html` L10, fixed `palette` | Home header |
| `Rosette` | `size` | SVG from `html/screens/now-playing.html` L17. Fixed `palette`, the same in both themes. **Not used for the Now Playing cover**: that's the bitmap below | Latest event card, Event hero card |
| `CoverArt` | `className` (size comes from the parent) | **Uses `docs/cover-art.jpg`, not a hand-drawn SVG.** Copy it to `assets/images/cover-art.jpg`. Render it with `expo-image`, `contentFit="cover"`, `contentPosition="center"`. The image is 896 × 1200 portrait, so a square frame crops the top and bottom: the moon, dome and minaret stay visible. Decorative: `accessible={false}`. Same image in both themes | Now Playing (`NowPlaying/Artwork`) |

### 3.3 Composite components: `src/components/<Name>/`

| Component | Built from | States to show | Used on | Spec |
|---|---|---|---|---|
| `HeroCard` | optional `Rosette` + slots (`overline`, `title`, `children`) | presets: `continueListening` (**no rosette**: no artwork in the top-right corner, and the text uses the full card width), `latestEvent` and `eventHero` (rosette size, offset and text right inset from DS §12) | Home, Events, Event detail | DS §12 (one shell, three presets). The rosette is part of the preset, not a separate boolean prop |
| `ContinueListeningCard` | `HeroCard` (`continueListening` preset), `PlayPauseButton hero`, `ProgressBar onEmphasis`, tabular `Text` | playing / paused | Home | HANDOFF §4.1.4. **Deliberate difference from the artboard:** no rosette in the top-right corner, for now |
| `LatestEventCard` | `HeroCard`, `Pill onEmphasis` ×2, arrow circle (`bg-secondary`) | — | Events | HANDOFF §4.2.3 |
| `EventHeroCard` | `HeroCard`, "EVENT" `Pill`, wrapped info `Pill`s | with / without venue | Event detail | HANDOFF §4.3.2 |
| `LectureRow` | `Text` ×3, `PlayPauseButton row` | `idle`, `active-paused`, `active-playing`; 2-line title; missing duration | Home | HANDOFF §4.1.5 |
| `NumberedLectureRow` | number tile, `Text` ×3, `PlayPauseButton row` | idle ("31 Oct · 35:48"), paused ("Paused · 16:05 / 46:21"), playing ("Now playing · …"); 3-line title | Event detail | HANDOFF §4.3.4–5 |
| `DateTile` | `Text` | `size: 'row'` 60 × 64 / `'result'` 48, `category` | Event rows, event search results | HANDOFF §4.2, §4.5 |
| `EventRow` | `DateTile`, `Text`, `IconLabel` (pin), chevron | with / without venue | Events | HANDOFF §4.2.4 |
| `Skeleton/` (`SkeletonRow`, `LoadingFooter`) | `skeleton` tokens, `Spinner` | `variant: 'lecture' \| 'event'`; footer label "Loading more lectures/events" | Home, Events | ARTBOARD-MAP §1–§2 |
| `ScreenTopBar` | slots `left`, `center`, `right` (44 spacer by default) | Event detail ("Event"), Now Playing ("Playing from" + source) | Event detail, Now Playing | HANDOFF §4.3.1, §4.4.1 |
| `HomeHeader` | `LogoBadge` + name / tagline | — | Home | ARTBOARD-MAP §1 |
| `ScreenTitle` | title, subtitle, `trailing` | — | Events | ARTBOARD-MAP §2 |
| `Search/SearchFieldButton` | search icon + placeholder text, 52 pill | — | Home | HANDOFF §4.1.3 (a button that looks like a field) |
| `Search/SearchInput` | `TextInput` in a 48 pill, trailing `mic` or `clear` | empty (mic) / has text (✕); placeholder per scope | Search | HANDOFF §4.5. No autofocus or submit yet |
| `Search/RecentSearchList` | `SurfaceCard`, rows (clock, text, remove ✕), `Divider` | 5 rows / empty card | Search | HANDOFF §4.5 |
| `Search/HighlightedText` | `parts: { text, highlighted }[]` | with / without highlight | Search results | `search.highlight` tokens |
| `Search/SearchResultRow` | tile (AudioLines `Icon` or `DateTile result`), `HighlightedText`, scholar, meta, chevron | `kind: 'lecture' \| 'event'` | Search | HANDOFF §4.5 (`rounded-row`, ⚠ not 20) |
| `NowPlaying/Artwork` | `CoverArt`, `artwork` shadow | light (shadow) / dark (none) | Now Playing | HANDOFF §4.4.2. A square frame: `w-full aspect-square rounded-card`, which is 342 at 390 wide (no hardcoded width). The shadow (`useThemeShadows().artwork`) goes on an outer `View`. The inner `View` has `overflow-hidden` to clip the image to radius 28, because a clipping view would also clip its own shadow |
| `NowPlaying/TrackInfo` | title, scholar, `IconLabel` ×2, tags row (`Pill category` + `Pill outline`) | no venue, no event, topic `other` (pill hidden) | Now Playing | HANDOFF §4.4.3 |
| `NowPlaying/PlayerControls` | `IconButton lg` + `Skip15Icon` ×2, `PlayPauseButton nowPlaying` | playing / paused | Now Playing | HANDOFF §4.4.5 |
| `MiniPlayer` | title / scholar (no artwork), `PlayPauseButton mini`, forward-15 `IconButton`, `ProgressBar miniLine` | playing / paused, light (`inverse`) / dark (`emphasis` + outline) | All tab screens | HANDOFF §4.6, `miniPlayer` tokens. **Deliberate difference from the artboard:** no cover art or thumbnail. The text block starts at the left padding, and the `miniPlayer.thumbBg` token stays unused |
| `TabBar` (visual: `TabBarItem`) | icon, label, active pill | active / inactive | Tab layout | HANDOFF §4.6, `tabBar` tokens. The Stage 1 navigator wiring stays; this stage replaces only how it looks |

**Deliberately not components:** the year header (just `<Text variant="label" className="text-fg-muted">`), the "N lectures found" heading (just `Text`), and screen-level layout (lists, padding, insets belong to the screens). The Now Playing screen is not one big component. It is `ScreenTopBar` + `Artwork` + `TrackInfo` + `SeekBar` + `PlayerControls`, put together in the screen stage. A single giant "AudioPlayer" component would hide the parts the screen needs to connect separately.

### 3.4 Hierarchy and ownership

```
ui/ primitives  ──►  icons/ + artwork/  ──►  composites (HeroCard, rows, MiniPlayer …)  ──►  screens (later stages)
     Text, Icon, IconButton, PlayPauseButton, Chip, Pill, SurfaceCard, EmptyState,
     SectionHeader, Divider, ProgressBar, SeekBar, Spinner, IconLabel
```

- Composites import only from `ui/`, `icons/`, `artwork/`, `theme/` and their own `tokens.ts`. Never from `features/` or `app/`. This stage has no data hooks.
- A primitive never knows about lectures or events. Domain names (`author`, `masjid`) appear only in composite props.
- Composite props mirror the `sample.ts` field names where they show data (`title`, `author`, `masjid`, `duration`). State and display-only values (`state`, `metaLabel`, `progress`) are separate props.

## 4. Implementation order

Build bottom-up. Each step is added to the gallery and checked before the next starts.

1. **Data:** copy and type `sample.ts`, add the mock records from §2.2, build `topicOrder`, add `catForTopic` (§2.3) and `formatVenue` (§2.4), and create `mock-ui.ts`.
2. **Gallery route:** `src/app/dev/components.tsx`, guarded with `__DEV__` like `/dev/tokens`. It has one section per component and shows every state from §3, on `bg-bg` with the real gutters (`px-gutter`).
3. **Icons and artwork:** `Icon`, `Skip15Icon`, `LogoBadge`, `Rosette`, `CoverArt` (copy `docs/cover-art.jpg` to `assets/images/` first). Everything else depends on these.
4. **Primitives:** `IconButton`, `PlayPauseButton`, `Chip`, `Pill`, `SurfaceCard`, `EmptyState`, `SectionHeader`, `Divider`, `IconLabel`, `ProgressBar`, `SeekBar`, `Spinner`.
5. **Cards:** `HeroCard`, then `ContinueListeningCard`, `LatestEventCard`, `EventHeroCard`.
6. **Rows:** `LectureRow`, `NumberedLectureRow`, `DateTile`, `EventRow`, `Skeleton` (row + footer).
7. **Headers:** `ScreenTopBar`, `HomeHeader`, `ScreenTitle`.
8. **Search:** `SearchFieldButton`, `SearchInput`, `RecentSearchList`, `HighlightedText`, `SearchResultRow`.
9. **Now Playing parts:** `Artwork`, `TrackInfo`, `PlayerControls`.
10. **Shared bar:** `MiniPlayer`, `TabBar` look (`TabBarItem`).
11. **Layout check:** in the gallery, add a "screen mock" section that stacks the components in the Home order with the mock data. Compare it with `artboards/screens/home.png` to catch spacing problems between components early.

## 5. Quality bar for every component

- Classes come only from semantic tokens and component tokens. `npm run check:theme` passes (no hex outside `tokens.ts` and artwork).
- Touch targets are at least 44 × 44 (`h-touch w-touch`). Every icon button has an `accessibilityLabel` with the HANDOFF wording ("Back 15 seconds", "Play {title}", "Open event: {name}").
- Use `minHeight` instead of fixed `height` wherever text sits inside (rows, chips, pills, buttons), so large text grows the container (AGENTS.md "Text & font scaling"). Where the design fixes a height (40 chips, 34 tags, 52 search field), use it as `minHeight` and check the largest Dynamic Type size (HANDOFF §8.2 item 8).
- `numberOfLines` limits come from the spec: Home title 2, Event detail title 3, Now Playing title 2, venue / source lines 1.
- No `allowFontScaling={false}`. Times use `tabular`.
- Row components are pure, take only primitive or simple props, and define no components inline. They will be rendered in long lists.
- Write one-line comments only for non-obvious decisions, such as why `PlayPauseButton` has four variants. No comments that describe what the code does.

## 6. Files touched

- New:
  - `src/data/sample.ts`, `src/data/mock-ui.ts`
  - `src/components/ui/*` (14 primitives)
  - `src/components/icons/{skip-15-icon,logo-badge}.tsx`, `src/components/artwork/{rosette,cover-art}.tsx`, `assets/images/cover-art.jpg` (copied from `docs/cover-art.jpg`)
  - the composite folders in §3.3
  - `src/app/dev/components.tsx`
- Edited: `src/components/TabBar/index.tsx` (look only), `package.json` (`react-native-svg`, `lucide-react-native`), `AGENTS.md` (a short "Components" note: where primitives live, and the "static props, `onPress?` optional" rule)

## 7. Verification

1. `npx expo lint`, `npx tsc --noEmit` and `npm run check:theme` pass.
2. iOS simulator, `/dev/components` in light and dark: every state from §3 renders. Compare each section side by side with its PNG region, using the y-ranges in ARTBOARD-MAP:
   - type sizes and weights;
   - padding and gaps;
   - radii;
   - colours (light, plus the dark Now Playing PNG for dark values).
3. Web build, checked with `playwright-cli`:
   - full-page screenshots of `/dev/components` with `colorScheme` set to light and to dark;
   - an element screenshot of the "screen mock" section next to `artboards/screens/home.png` at 390 wide.
4. Largest Dynamic Type size on iOS: text wraps and containers grow, with no clipping or overlap.
5. VoiceOver spot check on the gallery: every icon button reads its label, and the `SeekBar` reads its `accessibilityValue`.
6. Grep `src/components` for `useState`, `router`, `fetch` and `expo-audio`. Expect no matches: this stage adds no state, navigation or audio.

## 8. Decisions and open questions

Decided (11 Nov 2026):
1. The audio field is `url`.
2. Category colours rotate through the five categories and wrap (§2.3). There is no fixed topic → colour map.
3. Event date tile colours are assigned by position, with the same rotation (`catAt(index)`).
4. Venue strings are transformed for display with `formatVenue` (§2.4).
5. The event hero's long date range ("24 – 31 October 2026") will come from the API as a ready-made string.
6. Event date tiles show the data's `day` / `month` (the start day, "24"), not the end day. Update HANDOFF §4.2 and the ARTBOARD-MAP §2 ⚠ note to match.

No open questions remain from `sample.ts`.
