# Stage 7: Event detail (composition)

> **Status: ✅ Done (11 Nov 2026).** Verified on the iOS simulator (Expo Go + AXe) and the web build, light and dark: match with `event-detail.png`; the mini player showing the event's first lecture on Event detail and the `mockPlayback` lecture elsewhere (`useSegments` / `useGlobalSearchParams` do update inside the custom tab bar); row and play-button taps opening Now Playing with the event as "Playing from"; generated lectures (Jummah, 8 rows) opening too; Share and the mini player controls doing nothing; Back; deep links to a known and an unknown event; the largest text size. Deliberate differences: row 01 is the active row; the card and rows keep the label "Open event: {title}". Generated copies keep their source lecture's fields, so their Now Playing event pill shows the source lecture's event.
> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 3 (event components), Stage 4 (tabs footer, mock-library pattern), Stage 5 (`openNowPlaying`, Now Playing), Stage 6 (Events list, `events.api.ts`, `events.queries.ts`).

## Goal

Build the Event detail screen in the same spirit as the earlier screens. It is assembled from the Stage 3 components and static data, so it matches [event-detail.png](../docs/artboards/screens/event-detail.png), and it has no functionality. There are two behaviours:
1. Tapping a lecture opens Now Playing for that lecture.
2. Back returns to the Events list. You need a way out of a pushed screen, so this is the one control that works besides the lectures.

While Event detail is on screen, the mini player shows **the event's first lecture**. It is static, and its controls do nothing.

## Scope

| Part | This stage | Later |
|---|---|---|
| Back button | `router.back()` | — |
| Share button | Rendered. No `onPress` | Undecided (HANDOFF §6) |
| Hero card | Static: title, `dateRangeLong`, info pills | — |
| Numbered lecture rows | Static data, in data order. **The row or its play button opens Now Playing** for that lecture | Player stage: sets the queue to the event and starts playback |
| Active row look | The first row shows the "active, paused" look, matching the mini player | Player stage: whichever lecture is actually loaded |
| Mini player | Shows the event's first lecture (title, author, mock progress). Controls without `onPress` | Player stage: shows the loaded lecture, on every screen |
| Tab bar | Visible, with Events active (the screen is pushed inside the Events tab) | — |

Not built here: share, audio, the queue, swipe gestures, and error states.

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point |
| `expo-router` | `[slug]` param inside the Events tab stack, `<Redirect>`, reading the focused route from the tabs footer (`useSegments`, `useGlobalSearchParams`) |
| `expo-data-fetching` | `useQuery` for one event and its lectures, with a stub fetcher |
| `vercel-react-native-skills` | `FlatList` with a header component, pure rows |
| `frontend-design` | Required for user-facing UI. Matching the artboard |
| `expo-native-ui` | Safe areas on a headerless screen inside a tab stack |
| `playwright-cli` | Web check, standing in for Android |

## References

- [HANDOFF.md §4.3](../docs/HANDOFF.md) Event detail, and §4.6 mini player.
- [ARTBOARD-MAP.md §3](../docs/ARTBOARD-MAP.md): y-ranges, margins (hero margin 14 24 0, "Lectures from this event" margin-top 30), row specs.
- [html/screens/event-detail.html](../docs/html/screens/event-detail.html).
- [DESIGN-SYSTEM.md §12](../docs/DESIGN-SYSTEM.md): emphasis-card chips and the `HeroCard` `eventHero` preset (rosette 240 at right −90 / top −80).
- Decisions in Stage 3 §8: venues go through `formatVenue`; `dateRangeLong` comes from the API; totals come from the API.

## 1. Data

