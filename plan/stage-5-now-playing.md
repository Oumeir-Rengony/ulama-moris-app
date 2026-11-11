# Stage 5: Now Playing screen (composition)

> **Status: ✅ Done (11 Nov 2026).** Verified on the iOS simulator (iPhone 17 and iPhone SE, Expo Go + AXe) and the web build, light and dark: opening from a row, a row's play button and the Continue listening card; closing; repeated `--N` copies; redirects for a missing or unknown slug; the no-tags lecture; control and slider sizes. Changes from this plan: the artwork shrinks to fit when a full-width square would push the controls off screen (it overflowed on the 402-wide iPhone 17), with the top bar fixed above the scroll area; the topic pill uses `topicLabels` ("Ṣaḥābā r.a"). Deep links were tested as `exp://…/--/player…` in Expo Go; `ulamamoris://` needs a development build.
> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 1 (`player.tsx` route), Stage 3 (Now Playing components, `CoverArt`), Stage 4 (Home list, `lectures.api.ts`, `AppProviders`, `format-time.ts`).

## Goal

Assemble the Now Playing screen from the Stage 3 components so it matches [now-playing.png](../docs/artboards/screens/now-playing.png) and [now-playing-dark.png](../docs/artboards/screens/now-playing-dark.png). Everything on it is **visual only**: no audio, no seeking, no play state. The only new behaviour is **navigation**: tapping a lecture on Home opens Now Playing for *that* lecture.

## Scope

| Part | This stage | Later |
|---|---|---|
| Opening Now Playing | **Works.** On Home, a tap on a lecture row, a row's play button, or the Continue listening play button opens `/player?slug=<slug>` | — |
| Closing | The chevron-down button calls `router.back()`. You need a way out of a full-screen modal, so this is the one control on the screen that works | Swipe-down to dismiss: player / animation stage (`expo-animation`). On iOS, `fullScreenModal` doesn't give swipe-to-dismiss out of the box, so Stage 1's "swipe down" check moves there |
| Top bar "Playing from" | Always "Latest lectures", since Home is the only way in for now | Stage 6 adds the event title as the source; the search stage adds the query |
| Artwork | `NowPlaying/Artwork` (`CoverArt`, `docs/cover-art.jpg`) | — |
| Title, author, venue, date, tags | From the static lecture data | — |
| Event pill | Rendered. No `onPress` | A later stage opens the event |
| Seek bar and times | Static. The `mockPlayback` lecture shows its mock progress; any other lecture shows the start (0:00 elapsed) | Player stage: live position, drag to seek |
| Back 15 / play-pause / forward 15 | Rendered in the paused look ("Play" icon). No `onPress` | Player stage |
| Mini player | Unchanged from Stage 4: still static, and its controls still do nothing | Player stage |

This deliberately differs from HANDOFF §3: there, a Home row tap plays in the mini player and stays on Home. That rule comes back in the player stage. For now, every Home tap opens Now Playing, so the screen can be reached and checked.

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point |
| `expo-router` | Typed `router.push` with params, `useLocalSearchParams`, `fullScreenModal` presentation, `<Redirect>` |
| `expo-data-fetching` | `useQuery` for one lecture, using a stub fetcher (AGENTS.md "State management") |
| `expo-native-ui` | `expo-image` for the cover, safe areas on a full-screen modal, status bar |
| `frontend-design` | Required for user-facing UI. Matching the artboard |
| `vercel-react-native-skills` | Keep the route file thin, and pass simple props to the parts |
| `playwright-cli` | Web check, standing in for Android |

## References

- [HANDOFF.md §4.4](../docs/HANDOFF.md): Now Playing, part by part, plus the accessibility labels. §4.7: `clockLabel`, `longDateLabel`.
- [ARTBOARD-MAP.md §4](../docs/ARTBOARD-MAP.md): y-ranges and spacing (margin-tops 10, 20, 12, 14, 18, 18; control gap 28).
- [html/screens/now-playing.html](../docs/html/screens/now-playing.html), [now-playing-dark.html](../docs/html/screens/now-playing-dark.html).
- [DESIGN-SYSTEM.md §3](../docs/DESIGN-SYSTEM.md) (where the dark values come from), §11 (shadows: none in dark), §13 (15-second icons).
- Stage 3 §2.3 (`catForTopic`) and §2.4 (`formatVenue`).

