# Stage 8: Search (static data, working filter)

> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Depends on:** Stage 1 (`search.tsx`, `parseSearchScope`), Stage 3 (Search components, mock recents), Stage 4 (Home search bar), Stage 5 (`openNowPlaying`), Stage 6 (Events search button), Stage 7 (Event detail).

## Goal

Assemble the Search screen so it matches [search.png](../docs/artboards/screens/search.png) (empty query) and [search-results.png](../docs/artboards/screens/search-results.png) (results), and make **searching work over the static data**: typing filters lectures or events and shows highlighted results. **Recent searches stay static.** The list shows the mock seeds and never changes, even after a search. Saving recent searches (AsyncStorage, the Zustand store) waits until the API is connected.

## Scope

| Part | This stage | Later |
|---|---|---|
| Opening Search | **Works.** The Home search bar opens `search?scope=lectures`, and the Events search button opens `search?scope=events` | — |
| Back chevron | `router.back()` | — |
| Input | Autofocus, `returnKeyType="search"`, placeholder per scope. The mic shows when empty (visual only), and ✕ clears the text | Mic: undecided (HANDOFF §6) |
| Filtering | **Works**, through a stub fetcher over the static data: accent-insensitive, **title only** (lecture title or event title) | Real API: only the fetcher body changes |
| Results heading + rows | **Works:** "N lectures found" / "N events found", with the match highlighted | — |
| No results | **Works:** a card with the copy for the scope | — |
| Tapping a result | Lecture → Now Playing ("Playing from" “query”). Event → Event detail | Player stage: a lecture plays in the mini player instead (HANDOFF §3) |
| Recent searches | **Static:** the mock seeds per scope. Tapping one runs that search. **Nothing is saved**, and the list never reorders | API stage: persisted, max 5, de-duped, newest first (HANDOFF §4.5) |
| Remove ✕ / "Clear all" | Rendered. No `onPress`, since the list is static | Same stage as dynamic recents |
| Popular topics | **Removed.** Not shown in either scope (a decision that overrides HANDOFF §4.5 and the artboard) | — |

Not built here: persistence, the `recent-searches.store.ts` from Stage 1 (create it when recents become dynamic), the mic, error states (HANDOFF §9).

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point |
| `expo-data-fetching` | `useQuery` keyed by scope + debounced text, `enabled` only when there's text, stub fetcher |
| `expo-router` | Pushing Search with params, leaving Search for Now Playing / Event detail without leaving Search in history |
| `expo-native-ui` | `TextInput` look and keyboard in both themes, safe areas on a root-stack screen |
| `vercel-react-native-skills` / `react-native-best-practices` | Keep typing smooth: the input is local `useState`, and only the debounced value causes a fetch. `keyboardShouldPersistTaps` |
| `frontend-design` | Required for user-facing UI. Matching the artboards and the undesigned states (HANDOFF §8.2 item 5) |
| `playwright-cli` | Web check, standing in for Android |

## References

- [HANDOFF.md §4.5](../docs/HANDOFF.md): copy, matching rules, accent folding, results heading, no-results copy. The recent-search *saving* rules there are deferred.
- [ARTBOARD-MAP.md §5](../docs/ARTBOARD-MAP.md): spacing (bar padding 0 12, pill 48 / radius 24, recents card, chips, result rows `rounded-row` ⚠ not 20), ⚠ chip text uses `cat-N-fg`.
- [html/screens/search.html](../docs/html/screens/search.html), [search-results.html](../docs/html/screens/search-results.html).
- [DESIGN-SYSTEM.md §6](../docs/DESIGN-SYSTEM.md): `search.highlight` / `search.highlightFg` tokens.
- Stage 3 §2.3: colours rotate. §2.4: `formatVenue`.

## 1. Opening and leaving Search

