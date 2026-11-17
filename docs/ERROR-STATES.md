# Ulama Moris: Error and Offline States

The next build stage. Every screen is built; this stage adds the error and offline states on top of them.

Each state has a design screenshot in `artboards/error-states/<name>.png`. This file is the source of truth for copy, colours, layout and behaviour; where a screenshot disagrees, this file wins.

| Screenshot (`.png`) | When it shows |
|---|---|
| `offline` | App opened (or resumed) with **no internet** |
| `lecture-didnt-load` | Had a connection, but the **first page of lectures** failed |
| `more-lectures-didnt-load` | Home list: the **next page** failed while scrolling |
| `more-events-didnt-load` | Events list: the **next page** failed while scrolling |
| `search-results-didnt-load` | Search **results** failed to load |
| `audio-didnt-load` | Now Playing: the **lecture audio** failed |
| `mini-player-lecture-didnt-load` | Mini player: the **lecture audio** failed (normal state shown above it for comparison) |

## Shared rules

Colour names follow the three-tier system in DESIGN-SYSTEM.md: screens use semantic tokens; the mini player uses its component tokens.

- **Colour:** errors use the semantic `danger` family: `bg-danger-subtle` with `text-danger-subtle-fg` for rows, cards and icon circles (light `#EBD3C8` / `#5E4034`, dark `#4A3831` / `#E6BCA9`), and `danger` (clay-500 `#B8755C`) for lines and icons. On the mini player use `miniPlayer.errorFg` / `miniPlayer.errorLine` instead. Never a category colour (`cat-3` shares the hue but is not an error token). There is no separate red. Full rules: DESIGN-SYSTEM.md §5.3.
- **Copy:** say what happened and what to do; never apologise. Pattern: "X didn’t load" + "Check your internet connection, then try again."
- **Try again:** every error has one. While retrying, the retry icon becomes a spinner and the label stays "Try again" (so the button keeps its width), with `accessibilityState={{ busy: true }}`; ignore further taps. If it fails again, the error shows again with the same message: there is no second wording (decided 17 Nov 2026, to keep it simple).
- **No retry loops.** Retry on tap, or automatically once when the connection comes back (`@react-native-community/netinfo`). The lecture audio is the exception: it loads again only when the lecture is opened again.
- **Accessibility:** announce errors (`accessibilityLiveRegion="polite"` on Android, `AccessibilityInfo.announceForAccessibility` on iOS). Disabled controls get `accessibilityState={{ disabled: true }}`.

## States

### offline: no internet (blocking pop-up)
- Triggered on launch or return to foreground when NetInfo reports no connection. **Blocks the app**; it can't be dismissed, and Android back does nothing.
- Behind it: the Home skeleton (header, greeting, search bar, chips, `skeleton.bg` placeholder rows) under a fixed charcoal scrim, `scrim` from tokens.ts (charcoal-900 at 62%, applied with `style={{ backgroundColor: scrim }}`), the same in both themes. A scrim is an overlay, not a theme colour.
- Sheet: bottom-anchored, 16px side margins, radius 32, `bg-bg`, padding 28/24/24, `offlineSheet` shadow from `useThemeShadows()` (none in dark), centred content:
  - 72px `bg-danger-subtle` circle with a wifi-off icon in `danger-subtle-fg`
  - "No internet connection" (22 ExtraBold)
  - "Ulama Moris needs the internet to load and play lectures. Check your Wi‑Fi or mobile data, then try again." (15 Medium, `text-fg-muted`)
  - full-width 52px `bg-primary` button "Try again"
- Checking: spinner + "Checking connection". Still offline: the sheet stays with the same message. Connected: close the sheet and load Home.
- Modal semantics: `accessibilityViewIsModal`, focus moves to the title.

### lecture-didnt-load: first page failed
- Replaces the list rows below the chips (header, search and chips stay usable).
- Centred `bg-surface-1` card, radius 22, padding 28/24: 56px `bg-danger-subtle` circle with a cloud-alert icon in `danger-subtle-fg`, "Lectures didn’t load" (17 ExtraBold), "Check your internet connection, then try again." (14, `text-fg-muted`), 48px `bg-primary` / `text-primary-fg` "Try again" pill with a retry icon.
- Fails again: the same card and message.
- Reuse the same card for Events ("Events didn’t load").

### more-lectures-didnt-load / more-events-didnt-load: next page failed
- **One shared footer component** for both infinite lists. The rows already loaded stay.
- Replaces the skeleton/"Loading more" footer with a `bg-danger-subtle` card, radius 22, padding 14/14/14/16:
  - left: "More lectures didn’t load" / "More events didn’t load" (14 ExtraBold) over "Check your connection." (13); both `text-danger-subtle-fg`
  - right: 44px ivory (`bg-bg`) "Try again" pill with a retry icon
- Fails again: the same footer and message. On success, the footer turns back into the loading row and new items append.
- The mini player and tab bar stay as normal.