## 1. Route and params

- `src/app/player.tsx` reads `slug` with `useLocalSearchParams<{ slug?: string }>()`.
- Keep the presentation from Stage 1: `fullScreenModal`, sliding up from the bottom.
- Add a small named helper, `openNowPlaying(slug: string)`, in `src/features/player/open-now-playing.ts`. It calls `router.push({ pathname: '/player', params: { slug } })`. Home (and Stage 6) call this helper instead of writing the route by hand, so the player stage can change what "open" means in one place.
- **Missing or unknown slug** (for example a cold deep link to `/player`): return `<Redirect href="/" />`. This replaces Stage 1's `// TODO(player stage)`. It's a guard, not an error screen. Error states are a separate stage.

## 2. Data

- In `src/features/lectures/lectures.api.ts`, add `fetchLectureBySlug(slug): Promise<Lecture | null>`.
  - It looks the slug up in the same mock library that Home pages through (Stage 4). The `--N` slugs of the repeated copies resolve to their copy, which shares its source lecture's fields.
  - No network, no delay. A comment says the real API replaces the function body.
- In `src/features/lectures/lectures.queries.ts`, add `useLectureQuery(slug)`, a `useQuery` with key `['lectures', 'detail', slug]` and caching off (per AGENTS.md).
- While the query has no data yet, render the plain `bg-bg` screen with the top bar only. The stub resolves at once, so this is never really seen. Don't build a loading UI.
- Check the mock data: the Sahaba lectures have `event` and `category` set, and at least one lecture has neither. That lecture shows the "no tags" case. Add to the Stage 3 mock if needed.

## 3. Screen composition: `src/app/player.tsx`

Top to bottom (ARTBOARD-MAP §4). The screen is `bg-bg`, with a `maxWidth: 600` centred column.

1. **`ScreenTopBar`** (`px-bar`):
   - left: chevron-down `IconButton` (ghost), labelled "Minimise player", `onPress={router.back}`;
   - centre: "Playing from" (`caption`, semibold, `text-fg-muted`, sentence case) over "Latest lectures" (`bodySm`, bold, one line);
   - right: a 44 spacer.
2. **`NowPlaying/Artwork`**, `mt-2.5`, inside `px-gutter`. A full-width square, radius 28. The `artwork` shadow shows in light mode only.
3. **`NowPlaying/TrackInfo`**, `mt-5`, `px-gutter`:
   - title (`h2`, 2 lines) and author (15 Bold, `text-primary`);
   - venue line: `formatVenue(masjid)`, with a MapPin icon;
   - date line: `longDateLabel(date)` → "Saturday, 31 October 2026", with a Calendar icon;
   - tags: a topic `Pill` with the label `category[0]` (as given by the data, for example "sahaba r.a"), coloured with `catForTopic(category[0])`; and an event `Pill` (outline) with `event` as its label, a Layers icon and a ChevronRight, labelled "Open event: {event}", with no `onPress`.
   - Leave out any line or pill whose value is missing.
4. **`SeekBar`**, `mt-[18px]`:
   - for the `mockPlayback` lecture: `progress`, `elapsed` and `remaining` from `mockPlayback`;
   - for any other lecture: `progress: 0`, `elapsed: "0:00"`, `remaining: "-" + duration`;
   - `accessibilityLabel` "Seek position", plus `accessibilityValue`.
5. **`NowPlaying/PlayerControls`**, `mt-[18px]`, centred, gap 28:
   - Back 15, Play (paused look, labelled "Play"), Forward 15;
   - no `onPress` on any of them.
6. Nothing below the controls: the rest is plain `bg` (HANDOFF §4.4.6).

**Insets:** a full-screen modal has no header and no tab bar, so the screen owns both edges. Apply `paddingTop: insets.top` and `paddingBottom: insets.bottom` on the outer view (AGENTS.md "Full-screen modals"). Use `<StatusBar style="auto" />`.

**Small screens:** on a phone shorter than the 844 design frame (iPhone SE), the full-width square artwork pushes the controls off screen. Wrap the content in a `ScrollView` with `contentContainerStyle={{ flexGrow: 1 }}`, so it scrolls only when it doesn't fit. Don't shrink the artwork with fixed numbers.

