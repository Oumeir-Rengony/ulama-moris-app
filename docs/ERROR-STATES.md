# Ulama Moris: Error and Offline States

Each state has a working page in `html/error-states/<name>.html` (opens in any browser, offline) and an image in `artboards/error-states/<name>.png`.

These states are built as a separate stage, after every screen is done. See HANDOFF.md §9 for when and in what order.

| File (`.html` / `.png`) | When it shows |
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
- **Try again:** every error has one. While retrying, show a spinner and "Trying again" with `accessibilityState={{ busy: true }}`; ignore further taps. If it fails again, change the body to a "Still no connection…" line.
- **No retry loops.** Retry on tap, or automatically once when the connection comes back (`@react-native-community/netinfo`).
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
- Checking: spinner + "Checking connection". Still offline: "Still offline. Turn on Wi‑Fi or mobile data, then try again." Connected: close the sheet and load Home.
- Modal semantics: `accessibilityViewIsModal`, focus moves to the title.

### lecture-didnt-load: first page failed
- Replaces the list rows below the chips (header, search and chips stay usable).
- Centred `bg-surface-1` card, radius 22, padding 28/24: 56px `bg-danger-subtle` circle with a cloud-alert icon in `danger-subtle-fg`, "Lectures didn’t load" (17 ExtraBold), "Check your internet connection, then try again." (14, `text-fg-muted`), 48px `bg-primary` / `text-primary-fg` "Try again" pill with a retry icon.
- Fails again: "Still no connection. Try again in a moment."
- Reuse the same card for Events ("Events didn’t load").

### more-lectures-didnt-load / more-events-didnt-load: next page failed
- **One shared footer component** for both infinite lists. The rows already loaded stay.
- Replaces the skeleton/"Loading more" footer with a `bg-danger-subtle` card, radius 22, padding 14/14/14/16:
  - left: "More lectures didn’t load" / "More events didn’t load" (14 ExtraBold) over "Check your connection." (13); both `text-danger-subtle-fg`
  - right: 44px ivory (`bg-bg`) "Try again" pill with a retry icon
- Fails again: "Still no connection." On success, the footer turns back into the loading row and new items append.
- The mini player and tab bar stay as normal.

### search-results-didnt-load
- On the search screen with a query typed, the results area shows the same card as `lecture-didnt-load`, titled "Results didn’t load".
- On success the results appear ("3 lectures found" …). Recent searches still work offline (they're stored on the device).

### audio-didnt-load: Now Playing
- The top bar, artwork, title, scholar, venue/date and tags stay.
- The progress bar is replaced by a `bg-danger-subtle` alert row (radius 18, padding 12/14): alert-circle icon, "This lecture didn’t load" (14 ExtraBold), "Check your internet connection, then try again." (13); all `text-danger-subtle-fg`, `accessibilityRole="alert"`.
- Controls: back 15 and forward 15 disabled at 35% opacity. Play/pause becomes a 76px-high, at least 150px-wide `bg-primary` button with a retry icon and "Try again" in `primary-fg`, `playButton` shadow. While retrying: spinner + "Trying again". On success, playback resumes from the saved position and the normal controls return.

### mini-player-lecture-didnt-load
- Scholar line becomes "Didn’t load. Tap retry." in the component token `miniPlayer.errorFg` (primitive clay-200 `#E6BCA9`, light clay in both themes; `danger-subtle-fg` would be unreadable on the dark bar; no semantic role fits yet).
- Play/pause becomes a retry button with a `miniPlayer.fg` icon on a `miniPlayer.retryBg` circle (`emphasis-fg` at 12%; `accessibilityLabel="Try again"`). Forward 15 disabled (35%).
- The 3px progress line switches from `miniPlayer.progress` (`secondary`) to `miniPlayer.errorLine` (`danger`). Known gap: `danger` on the dark-mode `emphasis` bar is about 2.8:1, below the 3:1 floor for lines (DESIGN-SYSTEM.md §16).
- Retrying: spinner + "Trying again…"; success: back to the normal mini player and playing. Tapping the text still opens Now Playing, which shows `audio-didnt-load`.

## Icons
lucide-react-native: `WifiOff` (offline), `CloudOff` (list/search card; the design draws a cloud with an exclamation mark, so swap in a custom SVG if you want that exact icon), `AlertCircle` (audio row), `RotateCw` (retry). The 15-second skip icons are custom SVG (see DESIGN-SYSTEM.md).