- **Home:** `SearchFieldButton` `onPress` → `router.push({ pathname: '/search', params: { scope: 'lectures' } })`.
- **Events:** the "Search events" `IconButton` → the same, with `scope: 'events'`.
- Put both behind a named helper, `openSearch(scope)`, in `src/features/search/open-search.ts`, the same idea as `openNowPlaying`.
- **Leaving for a result:** Search should not stay in the history behind the result (HANDOFF §4.5: "closes Search").
  - Lecture: `openNowPlaying(slug, { fromQuery: query, replaceSearch: true })`. When `replaceSearch` is set, the helper uses `router.replace` instead of `router.push`, so minimising Now Playing returns to the tab you came from.
  - Event: replace Search with `/events/[slug]`. Check in the expo-router docs how a `replace` from a root-stack screen into a nested tab route behaves. The expected result is that the Events tab shows Event detail and Back goes to the Events list. If `replace` doesn't do this, use `router.dismissTo`, or `back()` followed by a push. Pick whichever the docs support, and write down the choice.
- **Now Playing source:** extend Stage 7's `if` with a third case. With `fromQuery`, the top bar shows the query in curly quotes, for example “Ṣaḥābā” (HANDOFF §4.4.1).

## 2. Matching: `src/features/search/match.ts`

Pure functions, no React. One clear job each:

- `foldCharacter(char): string` lower-cases one character, removes its accents (`normalize('NFD')`, then strips combining marks U+0300–U+036F), and maps `’`, `'` and `ʿ` to one plain apostrophe. Both the dot-below "Ṣ" (used in the designs) and the cedilla "Ş" (used in the data) fold to `s`. ʿ is a modifier letter, not a combining mark, which is why it needs its own mapping.
- `foldWithIndexMap(text): { folded: string; originalIndexAt: number[] }` folds the text **one character at a time**. For every character it adds to `folded`, it records which original character it came from. This lets a match position in the folded text be mapped back to the original text for highlighting (HANDOFF §4.5).
- `findMatch(text, query): { start: number; end: number } | null` folds both, runs `indexOf`, and maps the match back to original indexes. It returns `null` for an empty query.
- `splitForHighlight(text, match): { text: string; highlighted: boolean }[]` produces the parts that `HighlightedText` (Stage 3) takes.
- **Hermes check:** first confirm that `'Ṣ'.normalize('NFD')` works in this build, on the iOS simulator and on web. If it doesn't, replace the `normalize` step inside `foldCharacter` with a small map of the accented letters found in the data. Only that one function changes.

**Search matches the title only.** Lectures match on their title, and events on their title. Nothing else is searched: not the topic (`category`), author, venue or date. This overrides HANDOFF §4.5, which also matched the topic tag. Every result therefore has a highlight in its title.

## 3. Data (stub fetcher)

`src/features/search/search.api.ts`:
- `fetchSearchResults(scope, query): Promise<{ items: SearchResult[]; total: number }>`.
- Lectures scope: loop over the **unique** sample lectures (not the repeated Home library, which would show duplicates). Keep the matches, in data order. Each result carries the lecture and its `titleParts`.
- Events scope: loop over the mock events, the same way.
- `total` is the number of matches. This stub is the fake API, so counting here is fine: the real API will return `total` itself, and the screen only displays it.
- No network, no delay. A comment says the real API replaces the body.

`src/features/search/search.queries.ts`:
- `useSearchQuery(scope, debouncedQuery)`: `useQuery`, key `['search', scope, debouncedQuery]`, `enabled: debouncedQuery.trim().length > 0`, caching off (AGENTS.md).

`src/hooks/use-debounced-value.ts`:
- `useDebouncedValue(value, delayMs)`, a plain `useEffect` + `setTimeout` with cleanup. 150 ms (HANDOFF §4.5).

## 4. Screen: `src/app/search.tsx`

State: `query` with `useState` (the input text), `debouncedQuery = useDebouncedValue(query, 150)`, and `scope = parseSearchScope(params.scope)`.

