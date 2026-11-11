# Ulama Moris: Mobile App Design Handoff (Expo + React Native + NativeWind)

An Islamic audio library for Mauritius: lectures by local ulama, grouped into events, with one persistent player.
Target: **Expo SDK 58, React Native 0.88, TypeScript, expo-router, NativeWind v4.** Design frame: 390 × 844 (iPhone 14/15 size). Lay out with flexbox and safe areas, not fixed heights.

This folder (`docs/updated-doc/`) contains:

| Path | What it is |
|---|---|
| `HANDOFF.md` | This brief: the source of truth for structure and behaviour |
| `DESIGN-SYSTEM.md` | **Read second.** Three-tier colour system (primitives → semantic → component), naming rules, categories, contrast, type, shadows, NativeWind setup, class recipes |
| `COLOUR-SYSTEM-CHANGES.md` | Change log from the old flat colour names to the three-tier system, with the full migration map |
| `ARTBOARD-MAP.md` | Every region of every artboard mapped to its HTML line, spacing and token classes |
| `expo-audio.md` | Audio playback guide (background playback, lock screen, Android notification) |
| `ERROR-STATES.md` | Error and offline states. **Built as a separate stage after all screens are done** (§7 step 10, §9). Don't read it during the screen phase |
| `global.css`, `tailwind.config.js` | NativeWind theme: the semantic tier as classes that switch light/dark |
| `src/theme/primitives.ts` | Tier 1: raw colour ramps (never used in screens) |
| `src/theme/tokens.ts` | Tier 2 in JS (`useThemeColors()`, `useThemeShadows()`, `catAt()`, `catForItem()`, `catClasses`) for SVG fills, icon colours, StatusBar, shadows, animation; plus the artwork `palette`, type, spacing, radii, sizes |
| `src/components/*/tokens.ts` | Tier 3: component tokens (MiniPlayer, TabBar, Skeleton, Search) |
| `src/data/sample.ts` | Static sample content from the website, with types |
| `artboards/screens/*.png` | 2× renders of every screen. The visual reference |
| `html/screens/*.html` | **Working pages** of every screen, same names as the PNGs. Open in any browser, offline (fonts bundled in `html/fonts/`). Static snapshots: buttons don't respond. **Reference only**: where they disagree with this brief, this brief wins |
| `html/design-system.html`, `artboards/design-system.png` | The colour board (DESIGN-SYSTEM.md) |
| `artboards/error-states/*.png`, `html/error-states/*.html` | Error and offline designs, one PNG + one working page per state. Used only in the error-states stage (§9) |

Screen files (`html/screens/` and `artboards/screens/`): `home`, `events`, `event-detail`, `now-playing` (+ `now-playing-dark`), `search` (recent searches), `search-results` (results state, "Ṣaḥābā" typed).
Error-state files (separate stage, §9; `html/error-states/` and `artboards/error-states/`): `offline`, `lecture-didnt-load`, `more-lectures-didnt-load`, `more-events-didnt-load`, `search-results-didnt-load`, `audio-didnt-load`, `mini-player-lecture-didnt-load`.

---

## 0. Colour names used in this brief → NativeWind tokens

ivory ground → `bg-bg` · charcoal text → `text-fg` · muted text → `text-fg-muted` · olive text, olive fills and olive graphics (progress, play button) → `text-primary` / `bg-primary` with `primary-fg` on top · rows and cards → `bg-surface-1` · chips, fields, round buttons → `bg-surface-2` · forest card → `bg-emphasis` · ochre button and ochre progress → `bg-secondary` · sage track → `track` · mini player → `miniPlayer.*` component tokens · tab pill → `tabBar.*` component tokens · hairlines → `border`, outlines → `border-strong` · list tiles and tags → the categories `bg-cat-1-bg` … `bg-cat-5-bg` with the matching `text-cat-N-fg` · errors → `danger`, `danger-subtle`, `danger-subtle-fg`. Every one of these has a dark value; see DESIGN-SYSTEM.md. Old names (`hero`, `cta`, `tint-sage` …) are mapped in COLOUR-SYSTEM-CHANGES.md.

## 1. Design principles

