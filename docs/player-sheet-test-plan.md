# Player sheet: edge-case test plan

Manual and scripted checks for the player sheet (the mini player that grows into Now Playing). Jest
can't run any of this: the sheet's drag, springs and resting check only run on a device or in the
browser. The risks behind these cases are in [player-sheet-caveats.md](player-sheet-caveats.md);
the bug that started this is
[drag-past-bar-stops-playback.md](issues/drag-past-bar-stops-playback.md).

## The rules every case checks

1. **Nothing started on Now Playing stops playback.** A drag, flick or tap that starts on Now
   Playing ends at the full player or the bar, and the lecture keeps playing.
2. **Only the bar (its swipe down, or the screen-reader action) stops playback.**
3. **The sheet always comes to rest at an end:** gone, the bar, or the full player. Never stuck
   half-way.
4. **The store agrees with what is on screen** once the sheet has stopped (see "Reading the
   result").
5. **No blink:** the artwork doesn't flash or reload during or after the move.

## Where to run what

| Where | Good for | Can't do |
|---|---|---|
| iOS simulator + AXe | Speeds (swipe duration and point spacing), start and end points, settings (text size, Reduce Motion), lock and background | Pausing mid-drag, changing direction mid-drag, two fingers, anything inside a spring (each AXe step takes about a second, longer than the 0.4 s spring, even in `axe batch`) |
| Web + `playwright-cli` | Exact paths: hold, pause, reverse, step by step with the mouse | Real touch, iOS springs. Needs lecture data (see "Web setup") |
| By hand (DeviceHub with the mouse, or a phone) | Two fingers, system gestures (Notification Center, Control Center, home), calls | Repeatable timing |
| Android phone (none yet) | Gesture vs three-button navigation, Android back, the known slow-drag bug | — |

## Setup

### iOS simulator

1. Metro running without `CI=1` (`npx expo start --ios`); Expo Go opened with
   `exp://127.0.0.1:8081?__expo_disable_fab=1&__expo_disable_onboarding=1`.
2. Tap a lecture's play button on Home. Now Playing opens and the lecture plays.
3. Re-measure the positions with `axe describe-ui` if the device isn't an iPhone 17 (402 × 874 pt).
   On iPhone 17: the full player's top is at y = 0, the bar's top at about y = 705, the bar's centre
   at about y = 732, the tab bar below it.

Swipe speeds with AXe (`axe swipe --start-x … --start-y … --end-x … --end-y … --duration D --delta P`):

| Name | `--duration` | `--delta` (pt between points) | Roughly, over a 400 pt swipe |
|---|---|---|---|
| Crawl | 4 | 1 | 100 pt/s |
| Slow | 1.5 | 2 | 300 pt/s |
| Medium | 0.5 | 4 | 900 pt/s |
| Flick | 0.15 | 6 | 2,700 pt/s |
| Hard flick | 0.08 | 10 | 5,000 pt/s |

Gesture Handler needs enough points to start a drag: a fast swipe with a small `--delta` may
not register. Each AXe command waits about a second before touching; that's AXe, not the app.

### Web setup

The live API only sends its CORS header to the app's deployed web address, so the web build on
`localhost:8081` can't read it. Run the website locally instead: in `../ulama-moris`,
`npm run dev` (its API allows `http://localhost:8081` in development), set
`EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1` in `.env`, and restart Metro. Use a 390 × 844
window.

On web, the hidden half of the player stays in the accessibility tree (see the results), so read the
state from positions, not labels: Now Playing is open when the chevron's top is near 0, at the bar
when the chevron and the bar are in the bottom third, gone when both are below the window. What the
store says shows in Now Playing's panel (`data-testid="now-playing-panel"`): `pointer-events` is
`none` while the presentation is closed.

Drags with exact paths:

```bash
playwright-cli mousemove 200 420
playwright-cli mousedown
playwright-cli mousemove 200 600     # move in steps; repeat for a slow path
playwright-cli mousemove 200 800
# pause: just wait before the next command
playwright-cli mouseup
```

For a precise speed, use `run-code` with `page.mouse.move(x, y, { steps: n })` between
`mouse.down()` and `mouse.up()`.

### Recording

Screenshots take about a second, too slow for motion. Record every case that moves:

```bash
xcrun simctl io booted recordVideo --force case.mov &   # stop with kill -INT
ffmpeg -i case.mov -vf "fps=10,scale=120:-1,tile=10x3" -frames:v 1 case.png
```

## Reading the result

After the sheet stops, run `axe describe-ui` and look for these labels:

| On screen | Labels present |
|---|---|
| Now Playing open | `Minimise player`, `Back 15 seconds`, `Forward 15 seconds` |
| The bar | `Open player: <title>, <author>` (with the action `Stop and close player`), and `Play` or `Pause` |
| Gone | Neither of the above |

To see whether the lecture is playing, look for `Pause` (playing) or `Play` (paused) on the bar or
Continue listening, and check that the time moves between two screenshots.

Write each result in the log at the end: pass, fail (what happened), or "can't run here".

## A. From Now Playing, downward

Start: Now Playing open and playing. Expected for every case: the sheet ends at the **bar** (or
back at the full player for short or slow moves), the lecture **keeps playing**, never gone.

| ID | Start | End | Speeds |
|---|---|---|---|
| A1 | Middle (y 420) | y 700 (the sheet moves 280 pt, less than half-way) | Crawl, slow, medium: back to full. Flick, hard flick: bar |
| A2 | Middle (y 420) | Bottom edge (y 870), past the bar | All five. Slow is the original bug |
| A3 | Middle (y 420) | 25% of the way (y 600) | Crawl (expect full), flick (expect bar) |
| A4 | Middle (y 420) | Half way to the bar (y 770) | Crawl, slow: note which end it picks |
| A5 | Top, chevron row (y 90) | Bottom edge | Slow, flick. On Android this is the known slow-drag bug |
| A6 | Artwork (y 300) | Bottom edge | Medium, hard flick |
| A7 | Bottom controls area, between buttons (y 800) | Bottom edge | Slow, flick |

## B. From the bar

Start: the bar showing and playing (close Now Playing with the chevron first).

| ID | Gesture | Speeds | Expected |
|---|---|---|---|
| B1 | Up from the bar's centre to the top (y 732 → 50) | All five | Full player, still playing |
| B2 | Up a little (y 732 → 650, about 80 pt) | Crawl, flick | Back to the bar (an AXe flick isn't fast enough to carry 80 pt past half-way) |
| B3 | Down from the bar's centre: 20, 50, 85, 120 pt, and to the bottom edge | Crawl and flick for each | Find the point where it stops playback. Crawl: about 85 pt (half the distance to gone). Flick: much less. Decide whether that is too easy to hit by accident |
| B4 | Down a little, then let go with no speed (crawl 30 pt) | Crawl | Back to the bar, still playing |
| B5 | Up half way, then (web or by hand) back down past the bar in the same drag | Slow | Gone, playback stops (the drag started on the bar, so this is allowed) |

## C. Where the finger starts

Start: Now Playing open, unless it says the bar. Each case: a medium-speed vertical drag of
300 pt down (or up for the bar). Expected: the sheet moves, **and the control under the finger
does not fire** (no pause, no skip, no seek, no navigation).

| ID | Starts on |
|---|---|
| C1 | Play/pause button |
| C2 | Back 15 / forward 15 |
| C3 | The chevron (`Minimise player`): only the drag happens, no extra close |
| C4 | Seek bar, straight down: the sheet moves (a short drag springs back to full), the position doesn't jump |
| C5 | Seek bar, diagonal at 30°, 45° and 60° from horizontal: note which one wins. A scrub must still work when the finger moves mostly sideways |
| C6 | The event pill: the sheet moves, the event doesn't open |
| C7 | The bar: on its play/pause button, its title, its thumbnail. Also a 9 pt move then release (between the drag's 8 pt and the tap's 10 pt): either it drags or nothing happens, never both |

## D. Changing direction and holding (web or by hand)

| ID | Path | Expected |
|---|---|---|
| D1 | From Now Playing: down to the bar, hold 1 s, let go | Bar, still playing |
| D2 | From Now Playing: down past the bar to the bottom edge, hold 1 s, let go | Bar, still playing (the sheet waited at the bar while the finger went on) |
| D3 | From Now Playing: down past the bar, hold, then flick back up | Full player. Watch the recording for the tab screens flashing behind the sheet or the bar's row showing (caveat 11) |
| D4 | From the bar: up to the top, hold, flick down hard | Bar (or gone if the flick projects past it). Watch for a brief open/close flicker (caveat 11) |
| D5 | From Now Playing: down half way, back up to the top, let go | Full player |
| D6 | From Now Playing: zig-zag down and up several times, let go near the bar | Bar, still playing |
| D7 | Drag slowly, stop moving for 1 s mid-screen, let go | The nearer end (speed should read as 0) |

## E. Interrupting springs and quick repeats

| ID | Steps | Expected |
|---|---|---|
| E1 | Tap the bar, and while it grows, grab it and flick down | Bar, still playing (pan down to close is already off) |
| E2 | Tap the bar, and while it grows, grab it and flick up | Full player |
| E3 | Chevron, and while it shrinks, grab it and flick down hard | Bar, still playing (web, grabs 60–200 ms after the tap). Caveat 12 not reproduced |
| E4 | Let go of a drag, then grab again before the spring ends, several times | Always ends at an end, never stuck |
| E5 | Double tap the bar; double tap the chevron | One open; one close. No bounce |
| E6 | While dragging Now Playing, let the lecture end (seek to 5 s before the end first) | Ends sensibly at the bar or gone, no crash (caveat 6) |
| E7 | Flick Now Playing to the bar and swipe the bar down immediately after | Gone. If the second swipe is held at the bar, note it (caveat 13) |
| E8 | Tap a row's play button with nothing loaded, and grab the sheet while it jumps or grows | Ends at an end. The lecture starts |
| E9 | Tap a different lecture's row while the bar is showing | The bar grows into Now Playing with the new lecture |

## F. Other screens and states

| ID | Where | Cases | Expected |
|---|---|---|---|
| F1 | Search (bar in the tab bar's place) | B1, B3, A2 | Same results as on a tab |
| F2 | Search with the keyboard open (bar riding on it) | B1 (keyboard closes as it opens), B3 | Same results; the keyboard doesn't move the sheet |
| F3 | Events tab, and an event's detail | A2, B3 | Same results |
| F4 | Lecture paused | A2, B3 | A2: stays paused, bar. B3: gone |
| F5 | Lecture whose audio failed (turn the network off, then play a lecture) | A2, B1, B3 | No crash. Opening reloads it; the bar's swipe clears it |
| F6 | The queue ended while Now Playing is open | A2 | Now Playing closes and the sheet leaves (there is no bar to go to) |
| F7 | A `/player?slug=…` deep link while the bar is showing | Then A2 | Opens Now Playing; A2 as normal |

## G. System settings and interruptions

| ID | Setting or event | Cases | Expected |
|---|---|---|---|
| G1 | Reduce Motion on (Settings › Accessibility › Motion) | Tap the bar, chevron, A2, B1, B3, a row tap with nothing loaded | Moves without animation but always ends at the right end. The sheet must appear (caveat 8) |
| G2 | Largest text size (`xcrun simctl ui booted content_size accessibility-extra-extra-extra-large`, then restart Expo Go) | B1, A2, B3, then look at Now Playing for cut-off text | The bar is taller, the sheet still lands on it exactly. Note anything cut off (caveat 19) |
| G3 | Pull Notification Center from the top edge while Now Playing is open; Control Center likewise (by hand) | — | The sheet ends at an end. Note which one |
| G4 | Press Home (`axe button home`) during a slow drag (by hand: start the drag, press Home) | — | On return, the sheet is at an end and the store agrees |
| G5 | Lock the screen while Now Playing is open, unlock | — | Still open, still playing |
| G6 | Two fingers: drag with one, tap play/pause with the other; drag with both | — | No crash, ends at an end |

## H. Android (when a phone is available)

| ID | Case |
|---|---|
| H1 | A2, B1, B3, D2 with gesture navigation |
| H2 | The same with three-button navigation |
| H3 | Android back while Now Playing is open, and during its opening spring |
| H4 | A5 (slow drag from the top): the known spring-back. Check it is still the only Android difference |

## Web

On web, repeat A2, B1, B3, C4 and D1–D7 with the mouse. Also:

- A trackpad two-finger scroll over the sheet: it must not move the sheet.
- Resize the window while Now Playing is open: the sheet stays full; after closing, the bar is in
  the right place.
- Keyboard: Tab to the bar and press Enter. It can't open (known limit); a screen reader's
  activate action does.

## After a gorhom or Gesture Handler upgrade

Run A1, A2, B1, B3, C4, D2 and E1 at least. The drag wrapper depends on gorhom's default handlers
(caveat 15).

## Results log

Run on 2026-11-28, on the branch `fix/now-playing-drag-past-bar` (drag flag through gorhom's public
handler hook, pan down to close only while Now Playing is closed). iOS: iPhone 17 simulator, iOS
27.0, Expo Go. Web: Chromium through `playwright-cli`, 390 × 844, live lectures.

"Playing" means the lecture was still playing after the move (Pause shown, time moving).

### iOS simulator

| ID | Speeds | Result |
|---|---|---|
| A1 | All five | Pass. Crawl, slow, medium: back to full. Flick, hard: bar. Always playing |
| A2 | All five | **Pass: the original bug is fixed.** Bar, playing, at every speed |
| A3 | Crawl, flick | Pass. Full, playing (180 pt isn't enough even flicked) |
| A4 | Crawl, slow | Pass. Bar, playing |
| A5 | Slow, flick | Pass. Bar, playing (from the top of Now Playing) |
| A6 | Medium, hard | Pass. Bar, playing |
| A7 | Slow, flick | Pass. Full, playing; the buttons the drag started between didn't fire |
| B1 | All five | Pass. Full, playing |
| B2 | Crawl, flick | Bar, playing (see the corrected expectation above) |
| B3 | Crawl and flick at 20, 50, 85, 120, 138 pt | **Measured.** Crawl: stays at 85 pt, stops at 120 pt. Flick: stays at 20 pt, stops at 50 pt. A short flick down on the bar is enough to stop playback |
| B4 | Crawl | Pass. Bar, playing |
| C1, C2 | Slow | Pass. Starting on play/pause, back 15 or forward 15: no button fired, no time jump |
| C3 | Medium | Pass. Drag from the chevron: bar, playing, no extra close |
| C4 | Slow, medium | Pass. The sheet moved and sprang back; no seek |
| C5 | Medium | **Measured.** Horizontal scrubs seek. Over 200 pt, a drift of up to 36 pt (about 10°) still seeks; 54 pt (15°) hands the touch to the sheet and the seek is lost |
| C6 | Medium | Pass. The event didn't open |
| C7 | Medium, crawl | Pass. From the bar's play button or thumbnail: opens without pausing. A 9 pt move: nothing happens |
| E1–E3 | — | Can't run with AXe (the grab lands after the spring). Run on web instead |
| E9 | — | Pass. Another lecture's row while the bar shows: Now Playing with the new lecture, playing |
| F1 | Search, keyboard closed | Pass. A2 → bar, B1 → full, B3 flick → gone |
| F2 | Search, keyboard open (bar at y 506) | Pass. B1 → full (keyboard closes), B3 flick → gone |
| F4 | Paused lecture | Pass. A2 → bar, still paused. B3 → gone |
| F5 | Lecture audio failing | Pass. Error shown; A2 → bar, B1 → full, B3 → gone |
| F7 | `/player?slug=…` while the bar shows | Pass. Opens Now Playing for the loaded lecture (the link only loads its own lecture when nothing is loaded); A2 → bar |
| G1 | Reduce Motion on | Pass. Opening jumps to Now Playing in one frame, no animation; the sheet always appears. Row tap, chevron, bar tap, A2, B1, B3 all end right |
| G2 | Largest text size | Sheet: pass (bar 50 pt tall; A2, B1, B3 right). **Now Playing: fail.** The seek bar (y 877) and play button (y 1013) are below the screen (874), so touch can't reach them. Not caused by this branch |
| G4 | Home, then back to the app (not mid-drag) | Pass. Still open and playing; A2 → bar afterwards |
| G5 | Lock and unlock | Pass. Still open, still playing |

### Web

| ID | Result |
|---|---|
| A2, B1 | Pass |
| C4 | The sheet moved and sprang back to full (as on iOS) |
| D1, D2 | Pass. Bar, playing; the store changed once, when the sheet came to rest |
| D3 | Pass. Flicks back up to y 640 and 400: stayed open the whole time, full. Short flicks (y 740–815, finger still below the bar's clamp point): bar. **Caveat 11 not reproduced:** the store never flipped closed and back |
| D4 | Flick down to y 100 or 205: back to full. To y 400: bar. No flicker |
| D5, D6, D7 | Pass |
| E1, E2 | Pass |
| E3 | Grabs 60, 120 and 200 ms after the chevron, hard flick down: bar, playing every time. **Caveat 12 not reproduced** |
| E4 | Four release-and-grab rounds: ends at the bar, playing |
| E5 | Pass. Double tap on the bar: one open. On the chevron: one close |
| E7 | Flick to the bar, then flick the bar down: gone, playback stopped (allowed: the second swipe started on the bar) |
| E8 | Row tap with nothing loaded, grab after 40 ms and flick down: bar, playing. After 150 ms: full, playing. No gone, nothing stuck |
| Wheel | Pass. A mouse wheel over Now Playing doesn't move the sheet |
| Resize | Pass. Still full after widening and narrowing the window |
| Screen readers | **Finding:** on web, Now Playing's controls stay in the accessibility tree while it is closed, and the bar's "Open player" and Pause while Now Playing is open. `accessibilityElementsHidden` / `importantForAccessibility` don't reach the web. Not caused by this branch |

### Not run

- E6 (the lecture ending during a drag): needs the last lecture of a queue.
- F3 (Events tab and event detail), F6 (queue ended while open).
- G3, G6 (Notification Center, Control Center, two fingers): by hand.
- H1–H4: no Android phone.