### search-results-didnt-load
- On the search screen with a query typed, the results area shows the same card as `lecture-didnt-load`, titled "Results didn’t load".
- On success the results appear ("3 lectures found" …). Recent searches still work offline (they're stored on the device).

### audio-didnt-load: Now Playing
- The top bar, artwork, title, scholar, venue/date and tags stay.
- The progress bar is replaced by a `bg-danger-subtle` alert row (radius 18, padding 12/14): alert-circle icon, "This lecture didn’t load" (14 ExtraBold), "Check your internet connection, then open the lecture again." (13); all `text-danger-subtle-fg`, `accessibilityRole="alert"`.
- Controls: back 15, play and forward 15 all disabled at 35% opacity. **No "Try again" in the players** (decided 17 Nov 2026: one way to recover, fewer states to get wrong). Opening the lecture again loads it again: its list row, Continue listening, or the mini player (close Now Playing, tap the bar). The reload shows the normal loading look and resumes from the saved position; if it fails again, this state comes back. It never reloads by itself (not even when the connection comes back), so sound never starts without a tap.

### mini-player-lecture-didnt-load
- Scholar line becomes "Didn’t load. Tap to open again." in the component token `miniPlayer.errorFg` (primitive clay-200 `#E6BCA9`, light clay in both themes; `danger-subtle-fg` would be unreadable on the dark bar; no semantic role fits yet).
- Play and forward 15 disabled (35%). No retry button.
- The 3px progress line switches from `miniPlayer.progress` (`secondary`) to `miniPlayer.errorLine` (`danger`). Known gap: `danger` on the dark-mode `emphasis` bar is about 2.8:1, below the 3:1 floor for lines (DESIGN-SYSTEM.md §16).
- Tapping the text opens Now Playing and loads the lecture again (normal loading look). If it fails again, Now Playing shows `audio-didnt-load`.

## Icons
lucide-react-native: `WifiOff` (offline), `CloudOff` (list/search card; the design draws a cloud with an exclamation mark, so swap in a custom SVG if you want that exact icon), `AlertCircle` (audio row), `RotateCw` (retry). The 15-second skip icons are custom SVG (see DESIGN-SYSTEM.md).

## Where each state plugs in

| State | Where it plugs in | Screen it changes |
|---|---|---|
| `offline` | Root layout: blocking bottom sheet over the Home skeleton, on launch and on return to foreground | Whole app |
| `lecture-didnt-load` | Home list area below the chips, when the first page fails. Same card for Events ("Events didn’t load") | Home, Events |
| `more-lectures-didnt-load` / `more-events-didnt-load` | Replaces the "Loading more" footer when a next page fails. **One shared footer component** for both lists | Home, Events |
| `search-results-didnt-load` | Search results area, same card as `lecture-didnt-load`, titled "Results didn’t load" | Search |
| `audio-didnt-load` | Replaces the Now Playing progress bar; play and both skip buttons disabled | Now Playing |
| `mini-player-lecture-didnt-load` | Mini player scholar line, play button and progress line | Mini player |

## Build order

One step at a time; show each step before moving on.

1. Install `@react-native-community/netinfo` with `npx expo install`. Add error and retry to the data layer (the paginated stub fetchers and the player), so each list and the player can report "failed" and expose a `retry()`. Add a way to force failures in development, to test each state.
2. In `src/providers/app-providers.tsx`, connect TanStack Query's `onlineManager` to NetInfo and `focusManager` to `AppState`.
3. Shared pieces: the `danger-subtle` error card, the "Try again" button with its retrying state (spinner, label unchanged, `busy`), and the announce-for-accessibility helper.
4. List states: first page failed (Home, Events), next page failed (shared footer), search results.
5. Player states: Now Playing audio, mini player.
6. Offline pop-up (root layout, NetInfo, foreground check, auto-retry once when the connection comes back).
7. Check every state in light and dark, on the iOS simulator and the web build.

## Checklist

- [ ] Every error has one "Try again". Retrying shows a spinner (label unchanged) and ignores extra taps; a second failure shows the same message again.
- [ ] No retry loops: retry on tap, or automatically once when NetInfo reports the connection is back.
- [ ] Rows already loaded stay when a next page fails. Now Playing resumes from the saved position when the failed lecture is opened again and loads.
- [ ] The offline sheet blocks the app (no dismiss, Android back does nothing), is modal for screen readers, and owns its bottom inset.
- [ ] Errors are announced (Android live region, iOS `announceForAccessibility`); disabled controls expose `disabled`.
- [ ] Error colours only: `bg-danger-subtle` / `text-danger-subtle-fg` on screen grounds and `danger` for lines and icons; `miniPlayer.errorFg` / `miniPlayer.errorLine` on the mini player; `scrim` from tokens.ts for the offline pop-up. Never a category colour, no hex in components, no separate red.
