# Artboard → HTML map

Each artboard PNG in `artboards/screens/` is a 2× render of the working page with the same name in `html/screens/`.
This file maps every visible region of an artboard to the HTML that draws it, the token classes to use, and the HANDOFF section that describes it.

How to read the tables:
- **y (pt)** is the approximate vertical position in the 390-wide design frame (PNG pixels ÷ 2). The top 44 pt of every frame is a fake status bar. Use safe-area insets instead.
- **HTML** links to the line where the region starts (line numbers are for the files in this folder).
- **Spec** is taken from the HTML inline styles.
- **⚠ Build:** the HTML differs from the written spec. Build what the note says. HANDOFF.md and DESIGN-SYSTEM.md always win over the HTML.
- The pages are **static snapshots**: hex values are inlined and nothing responds to taps. Use the token classes in the last column, never the hex. States that aren't drawn (empty series, no results, search overlay) are described in HANDOFF.md only.

| Artboard | Frame (pt) | HTML | HANDOFF | State shown in the PNG |
|---|---|---|---|---|
| [home.png](artboards/screens/home.png) | 390 × 2060 | [home.html](html/screens/home.html) | §4.1, §4.6 | "Local" filter, first lecture active and paused at 16:05 |
| [events.png](artboards/screens/events.png) | 390 × 1360 | [events.html](html/screens/events.html) | §4.2, §4.6 | Default list, search closed |
| [event-detail.png](artboards/screens/event-detail.png) | 390 × 1111 | [event-detail.html](html/screens/event-detail.html) | §4.3, §4.6 | Lecture 02 active and **paused** |
| [now-playing.png](artboards/screens/now-playing.png) | 390 × 844 | [now-playing.html](html/screens/now-playing.html) | §4.4 | Default lecture copy, playing (the clock has advanced past the 16:05 start) |
| [now-playing-dark.png](artboards/screens/now-playing-dark.png) | 390 × 844 | [now-playing-dark.html](html/screens/now-playing-dark.html) | §4.4, DESIGN-SYSTEM §3 | Same as above, dark |
| [search.png](artboards/screens/search.png) | 390 × 844 | [search.html](html/screens/search.html) | §4.5 | "Search · recent": lectures scope, empty query, placeholder recents |
| [search-results.png](artboards/screens/search-results.png) | 390 × 844 | [search-results.html](html/screens/search-results.html) | §4.5 | "Search · results": "Ṣaḥābā" typed. The page was rendered from a 4-item sample list, so it shows "2 lectures found"; the count always comes from the results |
| [design-system.png](artboards/design-system.png) | 1000 × 2820 | [design-system.html](html/design-system.html) | DESIGN-SYSTEM §4–§6 | Semantic tokens light and dark, the category cycle, sample components, primitives and component tokens |

---

## 1. Home — `home.png`

