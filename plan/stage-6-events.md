# Stage 6: Events list (composition)

> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 1 (Events stack, `events/[slug].tsx`), Stage 3 (event components, mock events), Stage 4 (infinite-scroll pattern, tabs footer), Stage 5 (Now Playing). **Comes before:** Stage 7 (Event detail).

## Goal

Assemble the Events list from the Stage 3 components and the static data, so it matches [events.png](../docs/artboards/screens/events.png). Search does nothing yet. The only behaviour is opening an event: the card and the rows push `/events/[slug]`, which is still the Stage 1 placeholder until Stage 7 builds Event detail.

## Scope

| Part | This stage | Later |
|---|---|---|
| Events title, subtitle | Static | — |
| Search button (Events) | Rendered. No `onPress` | Search stage: `search?scope=events` |
| "11 events" count chip | Shows `total` from the API response (static for now), never counted | — |
| Latest event card | The newest event (the first item of the first page). **Tapping it opens `/events/[slug]`** | — |
| All events list | `SectionList` grouped by `year`, infinite scroll with a fake fetcher (the same pattern as Stage 4) | Real API: fetcher body only |
| Event row | **Tapping it opens `/events/[slug]`** | — |
| Event detail | Stage 1 placeholder, so that the navigation can be checked | Stage 7 |
| Mini player + tab bar | Visible, unchanged from Stage 4 (static `mockPlayback` lecture) | Stage 7 (event detail rule), player stage |

Not built here: Event detail (Stage 7), search, audio, error and offline states, and a full-screen initial-load skeleton (HANDOFF §8.2).

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point |
| `expo-router` | Pushing inside the Events tab stack, typed `[slug]` params, back behaviour, deep links |
| `expo-data-fetching` | `useInfiniteQuery` for event pages, stub fetchers (AGENTS.md "State management") |
| `vercel-react-native-skills` / `react-native-best-practices` | `SectionList` performance, sticky headers, stable keys, `renderItem` outside JSX |
| `frontend-design` | Required for user-facing UI. Matching the artboards |
| `expo-native-ui` | Safe areas on headerless tab-stack screens |
| `playwright-cli` | Web check, standing in for Android |

## References

- [HANDOFF.md §4.2](../docs/HANDOFF.md) Events. Where they disagree with the decisions below, the decisions win.
- [ARTBOARD-MAP.md §2](../docs/ARTBOARD-MAP.md): y-ranges, margins and token classes. Its "tile shows 31" ⚠ note is overridden: the tile shows the data's `day`.
- [html/screens/events.html](../docs/html/screens/events.html).
- [DESIGN-SYSTEM.md §5.1](../docs/DESIGN-SYSTEM.md) categories, and §12 (emphasis card chips, count chip).
- Decisions recorded in Stage 3 §8:
  - date tiles use the data's `day` / `month` (the start day);
  - colours rotate (`catAt(index)`);
  - venues go through `formatVenue`;
  - totals come from the API.

## 1. Data (stub fetchers, following the Stage 4 pattern)

`src/features/events/events.api.ts`:
- `fetchEventPage(pageIndex): Promise<{ items: EventSummary[]; total: number; nextPageIndex: number | null }>`
  - Pages of 10 over the mock events from Stage 3 (11 events → 2 pages). They are already ordered newest first, as the API will return them. **Don't sort in the app.**
  - `total` is the static `eventsTotal` (11) from `sample.ts`.

`src/features/events/events.queries.ts`:
- `useEventsQuery()`: `useInfiniteQuery`, key `['events', 'list']`. Caching off, as in Stage 4.

`src/features/events/group-by-year.ts`:
- `groupEventsByYear(events): { title: string; data: EventSummary[] }[]`.
- A plain loop that starts a new section whenever `year` changes. It relies on the API order and doesn't sort.

## 2. Events list: `src/app/(tabs)/events/index.tsx`

Replaces the Stage 4 title-only screen. **One `SectionList`.** Everything above "All events" goes in `ListHeaderComponent`, built as a separate component (`src/components/EventsListHeader/index.tsx`).

Top to bottom (ARTBOARD-MAP §2):
1. **`ScreenTitle`** (`pl-gutter pr-bar`, `pt-2`):
   - "Events" (`display`);
   - subtitle "Conferences, programmes and gatherings we have recorded." (`bodySm`, `text-fg-muted`);
   - trailing: a 44 round `IconButton` (surface) with the Search icon, labelled "Search events", with no `onPress`.