- **Calm and warm.** Ivory ground, deep olive/forest for emphasis, ochre for the single primary action on dark cards. No gradients, no emoji.
- **Only semantic classes** (`bg-surface-1`, `text-fg-muted`, `bg-primary` …), plus a component's own tokens. No hex in components; light and dark must both work from day one.
- **Large touch targets:** every tappable thing ≥ 44 × 44, and every icon button has an `accessibilityLabel`.
- **Contrast:** body text on ivory uses `fg` or `fg-muted`. Olive text uses `text-primary` (`olive-600` #56613F light / `olive-300` sage dark), never an artwork olive such as #66734C (fails 4.5:1 for small text). Ochre text on a light surface uses `secondary-strong`, never `secondary`.
- **Rounded, soft geometry:** rows 22, cards 28, pills fully round.
- **Typography:** Manrope everywhere (`@expo-google-fonts/manrope`, `font-manrope-*` classes). Headings ExtraBold with slight negative tracking. All times use tabular numbers. Use the tracking values from the type tokens, even where the HTML differs slightly.
- **Iconography:** 2px rounded stroke icons. `lucide-react-native` covers most: ChevronDown, ChevronLeft, ChevronRight, Search, Share, MapPin, Calendar, Clock, Layers, Radio, Home, Mic, X, Play, Pause, AudioLines (search result tile). Play/Pause are **filled**. The **15-second icons are custom SVG** (DESIGN-SYSTEM.md §13).
- **Artwork:** an original abstract botanical rosette (leaves in olive/sage around an ochre/terracotta centre). Recreate with `react-native-svg` from the `<svg>` in `html/screens/now-playing.html` (L17), or replace with real cover images later. Never use third-party album art. The rosette uses the **fixed** illustration palette (`palette` in tokens.ts), the same in light and dark (it always sits on forest).

## 2. Navigation map (expo-router)

Routes live in `src/app/` (see the project's AGENTS.md).

```
src/app/
  _layout.tsx                 Root Stack. Hosts the global PlayerProvider. Imports "@/global.css".
  (tabs)/_layout.tsx          Two tabs only: Home, Events. Custom tabBar = <MiniPlayer/> stacked above <TabBar/>
  (tabs)/index.tsx            Home
  (tabs)/events/index.tsx     Events list
  (tabs)/events/[id].tsx      Event detail (pushed inside the Events tab stack; tab bar stays visible)
  search.tsx                  Search. Stack screen, animation: 'slide_from_right', param ?scope=lectures|events
  player.tsx                  Now Playing. presentation: 'fullScreenModal', slides up; chevron or swipe down closes
```

Two tabs: Home and Events. Home's lecture list *is* the library.

**Changes to the starter template:**
- The template's tabs use `NativeTabs` from `expo-router/native-tabs` (`src/components/app-tabs.tsx`). A native tab bar can't host the mini player stacked above it. Use the JS `Tabs` navigator from `expo-router` with a custom `tabBar` prop instead.
- Delete `src/app/explore.tsx` and the template's demo components.

## 3. Global player (build this first)

One player for the whole app; every screen reads from it.

- **State** (zustand or React context): `queue: Lecture[]`, `currentIndex`, `isPlaying`, `positionSec`, `durationSec`, `source` (what the queue came from, for the Now Playing top bar, §4.4), `progressById: Record<id, number>` (resume points, persisted with AsyncStorage).
- **Actions:** `playLecture(lecture, queue?, source?)`, `toggle()`, `seek(sec)`, `skip(+15 | -15)`.
- **Player controls in the UI:** play/pause, seek, back 15 seconds and forward 15 seconds. Moving between lectures happens automatically through the queue.
- **Queue order = data order.** An event's queue is its lectures in the order the data returns them. Don't re-sort. (The designs show different orders on different screens; the data decides.)
- **When a lecture ends:** the next one in the queue starts automatically (event playlists). At the end of the queue, playback stops.
- **Audio engine:** `expo-audio` for playback; follow [expo-audio.md](expo-audio.md) (one app-level player, background mode, lock-screen controls with seek forward/back to match the 15-second buttons). If `expo-audio` falls short on background playback or lock-screen controls, evaluate `react-native-track-player` (needs a dev build, not Expo Go). Check each library's current docs before choosing.
- **Where play goes:**
  - Home lecture row → starts playing in the mini player, stays on Home.
  - Search result (lectures scope) → closes Search, plays in the mini player.
  - Event detail lecture → queue = that event's lectures, **opens Now Playing**.
  - Mini player → opens Now Playing.
  - Continue listening card → toggles play/pause of that lecture in place.

## 4. Screens

### 4.1 Home (`html/screens/home.html`)
One `FlatList` for the whole screen; the sections above the list are its `ListHeaderComponent`.

1. **Header row:** 40px logo badge (olive rounded square, ivory arch, ochre crescent + base bar; see the SVG) + "Ulama Moris" (`text-heading-sm`, 16 ExtraBold) / "Islamic Audio Library" (12, `text-fg-muted`). The header holds only the badge and the name. Side inset 20 left / 12 right (`pl-5 pr-bar`).
2. **Greeting:** "Assalāmu ’alaykum" (14 Bold, `text-primary`) above "Nurture your heart with today’s reminders" (28 ExtraBold).
3. **Search bar:** full-width 52px pill on `bg-surface-2` reading **"Search by topic"** with a search icon. It spans the full content width, looks like a field, and is a button that pushes `search?scope=lectures`.
4. **Continue listening card:** `bg-emphasis`, radius 28, padding 22, decorative rosette partly off the top-right corner (`HeroCard`, DESIGN-SYSTEM §12). Overline "CONTINUE LISTENING", title (20 ExtraBold, `emphasis-fg`), scholar (`emphasis-fg-muted`). Bottom row: 52px `bg-secondary` play/pause (`secondary-fg` icon) + 4px progress bar (`secondary` fill on `emphasis-fg/[0.18]`) + elapsed left, "N min left" right (§4.7). Shows the most recent lecture with saved progress.
5. **Latest lectures (infinite list = the library):** heading "Latest lectures" with "81 lectures" on the right. Filter chips Local / Guest / Islāhi Majlis (40px pills; selected `bg-primary` + `text-primary-fg`, otherwise `bg-surface-2` + `text-fg`). An empty series shows a friendly empty state on `bg-surface-1`: "No Guest lectures yet" / "New recordings from this series will appear here." With the static sample data, Guest and Islāhi Majlis show this empty state.
   - **Lecture row (text block + play button):** `bg-surface-1`, radius 22, padding 14 top / 12 right / 14 bottom / 18 left, gap 14. Title 15 Bold (max 2 lines), scholar 13 SemiBold `text-primary`, meta 12 `text-fg-muted`: "31 Oct · 36 min · Masjid Muswalla, Highlands" (§4.7; leave the duration out when unknown). Right: 44px round play button on `bg-bg`. Active row: `bg-surface-2`, its play button `bg-primary` with a `primary-fg` icon.
   - **Infinite scroll:** `onEndReached` loads the next page; the footer is one skeleton row (`skeleton.row` = `bg-surface-1` row with `skeleton.bg` = `bg-surface-2` bars) + spinner "Loading more lectures" (ring `fg` at `border-strong` alpha, arc `primary`). The list continues until the library is fully loaded.
6. Bottom inset so the last row clears the mini player + tab bar.

### 4.2 Events (`html/screens/events.html`)
1. Title "Events" (32 ExtraBold) + subtitle "Conferences, programmes and gatherings we have recorded." Right: 44px round search button on `bg-surface-2` → `search?scope=events`. Inset 24 left / 12 right.
2. Count chip: "11 events" (`bg-cat-1-bg text-cat-1-fg`, radio icon).
3. **Latest event card** (`HeroCard`, same style as Continue listening): overline "LATEST EVENT", title 22, "24 – 31 Oct 2026 · Masjid Muswalla, Highlands", chips "4 lectures" "2h 34m" (`bg-emphasis-fg/[0.12]`), 48px `bg-secondary` arrow circle (`secondary-fg` icon). The whole card is one button → event detail.
4. **All events:** `SectionList` grouped by **year** (sticky section headers "2026", "2025" in `text-label text-fg-muted`). Event row: `bg-surface-1`, 60 × 64 date tile coloured by **category, by position** (`catClasses[catAt(index)]`: day 22 ExtraBold + month 12 Bold in the matching `cat-N-fg`), title 15 Bold, "4 lectures · 2h 34m · 24 – 31 Oct" in `text-primary`, venue with pin icon, chevron right. Infinite scroll with skeleton + "Loading more events".
   - **Date rule:** the date tile, the year group and the sort order all use the event's **`endDate`** (its most recent recording). Newest first. Example: Sahaba (24–31 Oct 2026) shows **31 Oct** under 2026; Jummah (17 Nov 2023 – 22 Aug 2025) shows **22 Aug** under 2025.
   - **Optional parts:** venue, date range and other meta are shown only when the data has them. When a value is missing, leave that part out.

### 4.3 Event detail (`html/screens/event-detail.html`)
1. Top bar: 44px round back button (`bg-surface-2`), centred "Event", 44px share button (`bg-surface-2`). Inset 12.
2. **Hero card** (`HeroCard`, `bg-emphasis`, radius 28): "EVENT" pill with radio icon (`text-overline`, `bg-emphasis-fg/[0.12]`), title 28 ExtraBold, "24 – 31 October 2026" (full month name), wrapped info chips (layers icon "4 recorded lectures", clock "2h 34m", pin venue). Lectures are played from their rows below.
3. "Lectures from this event" + count (number only, e.g. "4").
4. **Numbered rows** in data order (`bg-surface-1`): 44px number tile ("01"…) `bg-cat-1-bg text-cat-1-fg`. Title 15 Bold, **max 3 lines** (event titles are long). Meta 12 SemiBold:
   - Not active: "31 Oct · 35:48" (date · clock duration, §4.7), `text-fg-muted`.
   - Active + playing: "Now playing · 16:05 / 46:21", `text-primary`.
   - Active + paused (has progress): "Paused · 16:05 / 46:21", `text-primary`.
   - Active row: number tile `bg-primary text-primary-fg`, row `bg-surface-2`, play button `bg-primary`.
5. **Row play button:**
   - Not the active lecture → sets the queue to this event and **opens Now Playing**. Label "Play {title}".
   - Active and paused → resumes and opens Now Playing. Label "Play {title}".
   - Active and playing → shows the pause icon and opens Now Playing (it doesn't pause here). The label follows the icon: "Pause {title}".
6. Mini player + tab bar remain visible (Events tab active).

### 4.4 Now Playing (`html/screens/now-playing.html`, dark variant `html/screens/now-playing-dark.html`)
Full-screen modal. Default data is the first Home lecture: "Sacrifices of the Ṣaḥābā Radiyallāhu ’Anhum for Islam", Mawlana Zyad Ally Quenette, 46:21, resuming at 16:05.

1. **Top bar:** chevron-down (close) on the left; centred "Playing from" (12 SemiBold, `text-fg-muted`, **sentence case**) over the source name (14 Bold, one line, ellipsised); an empty 44px spacer on the right keeps the centre text centred. Source name by where the queue came from:
   - From Home's list → "Latest lectures".
   - From an event → the event title.
   - From search → the query in quotes, e.g. “Ṣaḥābā”.
2. **Artwork** 342 square, radius 28, `artwork` shadow from `useThemeShadows()` (no shadow in dark).
3. **Lecture information, above the progress bar and controls:**
   - Title 22 ExtraBold (max 2 lines) and scholar 15 **Bold** `text-primary` directly under it, both spanning the full content width. The scholar is the most important detail after the title, hence the olive colour and heavier weight.
   - Two quiet lines, 14 Medium `text-fg-muted`, each with a 16px icon: venue (MapPin) "Masjid Muswalla, Highlands"; date (Calendar) "Saturday, 31 October 2026". The weekday is **computed from the date** (`longDateLabel`, §4.7). Leave a line out when the data has no value.
   - Tags row: topic pill (34px, radius full, coloured by **category, by topic**: `catClasses[catForItem(lecture.topic, 0)]`, e.g. Ṣaḥābā = `bg-cat-1-bg text-cat-1-fg`; 13 Bold, e.g. "Ṣaḥābā r.a" from `topicLabels`) + outlined event link pill (34px, `border-[1.5px] border-border-strong`, Layers icon, event name ellipsised, ChevronRight) that **opens that event's detail**. Hide the topic pill for topic `other`; hide the event pill when the lecture has no event.
4. **Progress: a straight slider.** 5px `track`, played fill `primary`, 16px round `primary` thumb with a 2.5px ring in **`bg`** (`border-bg`). Tap **and drag** to seek; the touch area is at least 44 high. Below: elapsed left, "-remaining" right (§4.7, tabular).
5. **Controls: three buttons, centred, gap 28:**
   - 60px round `bg-surface-2` **back 15 seconds** (the 15 icon mirrored so the arrow points the other way, digits still read normally).
   - 96 × 76 `bg-primary` play/pause with a `primary-fg` icon (radius 26 playing / 38 paused, animate ~0.25 s), `playButton` shadow (none in dark).
   - 60px round `bg-surface-2` **forward 15 seconds**.
   - Both skip buttons move within the current lecture (clamped to 0 and the duration) and work while playing or paused.
6. **The controls row is the last element.** The space below it is plain `bg`, giving the screen its calm, open bottom.
- **Accessibility labels:** "Minimise player", "Seek position" (with `accessibilityValue`), "Back 15 seconds", "Play" / "Pause", "Forward 15 seconds", "Open event: {event name}".
- **Dark mode:** automatic through the tokens (this screen is where the dark theme was taken from, DESIGN-SYSTEM §3). `primary` becomes sage because olive disappears on charcoal.

### 4.5 Search (`html/screens/search.html` + `html/screens/search-results.html`)
Stack screen sliding in from the right.

- **Top bar:** back chevron (44, transparent) + 48px pill input on `bg-surface-2`, auto-focused on open, `returnKeyType="search"`. Placeholder **"Search by topic"** (lectures scope) or **"Search events by name"** (events scope). Right inside the pill: mic icon when empty (visual only), clear ✕ when there's text.
- **Topic-only matching:**
  - Lectures match on the **title and the topic tag only** (`topicLabels`), never the scholar, venue or date. All matches form one list of lectures, and each row shows the scholar's name so people know who's speaking.
  - Events match on the **event name only**.
  - Matching is case-insensitive and **accent-insensitive** ("sahaba" finds "Ṣaḥābā"): fold both sides with `normalize('NFD')` and strip combining marks (`/[̀-ͯ]/g`), and map ’, ' and ʿ to the same apostrophe. Check that Hermes supports `normalize` in this build; if not, use a small diacritics map. Fold character by character so indexes line up with the original text for highlighting.
  - Live filter while typing (debounce ~150 ms once it calls an API).
- **Empty query ("Search · recent"):** "Recent searches" (`text-heading-sm`) + "Clear all" (`text-primary`). The **last 5 searches entered**, newest first, in one rounded `bg-surface-1` card (clock icon, text, ✕ remove, `bg-border` hairline dividers). Tap = run that search again and move it to the top. Below (lectures scope only): "Popular topics" (`text-heading-sm`) with chips Ṣaḥābā / Finance / Fire coloured by **category, by topic** (`cat-1`, `cat-2`, `cat-3`). Nothing saved → "Your searches will appear here." in a `bg-surface-1` card.
  - Persist per scope in AsyncStorage (`recent:lectures`, `recent:events`): case-insensitive de-dupe, max 5, saved on submit, on a result tap, or on a topic chip tap.
  - Starting list: the design shows placeholder recents (`seedRecentSearches` in sample.ts: Ṣaḥābā, Islamic finance, Fire, Sacrifices, Ummah). They are not real searches. Ship with an empty list, or show them as onboarding hints that real searches replace; see §6.
- **Results ("Search · results"):** a plain heading "3 lectures found" / "1 lecture found" / "2 events found" (14 Bold, `text-fg-muted`, sentence case; the count comes from the results). Then one row per match: `bg-surface-1 rounded-row`, padding 10 12 10 10, gap 14; 48px tile (radius 14) coloured by **category** (lectures: by topic, `catForItem(lecture.topic, index)`; events: by position) with an AudioLines icon in the tile's own `cat-N-fg` (events scope: a date badge, day + month, instead of the icon); title 15 Bold (2 lines) with the match highlighted (`search.highlight` + `search.highlightFg`, radius 4); scholar 13 SemiBold `text-primary`; meta 12 `text-fg-muted` "31 Oct · Masjid Muswalla, Highlands"; chevron right. When the match is in the topic tag only, the title shows no highlight.
  - Lecture result: tapping the row plays it in the mini player and closes Search (§3).
  - Event result: tapping the row opens event detail.
- **No results:** card "No results for “query”" + **"Try a topic, such as Ṣaḥābā, Finance or Fire."** (events scope: "Try an event name, such as Jummah.").

### 4.6 Mini player + tab bar (shared)
- One `MiniPlayer` component used on every tab screen. Ignore the per-screen differences in the HTML (Home's italic text, the missing skip button on Events / Event detail).
- Custom `tabBar` in `(tabs)/_layout.tsx`: `bg-bg` with a 1px top hairline (`tabBar.divider` = `border-t border-border`); padding 0 12 + safe-area bottom; gap 8.
- **Mini player** (component tokens in `src/components/MiniPlayer/tokens.ts`; `miniPlayer.bg` = `bg-inverse` in light, `bg-emphasis` in dark; radius 20, padding 8 8 10 8; in dark `miniPlayer.outline` adds a 1px `border` so it separates from the charcoal ground): 44px artwork thumb (`rounded-thumb-sm`, radius 10, `miniPlayer.thumbBg` with a small rosette), the real lecture title (14 Bold, 1 line, upright, `miniPlayer.fg`) + scholar (12 SemiBold, `miniPlayer.fgMuted`), 44px play/pause, 44px **forward 15** (custom "15" icon). 3px `miniPlayer.progress` (`bg-secondary`) line along the bottom edge. Tapping the text area opens Now Playing. Hidden until something has been played.
- **Tabs** (component tokens in `src/components/TabBar/tokens.ts`): Home (house) and Events (calendar). Active = 60 × 32 `tabBar.activeBg` (`bg-primary-subtle`) pill behind a filled icon in `tabBar.activeFg` (`primary-subtle-fg`) + ExtraBold `text-fg` label; inactive = outline icon, `tabBar.inactiveFg` (`text-fg-muted`) label.
- Accessibility labels: "Open player", "Play" / "Pause", "Skip forward 15 seconds".

### 4.7 Formatting times and dates
One helper per format. Put them in one file (e.g. `src/utils/format-time.ts`) and use them everywhere.

| Helper | Rounding | Output | Used in |
|---|---|---|---|
| `minutesLabel(sec)` | round to nearest minute | "36 min" | Home rows |
| `minutesLeftLabel(sec)` | round **up** | "31 min left" | Continue listening card |
| `clockLabel(sec)` | floor seconds | "35:48"; "1:02:05" once ≥ 1 hour | Event detail meta, Now Playing elapsed / "-remaining", "Now playing · 16:05 / 46:21" |
| `totalLabel(sec)` | floor minutes | "2h 34m"; "45m" under an hour | Event totals, chips |
| `longDateLabel(isoDate)` | – | "Saturday, 31 October 2026" | Now Playing date line |

Dates: list rows and search meta use "31 Oct"; event ranges use "24 – 31 Oct" (same month), "24 Oct – 2 Nov" (different months) or "17 Nov 2023 – 22 Aug 2025" (different years); the event hero uses the full month name ("24 – 31 October 2026"). Build dates from the ISO `YYYY-MM-DD` parts as a local date (not `new Date('2026-10-31')`, which is UTC and can shift the weekday). When the duration is `null`, leave that part out.

## 5. Behaviours checklist
- [ ] One global player; mini player and Now Playing always in sync; resume position per lecture persisted.
- [ ] Event playback auto-advances through the event's lectures, in data order; stops at the end of the queue. Player controls are play/pause, seek, back 15 and forward 15.
- [ ] Back 15 / forward 15 work in Now Playing (both) and the mini player (forward), playing or paused.
- [ ] Home and Events lists are paginated infinite lists with skeleton footers.
- [ ] Search: slide-in stack, autofocus, 5 persisted recents per scope, topic-only matching (lectures: title + topic; events: name), accent-insensitive, results heading, highlighted matches, no-results hint.
- [ ] Category colours via `catForItem(topic, index)` / `catAt(index)` + `catClasses` (literal class names): by topic where an item has one, otherwise by position. Never used for state.
- [ ] Safe areas respected (`react-native-safe-area-context`); no fake status bar (the HTML's 44px top padding is a stand-in for the status bar).
- [ ] Accessibility: `accessibilityRole="button"` + `accessibilityLabel` on every icon button ("Back 15 seconds", "Play Sacrifices of the…", "Remove “Fire” from recent searches", and the labels in §4.4–4.6); progress slider exposes `accessibilityValue`.
- [ ] Light and dark both work from day one: only semantic classes (plus component tokens), no hex in components; `userInterfaceStyle: automatic`.

## 6. Known gaps and placeholders
- Data is **static** for now (`sample.ts`); real data comes from your API later. Keep it simple: no extra fields. The scholar is a plain string on each lecture.
- 4 of the 10 Home lectures in the design are placeholders ("[Lecture title]").
- The duration of "A Country on Fire" wasn't in the screenshots (`durationSec: null`). "Who were the ṣaḥābā…" is 2377 s, derived from the event total (9240 − 2148 − 2781 − 1934). Confirm both.
- "Who were the ṣaḥābā…" was **assumed** to be the 4th lecture of the Sahaba event. Confirm.
- The 5 starting recent searches (`seedRecentSearches`) are invented placeholders. Decide: ship with an empty list, or keep them as onboarding hints that real searches replace.
- Titles are kept exactly as on the website, so spellings differ ("Sahaba Radiyyallahu Anhum" on the event, "Ṣaḥābā Radiyallāhu ’Anhum" on lectures; "Islahi" vs "Islāhi"). Don't "fix" one side; accent-insensitive search covers both.
- Only the Sahaba event has a designed detail page; the other events use the same template.
- The share button on Event detail and the mic in Search are visual only; decide their behaviour.
- **Screens and states that aren't designed** (buffering, first launch …): improvise from the existing components and tokens, keep it minimal, and leave a `// TODO(design)` comment. The full list is in §8.2.
- **Error and offline states are designed** ([ERROR-STATES.md](ERROR-STATES.md)) but are **not part of the screen phase**. They are built as their own stage once every screen is done (§7 step 10, §9). While building screens, don't build or improvise any error UI.

## 7. Build order
1. NativeWind setup, `global.css` tokens, `tailwind.config.js`, `src/theme/primitives.ts` + `tokens.ts`, component token files, Manrope fonts (DESIGN-SYSTEM.md §14).
2. Data layer: types, sample data, paginated API stubs (Home and Events), time/date helpers (§4.7).
3. Global player store + audio engine ([expo-audio.md](expo-audio.md)).
4. Tabs layout with mini player.
5. Home.
6. Now Playing.
7. Events + Event detail.
8. Search.
9. Accessibility and dark-mode pass.
10. **Error and offline states: a separate stage**, started only after steps 1–9 are done and checked. Follow §9 and [ERROR-STATES.md](ERROR-STATES.md).

Steps 1–9 are the screen phase. They build the happy path only: no error cards, retry buttons, offline pop-up or NetInfo. Step 10 adds all of those on top of the finished screens.

## 8. Deferred for later

Open items that were deliberately postponed. **Not needed for the first release.** Don't implement them unless asked.
For where each item sits on an artboard, see [ARTBOARD-MAP.md](ARTBOARD-MAP.md).

### 8.1 Project setup

| # | Issue | Suggested fix |
|---|---|---|
| A6 | `app.json` still has Expo's default icons and an Android adaptive background of `#E6F4FE`. | Add an app icon + splash item to the build order, derived from the logo badge SVG (`html/screens/home.html` L10). Ivory background. |

### 8.2 States and screens not designed

Until these are designed, improvise from the existing components and tokens, keep it minimal, and leave a `// TODO(design)` comment (see §6).

1. ~~**Error / offline**~~: now designed. See §9 and [ERROR-STATES.md](ERROR-STATES.md).
2. **Buffering:** a spinner in the play button while audio loads (mini player, Now Playing, rows).
3. **First launch:** nothing played yet. The Continue listening card and the mini player should both be hidden. Document the Home layout without them.
4. **Initial load:** full-screen skeletons for Home and Events, not just the footer row.
5. **Search:** the events-scope results, the no-results card and the empty-recents card have no PNG or HTML page. Build them from the copy and tokens in §4.5.
6. **Event detail share:** the share payload.
7. ~~**Lock-screen / notification artwork**~~: decided. The OS media controls use a hosted `https` PNG of the cover art (`LOCK_SCREEN_ARTWORK_URL`, Stage 10 plan §3.1), not a bundled asset. In-app screens keep the bundled `assets/images/cover-art.jpg`.
8. **Large text:** fixed heights (40 chips, 34 tags, 32 tab pill, 52 search field) need behaviour defined at large Dynamic Type sizes.
9. **Reduced motion:** turn off the play-button radius animation and the search slide-in.
10. **Accessibility labels in §5:** check the curly quotes in the example labels.

## 9. Error and offline states (separate stage, after the screens)

**When:** only after every screen in §7 steps 1–9 is built and checked against its artboard. Don't start this in the same session as a screen.
**Spec:** [ERROR-STATES.md](ERROR-STATES.md) is the source of truth for copy, colours, layout and behaviour. Visual reference: `artboards/error-states/*.png`; working pages: `html/error-states/*.html`.

### 9.1 What to build

| State | Where it plugs in | Screen it changes |
|---|---|---|
| `offline` | Root layout: blocking bottom sheet over the Home skeleton, on launch and on return to foreground | Whole app |
| `lecture-didnt-load` | Home list area below the chips, when the first page fails. Same card for Events ("Events didn’t load") | Home (§4.1), Events (§4.2) |
| `more-lectures-didnt-load` / `more-events-didnt-load` | Replaces the "Loading more" footer when a next page fails. **One shared footer component** for both lists | Home, Events |
| `search-results-didnt-load` | Search results area, same card as `lecture-didnt-load`, titled "Results didn’t load" | Search (§4.5) |
| `audio-didnt-load` | Replaces the Now Playing progress bar; play/pause becomes "Try again"; skip buttons disabled | Now Playing (§4.4) |
| `mini-player-lecture-didnt-load` | Mini player scholar line, play button and progress line | Mini player (§4.6) |

### 9.2 Order within the stage
1. Install `@react-native-community/netinfo` with `npx expo install`. Add error + retry to the data layer (paginated API stubs and the player store), so each list and the player can report "failed" and expose a `retry()`. Add a way to force failures in development to test each state.
2. Shared pieces: the `danger-subtle` error card, the "Try again" button with its retrying state (spinner, "Trying again", `busy`), and the announce-for-accessibility helper.
3. List states: first page failed (Home, Events), next page failed (shared footer), search results.
4. Player states: Now Playing audio, mini player.
5. Offline pop-up (root layout, NetInfo, foreground check, auto-retry once when the connection comes back).
6. Check every state in light and dark, on the iOS simulator and the web build.

### 9.3 Checklist
- [ ] Every error has one "Try again"; retrying shows a spinner + "Trying again", ignores extra taps; a second failure shows the "Still no connection…" copy.
- [ ] No retry loops: retry on tap, or automatically once when NetInfo reports the connection is back.
- [ ] Already-loaded rows stay when a next page fails; Now Playing resumes from the saved position after a successful retry.
- [ ] Offline sheet blocks the app (no dismiss, Android back does nothing), is modal for screen readers, and owns its bottom inset.
- [ ] Errors are announced (Android live region, iOS `announceForAccessibility`); disabled controls expose `disabled`.
- [ ] Error colours from DESIGN-SYSTEM.md §5.3 only: `bg-danger-subtle` / `text-danger-subtle-fg` on screen grounds and `danger` for lines and icons; `miniPlayer.errorFg` / `miniPlayer.errorLine` on the mini player; `scrim` from tokens.ts for the offline pop-up. Never a category colour (`cat-3` shares the hue but is not an error token). No hex in components, no separate red.