In `src/features/events/events.api.ts`, add `fetchEventBySlug(slug): Promise<{ event: EventSummary; lectures: Lecture[] } | null>`.
- The API will return an event's lectures together with the event. The stub picks the mock lectures whose `event` equals the event's title, in data order. **Don't sort.**
- For a mock event with no lectures of its own (most of the 11), the stub repeats the sample lectures in order until there are `event.total` of them, with unique `--N` slugs. This way every detail page has rows. Leave a comment that this is mock-only.
- Those `--N` slugs must open in Now Playing too. So move Stage 4's repeat-and-suffix code into one small shared function in `src/data/mock-repeat.ts`. Both `lectures.api.ts` and `events.api.ts` use it, and `fetchLectureBySlug` (Stage 5) can find every generated slug. One copy means the two lists can't drift apart.

In `src/features/events/events.queries.ts`, add `useEventQuery(slug)`: `useQuery`, key `['events', 'detail', slug]`, caching off (AGENTS.md).

## 2. Screen: `src/app/(tabs)/events/[slug].tsx`

Replaces the Stage 1 placeholder. **One `FlatList`** of numbered rows. The top bar and the hero card form the `ListHeaderComponent` (a separate component, `src/components/EventDetailHeader/index.tsx`).

1. **`ScreenTopBar`** (`px-bar`, owns the top inset, since the tab stack has no header):
   - left: 44 surface `IconButton` ChevronLeft, labelled "Back", `onPress={router.back}`;
   - centre: "Event" (`title`);
   - right: 44 surface Share button, labelled "Share event", with no `onPress`.
2. **`EventHeroCard`** (`eventHero` preset, with its rosette), margins 14 24 0:
   - "EVENT" pill with a Radio icon;
   - title (`h1`);
   - `dateRangeLong` ("24 – 31 October 2026");
   - wrapped info pills: Layers "{total} recorded lectures", Clock `duration`, MapPin `formatVenue(location)`, the last only when `location` exists.