**Top bar** (`px-bar`, gap 6, owns the top inset, since it's a root-stack screen with no header):
- back: a 44 ghost `IconButton` ChevronLeft, labelled "Back", `router.back()`;
- `SearchInput`:
  - `value={query}`, `onChangeText={setQuery}`;
  - `autoFocus`, `returnKeyType="search"`;
  - placeholder "Search by topic" for lectures, "Search events by name" for events;
  - trailing mic when empty (no `onPress`); ✕ when there's text, labelled "Clear search", `onPress={() => setQuery('')}`.

**Body:** one `FlatList` with `keyboardShouldPersistTaps="handled"` and `keyboardDismissMode="on-drag"`. `paddingBottom: insets.bottom + 24` in the content container. What it shows depends on the state, written as a plain `if` chain in a small named function, `pickSearchView(...)`:

1. **Empty query → recent view** (the header component; no list rows):
   - "Recent searches" (`headingSm`) + "Clear all" (`text-primary`, 44 high, no `onPress`).
   - `RecentSearchList` with the static seeds for the scope from `mock-ui.ts`: `seedRecentSearches.lectures` (Ṣaḥābā, Islamic finance, Fire, Sacrifices, Ummah) or `seedRecentSearches.events` (add it to the mock if missing, for example Jummah, Sahaba, Islahi).
     - Tapping a row sets `query` to that text, which runs the search.
     - Each row's ✕ is labelled "Remove “{text}” from recent searches", with no `onPress`.
   - No "Popular topics" section. The recent card is the last thing in this view.
2. **Text typed, results not back yet** (the debounce window): keep showing what was there before. Don't flash an empty state. The stub is instant, so this lasts at most 150 ms.
3. **Results** (`total > 0`):
   - heading "{total} lecture(s) found" / "{total} event(s) found" (`bodySm`, bold, `text-fg-muted`, sentence case, singular for 1), `mt-[18px]`;
   - one `SearchResultRow` per item, gap 8:
     - **lecture:** a 48 tile coloured `catForTopic(category[0])` with the AudioLines icon; title from `titleParts` (2 lines); author in `text-primary`; meta "{shortDateLabel(date)} · {formatVenue(masjid)}"; chevron. Label "Play {title}". Tapping it goes to Now Playing (§1).
     - **event:** a 48 `DateTile` (day / month from the data) coloured `catAt(index)`; title from `titleParts`; meta "{dateRange} · {formatVenue(location)}"; chevron. Label "Open {title}". Tapping it goes to Event detail (§1). The event result row isn't designed (HANDOFF §8.2 item 5), so add `// TODO(design)`.
4. **No results:** an `EmptyState` card. Title “No results for “{query}””. Message "Try another lecture title." for lectures, or "Try another event title." for events. No topic examples: search is by title only. This overrides HANDOFF §4.5's copy. It isn't designed either: `// TODO(design)`.

Typing never touches the recent list. Running a search or tapping a result saves nothing. Add a one-line comment saying recents become dynamic when the API is connected.

Keyboard: the results list sits in the area above the keyboard, so nothing is hidden behind it. Check on iOS and on web (AGENTS.md "Keyboard"). If the last result can't be scrolled into view with the keyboard open, add `KeyboardAvoidingView` (`behavior="padding"` on iOS) around the list.

## 5. Files touched

- New:
  - `src/features/search/match.ts`, `search.api.ts`, `search.queries.ts`, `open-search.ts`
  - `src/hooks/use-debounced-value.ts`
- Rewritten: `src/app/search.tsx`
- Edited:
  - `src/components/HomeListHeader/index.tsx` (search bar `onPress`)
  - `src/components/EventsListHeader/index.tsx` (search button `onPress`)
  - `src/features/player/open-now-playing.ts` (`fromQuery`, `replaceSearch`)
  - `src/app/player.tsx` (query source)
  - `src/data/mock-ui.ts` (`seedRecentSearches.events` if missing)

## 6. Verification

The agent runs these itself: iOS with **AXe** (Stage 4 §9.2 commands, plus `axe type "<text>" --udid <id>` for typing), and web with `playwright-cli` standing in for Android.

### 6.1 Static checks
`npx expo lint`, `npx tsc --noEmit` and `npm run check:theme` pass.

### 6.2 Matching (quick checks before the UI)
Call the `match.ts` functions on the simulator, or run a scratch Node script that imports them, and confirm:
- "sahaba" matches the data title "Şahābā" (cedilla) and the design spelling "Ṣaḥābā" (dot below);
- "SAHABA", "ṣaḥābā" and "Sahābā" all match;
- "anhum" matches "'Anhum" / "’Anhum";
- the highlight covers exactly the original characters, accents included;
- the author's name ("Houzeifa") and a topic ("r.a") do **not** match a lecture;
- an empty query matches nothing.
- `'Ṣ'.normalize('NFD')` works in Hermes (check on the simulator, not only in Node).

### 6.3 iOS: visual match
1. On Home, `axe tap --label "Search by topic"`. Search slides in from the right, the keyboard is open, and the input has focus.
2. Take screenshots in light and dark mode, and compare with `search.png` (ARTBOARD-MAP §5):
   - back button and input pill;
   - "Recent searches" + "Clear all";
   - the recents card: 5 rows of 52, clock icons, ✕ buttons, hairline dividers;
   - nothing below the recents card. Deliberate difference: the artboard's "Popular topics" section is removed.
3. `axe type "Ṣaḥābā"`. Compare with `search-results.png`:
   - heading "N lectures found";
   - result rows: 48 tiles, highlighted titles (radius 4, `secondary-subtle`), author in `primary`, meta, chevrons, `rounded-row` 22.
   - Deliberate difference: the count comes from the data, not the artboard's "2".

### 6.4 iOS: behaviour
1. **Live filter:** type "sah" a letter at a time. The results update after each pause, and the heading count changes. Then type "sahaba" without accents: it gets the same results as "Ṣaḥābā".
2. **Title only:** type a word that's only in a topic or an author, not in any title (for example "r.a" or "Houzeifa"). The no-results card shows. Every result for a real title word has a highlight.
3. **No results:** type "zzz". The no-results card reads “No results for “zzz”” / "Try another lecture title.", with no topic examples.
4. **Clear:** tap "Clear search". The recent view comes back, still showing the same 5 seeds in the same order.
5. **Recents stay static:** tap the recent "Fire". Its results show. Clear the input, and the recent list is unchanged: same 5 items, same order, nothing added. Tap "Remove “Fire” from recent searches" and "Clear all": nothing changes.
6. **No popular topics:** in both scopes, `axe describe-ui` shows no "Popular topics" heading and no topic chips.
7. **Lecture result:** tap a result. Now Playing opens with that lecture, and the top bar reads "Playing from" / “{query}”. "Minimise player" goes to Home, not back to Search.
8. **Events scope:** on the Events tab, tap "Search events". The placeholder is "Search events by name". Type "jummah": one event result with a date tile. Tap it: Event detail opens in the Events tab, and Back goes to the Events list, not to Search. Type "zzz": the events copy, "Try another event title."
9. **Keyboard:** with the keyboard open, scroll the results. Dragging closes the keyboard, and tapping a result works on the first tap (`keyboardShouldPersistTaps`).
10. **Back:** the back chevron returns to the screen you came from.
11. **Deep link:** `ulamamoris://search?scope=events` opens the events scope. `ulamamoris://search?scope=other` falls back to lectures.

### 6.5 Web (Android stand-in)
1. From `/`, click "Search by topic": `/search?scope=lectures`. Type "sahaba": results with highlights.
2. Take screenshots of the empty and results states at 390 × 844, in light and dark, and compare them with the PNGs.
3. Repeat §6.4 steps 3–8 with clicks. Check the URL after leaving for a result: Search isn't left in the history (browser back doesn't land on Search).
4. The browser console shows no errors.