## 4. Formatting helpers (add to `src/utils/format-time.ts`)

| Helper | Input → output | Rule |
|---|---|---|
| `longDateLabel(isoDateTime)` | `"2026-10-31T21:15:00.000+04:00"` → `"Saturday, 31 October 2026"` | Read the `YYYY-MM-DD` parts from the string and build `new Date(year, month - 1, day)` as a *local* date, then get the weekday from it. Never use `new Date(isoString)` (HANDOFF §4.7) |

Write the weekday and month names as plain arrays in the file, instead of using `toLocaleDateString`, so the output is the same on every device language.

## 5. Wiring Home (the only new behaviour)

In `src/app/(tabs)/index.tsx` and `HomeListHeader`, connect the Stage 3 `onPress?` props that were left empty:

| Element | Action |
|---|---|
| `LectureRow` (whole row) | `openNowPlaying(item.slug)` |
| `LectureRow` play button | `openNowPlaying(item.slug)` |
| `ContinueListeningCard` play button | `openNowPlaying(firstLecture.slug)` |

Search bar, chips and all mini player controls stay without `onPress`. Their accessibility labels don't change. Stage 4 §9.6 step 3 (the `onPress=` grep) now also expects these three.

## 6. Files touched

- New: `src/features/player/open-now-playing.ts`
- Rewritten: `src/app/player.tsx`
- Edited:
  - `src/features/lectures/lectures.api.ts`, `lectures.queries.ts`
  - `src/utils/format-time.ts`
  - `src/app/(tabs)/index.tsx`, `src/components/HomeListHeader/index.tsx`
  - `src/data/sample.ts`, only if a "no tags" lecture is missing

## 7. Verification

The agent runs these itself: the iOS simulator driven with **AXe** (Stage 4 §9.2 for the commands), and the web build with `playwright-cli` standing in for Android.

### 7.1 Static checks
`npx expo lint`, `npx tsc --noEmit` and `npm run check:theme` pass.

### 7.2 iOS: opening and closing
1. On Home, `axe tap --label "Play Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam"` (the label is "Play {title}", using the data's spelling).
   - Now Playing slides up from the bottom;
   - `axe describe-ui` shows that lecture's title, author and duration.
2. `axe tap --label "Minimise player"`: you're back on Home, at the same scroll position.
3. Repeat with a row *body* tap (by the row's coordinates from `describe-ui`), and with the Continue listening play button. Each opens the matching lecture.
4. Scroll down a few pages and open a repeated copy (a `--N` slug). It shows that copy's lecture, not a redirect.
5. Run `xcrun simctl openurl booted "ulamamoris://player"` (no slug): it lands on Home. Then try `ulamamoris://player?slug=unknown`: it also lands on Home.

### 7.3 iOS: visual match
1. Open the `mockPlayback` lecture (the same lecture the artboard shows). Screenshot in light and in dark mode (`xcrun simctl ui booted appearance dark`).
2. Compare with `now-playing.png` / `now-playing-dark.png`, region by region (ARTBOARD-MAP §4):
   - top bar centring;
   - artwork: full width, radius 28, shadow only in light;
   - title and author sizes;
   - venue and date lines with their icons;
   - the topic pill's colour and the event pill's outline;
   - seek bar: track, fill, thumb ring, tabular times;
   - control sizes (60 / 96 × 76 / 60) and the gap of 28;
   - nothing below the controls.
3. Deliberate differences to list, not fix:
   - the cover is the mosque illustration, not the rosette;
   - the topic pill shows the data's label ("sahaba r.a");
   - the colours come from the rotation rule (Stage 3 §2.3).
4. Open a lecture without `event` / `category`: the tags row is gone, with no empty gap.
5. Use `describe-ui` to check frames: the controls are 60 / 96 × 76 / 60, and the seek bar touch area is at least 44 high.
6. Run on an iPhone SE simulator as well: the content scrolls, and the controls can be reached.

### 7.4 Web (Android stand-in)
1. Click a Home row: the URL becomes `/player?slug=…`, and the matching lecture shows. Use browser back, then the "Minimise player" button.
2. Take screenshots at 390 × 844 in light and dark, and compare them with the PNGs, using the same checklist.
3. Load `/player` directly: it redirects to `/`.
4. The browser console shows no errors.