3. **`SectionHeader`** "Lectures from this event", `mt-[30px]`, `px-gutter`, with the trailing count `event.total`, as a number only.
4. **`NumberedLectureRow`** per lecture, in data order, `mt-3` before the first row and 10 between rows:
   - number: two digits ("01", "02" …) from the row index, written in a named helper `lectureNumberLabel(index)`;
   - title (3 lines max) and author;
   - **row 01** (the event's first lecture, the same one as the mini player): `state="paused"`, meta "Paused · {mockPlayback.elapsed} / {duration}";
   - **every other row:** `state="idle"`, meta "{shortDateLabel(date)} · {duration}", leaving out any part that's missing;
   - row press and play-button press: `openNowPlaying(lecture.slug, { fromEventSlug: event.slug })`;
   - play button label: "Play {title}".
5. **Unknown slug:** `<Redirect href="/events" />`, the same guard pattern as Stage 5.

Layout: `bg-bg`, `maxWidth: 600`. The tabs footer sits below the screen, so the list only needs normal bottom spacing.

**Deliberate difference from the artboard:** the artboard shows row **02** paused. Here, row **01** has the active look, so the list agrees with the mini player.

## 3. "Playing from" an event (small Stage 5 extension)

- `openNowPlaying(slug, options?)` (`src/features/player/open-now-playing.ts`) gains an optional `fromEventSlug`, which it passes on as a route param.
- `src/app/player.tsx`: when `fromEventSlug` is present, the top bar source shows that event's title (from `useEventQuery`). Otherwise it shows "Latest lectures" (HANDOFF §4.4.1).
- Write this as a small `if`, not a lookup table. There are only two sources until the search stage.

## 4. Mini player: the event's first lecture

The mini player lives in the tabs footer (Stage 4), which every tab screen shares. So the footer decides what to show from the route that is currently focused:

- `TabsFooter` reads the route with `useSegments()` and `useGlobalSearchParams<{ slug?: string }>()`.
- **On Event detail** (the segments end in `events` / `[slug]`): it calls `useEventQuery(slug)` and shows `lectures[0]` (title and author), with `mockPlayback.progress` for the progress line.
- **Everywhere else:** it shows the `mockPlayback` lecture, as in Stage 4.
- Put this choice in one named function, `pickMiniPlayerLecture(…)`, with a `// TODO(player stage)` comment. The real player store replaces it with "whatever lecture is loaded".
- The controls stay without `onPress`, and the accessibility labels don't change.
- Before relying on it, check in the expo-router docs that `useSegments` / `useGlobalSearchParams` update inside a custom `tabBar`. If they don't, use the `state` prop the tab bar already receives: the focused tab's nested route and its params.

## 5. Files touched

- New: `src/app/(tabs)/events/[slug].tsx` (replaces the placeholder), `src/components/EventDetailHeader/index.tsx`, `src/data/mock-repeat.ts`
- Edited:
  - `src/features/events/events.api.ts`, `events.queries.ts`
  - `src/features/lectures/lectures.api.ts` (uses `mock-repeat.ts`)
  - `src/features/player/open-now-playing.ts`, `src/app/player.tsx` (event source)
  - `src/components/TabBar/tabs-footer.tsx` (mini player lecture)
  - `src/utils/format-time.ts`, only if `shortDateLabel` needs anything more

## 6. Verification

The agent runs these itself: iOS with **AXe** (commands in Stage 4 §9.2), and web with `playwright-cli` standing in for Android.

### 6.1 Static checks
`npx expo lint`, `npx tsc --noEmit` and `npm run check:theme` pass.

### 6.2 iOS: visual match
1. Events tab, then `axe tap --label "Open The Sahaba Radiyyallahu Anhum"`. Take screenshots in light and dark mode.
2. Compare with `event-detail.png` region by region (ARTBOARD-MAP §3):
   - top bar: 44 round back and share buttons, "Event" centred;
   - hero card: radius 28, rosette 240 in the corner, "EVENT" pill, title, long date, wrapped pills;
   - "Lectures from this event" with "4";
   - rows: number tiles (cat-1, and `primary` on the active row), 3-line titles, meta styles;
   - mini player and tab bar with Events active.
3. Deliberate differences, to list and not fix: row 01 is the active row (not 02); the mini player has no thumbnail.

### 6.3 iOS: behaviour
1. **Mini player:** on Event detail it shows lecture 01's title. Tap "Back": on the Events list (and on Home) it shows the `mockPlayback` lecture again. Open a different event, such as Jummah: the mini player shows *that* event's first lecture.
2. **Lecture → Now Playing:** `axe tap --label "Play {row 03 title}"` opens Now Playing for row 03. The top bar reads "Playing from" / "The Sahaba Radiyyallahu Anhum". Then tap a row *body* (by its coordinates from `describe-ui`): it opens too. "Minimise player" returns to Event detail.
3. **Generated lectures:** open an event with no mock lectures of its own. It shows `total` rows. Tapping one opens Now Playing for that lecture, not a redirect.
4. **Placeholders:** "Share event", and the mini player's "Open player", "Pause" and "Skip forward 15 seconds": nothing happens, and Metro logs no errors.
5. **Back:** returns to the Events list at the same scroll position.
6. **Deep links:** `xcrun simctl openurl booted "ulamamoris://events/the-sahaba-radiyyallahu-anhum"` opens the detail with the mini player showing lecture 01, and Back goes to the list. `ulamamoris://events/unknown` lands on the Events list.
7. **Font scaling:** at the largest Dynamic Type size, long titles wrap within 3 lines, and the number tiles and play buttons keep their place.

### 6.4 Web (Android stand-in)
1. `/events`, click the Latest event card: you're at `/events/<slug>` and the mini player shows lecture 01. Click a row's play button: `/player?slug=…&fromEventSlug=…`, with the event title as the source. Browser back retraces the steps.
2. Take screenshots at 390 × 844 in light and dark, and compare them with `event-detail.png`, using the checklist in §6.2.
3. Load `/events/unknown` directly: it redirects to `/events`.
4. The browser console shows no errors.