2. **Count chip**, `mt-3.5`: `Pill` with `category={1}` (always cat-1), a Radio icon, and "{total} events" from the first page.
3. **`LatestEventCard`**, `mt-5`:
   - overline "LATEST EVENT";
   - title;
   - meta: "{dateRange} · {formatVenue(location)}", leaving out any missing part;
   - chips: "{total} lectures" and `duration`;
   - ochre arrow circle.
   - The whole card is one button, labelled "Open {title}", that pushes `/events/[slug]`.
4. **"All events"** `SectionHeader`, `mt-[34px]`.
5. **Sticky year headers** (`renderSectionHeader`): `<Text variant="label" className="text-fg-muted">`, on a `bg-bg` background so rows don't show through while the header is stuck. Spacing: 16 before the first year, 22 before the next ones.
6. **`EventRow`** per item. The gap between rows is 10.
   - `DateTile`: `day` and `month` from the data, colour `catAt(index)`. **The index counts across the whole list, not within each section**, so the colours keep rotating past a year boundary.
   - Title, plus stats "{total} lectures · {duration} · {dateRange}" in `text-primary`. `dateRange` is shown as the data gives it (`"24 Oct – 31 Oct 2026"`). Note that it differs from the design's shorter "24 – 31 Oct".
   - Venue line with a pin, from `formatVenue(location)`, only when `location` exists (Jummah has none).
   - Chevron. The whole row, labelled "Open {title}", pushes `/events/[slug]`.
7. **Footer:** `LoadingFooter variant="event"` ("Loading more events") while `isFetchingNextPage`.

To get the overall index for the tile colour, flatten the loaded pages once (a plain loop that builds a `slug → index` map), or keep a running index when grouping. Choose the simpler of the two during implementation.

Layout: the screen owns the top inset (headerless tab stack screen). The tabs footer (mini player + tab bar) sits below it, so only add normal bottom spacing. Use `maxWidth: 600`.

## 3. Files touched

- New:
  - `src/features/events/events.api.ts`, `events.queries.ts`, `group-by-year.ts`
  - `src/components/EventsListHeader/index.tsx`
- Rewritten: `src/app/(tabs)/events/index.tsx`
- Edited: `src/data/sample.ts` (`eventsTotal` and event mocks, if Stage 3 missed any)

## 4. Verification

The agent runs these itself: iOS with **AXe** (commands in Stage 4 §9.2), and web with `playwright-cli` standing in for Android.

### 4.1 Static checks
`npx expo lint`, `npx tsc --noEmit` and `npm run check:theme` pass.

### 4.2 iOS: Events list
1. `axe tap --label "Events"`. Screenshot in light and dark mode, and compare with `events.png` region by region (ARTBOARD-MAP §2):
   - title block and the search button's position;
   - "11 events" chip in cat-1;
   - Latest event card: chips, ochre arrow;
   - "All events" heading;
   - year headers;
   - rows: date tile size 60 × 64 and colours rotating cat-1, cat-2, cat-3 …, stats in `primary`, venue line;
   - mini player and tab bar with Events active.
2. Deliberate differences, to list and not fix:
   - the tile shows the start day (24, not 31);
   - the stats show the data's `dateRange` string.
3. Scroll with `axe swipe`:
   - year headers stick, and rows don't show through them;
   - the second page loads (the list ends after 11 events, with no footer left over);
   - tile colours keep rotating across the 2026 → 2025 boundary;
   - the Jummah row has no venue line and no gap where it would be.
4. Tap "Search events": nothing happens.

### 4.3 iOS: opening an event
1. `axe tap --label "Open The Sahaba Radiyyallahu Anhum"` (the Latest event card): the Stage 1 placeholder opens inside the Events tab, showing the slug `the-sahaba-radiyyallahu-anhum`. The tab bar and mini player are still visible.
2. Go back (the placeholder's back control, or a swipe from the left edge): you're on the Events list at the same scroll position.
3. Open an event from a *row*, including Jummah from the 2025 section: the placeholder shows the right slug.

### 4.4 Web (Android stand-in)
1. Click Events, then the Latest event card, then go back, then click a row: the URLs are `/events`, then `/events/<slug>`, and browser back works.
2. Take screenshots of the Events list at 390 × 844 in light and dark, and compare them with `events.png`, using the checklist above.
3. Scroll the list to the end: the second page loads, and the year headers stick.
4. The browser console shows no errors.