| y (pt) | Region | HTML | Spec | Classes / tokens |
|---|---|---|---|---|
| 44–84 | Header: logo badge + name | [L8](html/screens/home.html#L8) | Padding 0 12 0 20. Badge 40×40, rx 12 ([L10](html/screens/home.html#L10)). Name 16/800, tagline 12/500 muted. Gap 10 | `pl-5 pr-bar`. Name `text-heading-sm`, tagline `text-fg-muted`. Badge from the artwork `palette`: olive-deep square, ivory arch, ochre crescent + base bar |
| 108–196 | Greeting | [L23](html/screens/home.html#L23) | Margin-top 24, gap 6. "Assalāmu ’alaykum" 14/700. Headline 28/800, line-height 1.15 | `text-primary`, `text-h1 font-manrope-extrabold` (token tracking) |
| 214–266 | Search field (button) | [L28](html/screens/home.html#L28) | Margin-top 18. Field full width, 52 high, radius 26, padding 0 18, icon 20, gap 10, "Search by topic" 15/500 | `bg-surface-2`, `text-fg-muted` |
| 290–535 | Continue listening card | [L35](html/screens/home.html#L35) | Margin-top 24, radius 28, padding 22, gap 14. Rosette 220×220 at right −70 / top −60. Title block padding-right 40 | `HeroCard` on `bg-emphasis` (DESIGN-SYSTEM §12) |
| — | ↳ overline | [L48](html/screens/home.html#L48) | 11/700, tracking 0.14em, uppercase | `text-overline text-emphasis-fg-muted` |
| — | ↳ title + scholar | [L49](html/screens/home.html#L49) | Title 20/800, line-height 1.25. Scholar 14/600. Gap 6 | `text-section text-emphasis-fg`, `text-emphasis-fg-muted` |
| — | ↳ play + progress | [L53](html/screens/home.html#L53) | Play 52 round, icon 22. Bar 4 high, ochre fill on 18% ivory track. Times 12/600 tabular, gap 8 | `bg-secondary`, icon `secondaryFg`, track `bg-emphasis-fg/[0.18]`, fill `bg-secondary`. "31 min left" = `minutesLeftLabel` |
| 570–592 | "Latest lectures" + count | [L72](html/screens/home.html#L72) | Margin-top 34, baseline aligned. Heading 20/800. Count 13/600 | `text-section`, `text-meta text-fg-muted` |
| 604–641 | Filter chips | [L77](html/screens/home.html#L77) | Margin-top 8, gap 8. 40 high, padding 0 16, 14/700 | On: `bg-primary text-primary-fg`. Off: `bg-surface-2 text-fg` |
| 657–1220 | Lecture rows (6 real) | [L88](html/screens/home.html#L88) | Margin-top 14, gap 10 between rows. Row padding 14 12 14 18, gap 14, radius 22. Text block + play button. Text gap 4. Title 15/700, 2 lines. Scholar 13/600. Meta 12/500. Play 44, icon 18. First row ([L90](html/screens/home.html#L90)) is the active one | `bg-surface-1`, active `bg-surface-2`. Play `bg-bg`, active `bg-primary`. Scholar `text-primary`, meta `text-fg-muted`. "36 min" = `minutesLabel` |
| 1220–1740 | Placeholder rows `[Lecture title]` | [L174](html/screens/home.html#L174) | Same row | Real data comes from the API |
| 1754–1820 | Skeleton row | [L230](html/screens/home.html#L230) | Same padding as a row. Bars 12/10/10 high at 85/55/70% width, gap 8. 44 round placeholder on the right | `skeleton.row` (`bg-surface-1`), bars `skeleton.bg` (`bg-surface-2`) |
| 1851–1875 | "Loading more lectures" | [L238](html/screens/home.html#L238) | 44 high, gap 10, 13/600. Spinner 18 | `text-meta text-fg-muted`; spinner ring `fg` at `border-strong` alpha, arc `primary` |
| — (not in PNG) | Empty series state | — | Padding 28 24, radius 22, gap 8. "No {series} lectures yet" 15/700 + "New recordings from this series will appear here." 13/500 (HANDOFF §4.1) | `bg-surface-1`, `text-fg-muted` |
| 1910–1970 | Mini player | [L260](html/screens/home.html#L260) | See §7. ⚠ Build: upright text (the HTML is italic, [L266](html/screens/home.html#L266)) | |
| 1972–2034 | Tab bar | [L282](html/screens/home.html#L282) | See §7 | |

## 2. Events — `events.png`

| y (pt) | Region | HTML | Spec | Classes / tokens |
|---|---|---|---|---|
| 52–145 | Title + subtitle + search button | [L8](html/screens/events.html#L8) | Padding 8 12 0 24. "Events" 32/800, line-height 1.1. Subtitle 14/500, line-height 1.5. Gap 6. Search 44 round ([L13](html/screens/events.html#L13)) | `pl-gutter pr-bar`. `text-display`, `text-body-sm text-fg-muted`, `bg-surface-2` |
| 160–195 | "11 events" count chip | [L18](html/screens/events.html#L18) | Margin-top 14. 32 high, padding 0 12, radius 16, gap 6, 13/700, radio icon 16 | Fixed `bg-cat-1-bg text-cat-1-fg` |
| 217–472 | Latest event card (whole card is one button) | [L25](html/screens/events.html#L25) | Margin-top 20, same shell as Continue listening. Rosette at right −80 / top −70. Title 22/800, line-height 1.2. Meta 14/600. Text padding-right 48 | `HeroCard`, `text-h2 text-emphasis-fg`, meta `text-emphasis-fg-muted` |
| — | ↳ chips + arrow | [L43](html/screens/events.html#L43) | Chips 32 high, padding 0 12, 13/700 on 12% ivory. Arrow circle 48, icon 20 at stroke 2.4 ([L48](html/screens/events.html#L48)) | `bg-emphasis-fg/[0.12]`, `bg-secondary` + `secondary-fg` icon. "2h 34m" = `totalLabel` |
| 512–532 | "All events" | [L54](html/screens/events.html#L54) | Margin-top 34, 20/800 | `text-section` |
| 556–570 | Year header "2026" | [L56](html/screens/events.html#L56) | Margin-top 16, 12/700, tracking 0.12em | `text-label text-fg-muted`. Year comes from the data's `year` |
| 585–825 | Event rows | [L57](html/screens/events.html#L57) | Margin-top 10, gap 10. Padding 12 8 12 12, gap 14, radius 22. Date tile 60×64, radius 16, day 22/800 + month 12/700. Text gap 5. Title 15/700. Stats 12/600. Venue 12/500 with pin 13. Chevron 20 | `bg-surface-1`. Stats `text-primary`, venue `text-fg-muted`. Tile `catClasses[catAt(index)]` (by position; the page shows cat-1, cat-2, cat-3). Tile shows the data's `day` / `month`, the start day (Sahaba = **24** Oct, as the HTML shows, [L60](html/screens/events.html#L60)). Decided 11 Nov 2026; this replaces the earlier "show the end day" note |
| 850–865 | Year header "2025" | [L90](html/screens/events.html#L90) | Margin-top 22 | `text-label text-fg-muted` |
| 880–975 | Jummah row | [L92](html/screens/events.html#L92) | No venue in the data, so no pin line; the date range shows instead. Optional parts are left out when missing | — |
| 987–1080 | Skeleton + "Loading more events" | [L104](html/screens/events.html#L104) | Tile 60×64. Bars at 80/50/65%. No right-hand placeholder. Status line at [L112](html/screens/events.html#L112) | `skeleton.row`, `skeleton.bg` |
| 1210–1260 | Mini player | [L120](html/screens/events.html#L120) | See §7. ⚠ Build: include forward 15 (missing here) | |
| 1270–1350 | Tab bar, Events active | [L138](html/screens/events.html#L138) | See §7 | |

## 3. Event detail — `event-detail.png`

| y (pt) | Region | HTML | Spec | Classes / tokens |
|---|---|---|---|---|
| 44–88 | Top bar | [L8](html/screens/event-detail.html#L8) | Padding 0 12. Back + share 44 round on surface. "Event" 15/700 centred | `px-bar`, `bg-surface-2`, `text-title` |
| 102–386 | Hero card | [L18](html/screens/event-detail.html#L18) | Margin 14 24 0. Rosette **240** at right −90 / top −80. Text padding-right 30 | `HeroCard` |
| — | ↳ "EVENT" pill | [L31](html/screens/event-detail.html#L31) | 28 high, padding 0 10, radius 14, gap 6, 11/800, tracking 0.12em, icon 14 | `rounded-tile bg-emphasis-fg/[0.12]`. ⚠ Build: `text-overline` (700) |
| — | ↳ title + date | [L35](html/screens/event-detail.html#L35) | Title 28/800, line-height 1.15. Date 14/600 with the **full month name** | `text-h1 text-emphasis-fg`, `text-emphasis-fg-muted` |
| — | ↳ info chips (wrap) | [L39](html/screens/event-detail.html#L39) | Gap 8. 32 high, 13/700, icons 14 (layers, clock, pin) | `bg-emphasis-fg/[0.12]` |
| 416–440 | "Lectures from this event" + "4" | [L55](html/screens/event-detail.html#L55) | Margin-top 30 (Home uses 34). Count shows the number only | `text-section`, `text-meta text-fg-muted` |
| 455–1100 | Numbered rows (data order) | [L60](html/screens/event-detail.html#L60) | Margin-top 12, gap 10. Padding 12, gap 14, radius 22. Number tile 44, radius 14, 15/800 tabular. Title 15/700. Scholar 13/600. Meta 12/600 | Row `bg-surface-1`. Tile fixed `bg-cat-1-bg text-cat-1-fg`, active `bg-primary text-primary-fg`. Scholar and active meta `text-primary`, other meta `text-fg-muted`. ⚠ Build: title max 3 lines (not clamped in the HTML). "35:48" = `clockLabel`. ⚠ Build: row 04 shows "24 Oct · 39:37" (the page was rendered before its duration was derived, [L119](html/screens/event-detail.html#L119); HANDOFF §6) |
| 590–700 | ↳ active row (02) | [L79](html/screens/event-detail.html#L79) | Meta "Paused · 16:05 / 46:21" | `bg-surface-2`. Both states ("Now playing ·" / "Paused ·") in HANDOFF §4.3 |
| 970–1040 | Mini player | [L134](html/screens/event-detail.html#L134) | Use flexbox + safe area for the bottom bar, not a fixed height | See §7. ⚠ Build: include forward 15 (missing here) |
| 1040–1108 | Tab bar, Events active | [L152](html/screens/event-detail.html#L152) | See §7 | |

## 4. Now Playing — `now-playing.png` / `now-playing-dark.png`

The light and dark pages share the same structure; the dark one ([now-playing-dark.html](html/screens/now-playing-dark.html)) is one line longer (an extra wrapper at the top), so its line numbers are one higher. The page draws only play/pause, seek and the two skip buttons; build only those (no like, shuffle, repeat, next or previous).

| y (pt) | Region | HTML | Spec | Classes / tokens |
|---|---|---|---|---|
| 44–88 | Top bar | [L6](html/screens/now-playing.html#L6) | Padding 0 12. Chevron-down 44, transparent, icon 24. Centre: "Playing from" 12/600 over the source 14/700 (max-width 250, one line), gap 2 ([L9](html/screens/now-playing.html#L9)). Right: empty 44 spacer | `px-bar`. `text-caption font-manrope-semibold text-fg-muted` (sentence case), source `text-body-sm font-manrope-bold text-fg` |
| 98–440 | Artwork | [L16](html/screens/now-playing.html#L16) | Margin 10 24 0, 342×342, radius 28. Rosette SVG at [L17](html/screens/now-playing.html#L17) | Fixed `palette` colours. Shadow `useThemeShadows().artwork` (none in dark) |
| 460–540 | Title + scholar | [L53](html/screens/now-playing.html#L53) | Padding 0 24, margin-top 20, full width. Title 22/800, line-height 1.22, 2 lines. Scholar 15/700, margin-top 6 | `text-h2`, scholar `font-manrope-bold text-[15px] text-primary` |
| 548–598 | Venue + date lines | [L56](html/screens/now-playing.html#L56) | Margin-top 12, gap 6. Icon 16 in an 18 box, gap 8. Text 14/500, one line. Weekday computed from the date | `text-body-sm font-manrope text-fg-muted`; MapPin, Calendar. `longDateLabel` |
| 610–644 | Tags row | [L66](html/screens/now-playing.html#L66) | Margin-top 14, gap 8. Topic pill 34 high, padding 0 12, 13/700. Event link 34 high, padding 0 8 0 12, 1.5px border, gap 6, layers 14 + name (ellipsised) + chevron 14 ([L68](html/screens/now-playing.html#L68)) | Topic pill by topic: `catClasses[catForTopic(lecture.category[0], topicOrder)]` ("sahaba r.a" is first in `topicOrder`, so `cat-1`); `border-[1.5px] border-border-strong`. Link opens event detail |
| 662–712 | Slider + times | [L77](html/screens/now-playing.html#L77) | Margin-top 18. Track 5, round caps. Thumb r 8 with a 2.5 ring. Times 12/600 tabular, margin-top 6 ([L85](html/screens/now-playing.html#L85)) | `track`, fill and thumb `primary`, ring `border-bg`. Remaining time = `clockLabel`. ⚠ Build: tap + drag, touch area ≥ 44 high (the HTML is tap-only, 28 high) |
| 730–806 | Controls | [L91](html/screens/now-playing.html#L91) | Centred, gap 28, margin-top 18. Back 15 60 round, icon 26 ([L92](html/screens/now-playing.html#L92)). Play 96×76, radius 26 playing / 38 paused, 0.25 s ease, icon 30 ([L95](html/screens/now-playing.html#L95)). Forward 15 60 round ([L101](html/screens/now-playing.html#L101)) | `bg-surface-2`; `bg-primary`, icon `primary-fg`. Play shadow `useThemeShadows().playButton`. 15 icons: DESIGN-SYSTEM §13 |
| 806–844 | Open ground | — | Plain background below the controls | `bg-bg` |

## 5. Search — `search.png` / `search-results.png`

| y (pt) | Region | HTML | Spec | Classes / tokens |
|---|---|---|---|---|
| 44–92 | Back + input pill | [L6](html/screens/search.html#L6) | Padding 0 12, gap 6. Back 44, transparent (Event detail's back button has a surface background). Pill 48 high, radius 24, padding 0 4 0 16, gap 8, search icon 18 ([L9](html/screens/search.html#L9)). Input 15/600. Trailing mic or ✕ is 40 | `px-bar`, `bg-surface-2`, `text-fg-muted` placeholder |
| 120–146 | "Recent searches" + "Clear all" | [L23](html/screens/search.html#L23) | Margin-top 22. Heading 16/800. Clear all 14/700, 44 high | `text-heading-sm`, `text-primary` |
| 162–426 | Recents card (5 rows) | [L31](html/screens/search.html#L31) | Margin-top 4, radius 22. Row 52 high, padding-left 16, gap 12, 15/600. Clock 18. Remove 44 with ✕ 16. Divider 1px at 10% foreground ([L43](html/screens/search.html#L43)) | `bg-surface-1`, dividers `bg-border`. Saving rules in HANDOFF §4.5. The PNG shows the placeholder seeds (HANDOFF §6) |
| — (not in PNG) | No recents | — | "Your searches will appear here." Padding 20, radius 22, 14/500 | `bg-surface-1 text-fg-muted` |
| 456–528 | "Popular topics" chips (lectures scope only) | [L88](html/screens/search.html#L88) | Margin-top 28, chips margin-top 12, gap 8, 40 high, 14/700 ([L91](html/screens/search.html#L91)) | `text-heading-sm`; chips by topic: Ṣaḥābā `cat-1`, Finance `cat-2`, Fire `cat-3`. ⚠ Build: chip text in the matching `cat-N-fg` (the HTML uses `fg`) |
| 112–128 (results PNG) | Results heading | [L31](html/screens/search-results.html#L31) | Margin-top 18. 14/700, sentence case, "N lectures found" | `text-body-sm font-manrope-bold text-fg-muted` |
| 137–344 (results PNG) | Result rows | [L33](html/screens/search-results.html#L33) | Gap 8. Padding 10 12 10 10, gap 14. Tile 48, radius 14, waveform icon 22 (or day/month badge for events) ([L34](html/screens/search-results.html#L34)). Title 15/700, 2 lines, `<mark>` radius 4 ([L42](html/screens/search-results.html#L42)). Scholar 13/600. Meta 12/500. Chevron 18 | `bg-surface-1`, mark `search.highlight` + `search.highlightFg` (the HTML draws the marked text in `fg`), scholar `text-primary`. Tile by topic (both results are Ṣaḥābā, so `cat-1`) with the icon in the matching `cat-N-fg`. ⚠ Build: `rounded-row` (22; the HTML uses 20) |
| — (not in PNG) | No results | — | Padding 32 20, radius 22, gap 6. Copy in HANDOFF §4.5 | `bg-surface-1` |
| — | Matching logic | — | Accent-insensitive fold; title or topic tag only | HANDOFF §4.5 |

## 6. Design system board — `design-system.png`

| Region | HTML | Notes |
|---|---|---|
| Title + intro | [L5](html/design-system.html#L5) | — |
| Light panel: semantic tokens | [L13](html/design-system.html#L13) | Grouped Base, Primary, Secondary, Emphasis, Inverse, Controls and status. Match DESIGN-SYSTEM §5 exactly |
| ↳ Category cycle | [L260](html/design-system.html#L260) | cat-1 sage, cat-2 ochre, cat-3 clay, cat-4 teal, cat-5 plum, then repeat |
| ↳ In use | [L282](html/design-system.html#L282) | Sample components: filter chips, a lecture row, the Continue listening card, the mini player, an error card, the tab bar |
| Dark panel | [L345](html/design-system.html#L345) | Same layout as the light panel, dark values |
| Primitives | [L679](html/design-system.html#L679) | The eight ramps in DESIGN-SYSTEM §4 |
| Component tokens | [L1026](html/design-system.html#L1026) | DESIGN-SYSTEM §6 |

The board samples are smaller than the real components. Build the real sizes from the screen specs.

## 7. Shared: mini player + tab bar

Drawn in three places with small differences: [Home L259](html/screens/home.html#L259), [Events L119](html/screens/events.html#L119), [Event detail L133](html/screens/event-detail.html#L133). ⚠ Build: one `MiniPlayer` component with the spec below (HANDOFF §4.6).

| Part | Spec | Classes / tokens |
|---|---|---|
| Container | Padding 0 12 24, gap 8. Top hairline `0 −1px 0` at 10% foreground | `px-bar bg-bg`, `tabBar.divider` (`border-t border-border`), bottom padding = safe area |
| Mini player | Margin-top 10, radius 20, padding 8 8 10 8, gap 4. Progress line 3 high along the bottom edge | `miniPlayer.bg` (`bg-inverse`, dark `bg-emphasis`), `miniPlayer.outline`, `rounded-mini`; line `miniPlayer.progress` (`bg-secondary`) |
| ↳ artwork thumb | 44, forest background, 5-petal rosette 28 | `rounded-thumb-sm` (10; the HTML uses 12), `miniPlayer.thumbBg` (`bg-emphasis`) |
| ↳ text | Gap 2. Title 14/700, one line, upright. Scholar 12/600 | `miniPlayer.fg`, `miniPlayer.fgMuted` |
| ↳ buttons | Play/pause 44, icon 22. Forward 15 44, icon 22 ([Home L277](html/screens/home.html#L277)), **on every screen** | Icon colour `miniPlayerColors[scheme].fg` |
| Tabs | Two columns, gap 4. Item padding-top 4, gap 4. Pill 60×32, radius 16, icon 22. Label 12, 800 active / 600 inactive | Active pill `tabBar.activeBg` (`bg-primary-subtle`), icon `tabBar.activeFg` (`primary-subtle-fg`), label `text-fg`. Inactive `tabBar.inactiveFg` (`text-fg-muted`) |
