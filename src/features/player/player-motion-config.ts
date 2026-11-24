import type { WithSpringConfig } from 'react-native-reanimated';

// Every number that shapes the player's motion, in one file, so tuning on a device is one edit.

// The panel sliding open or closed: every release, the chevron, Android back. Nearly no bounce.
export const PANEL_SPRING: WithSpringConfig = { damping: 26, stiffness: 220, mass: 1 };
// The spring overshoots upwards a little when opening; this much card is drawn below the panel's
// bottom edge so the screen's bottom stays covered.
export const PANEL_BLEED = 48;

// The panel's drag starts after 8 pt vertically, and gives up after 12 pt horizontally, so the
// seek bar (4 pt horizontally) always wins a scrub.
export const PANEL_ACTIVE_OFFSET_Y: [number, number] = [-8, 8];
export const PANEL_FAIL_OFFSET_X: [number, number] = [-12, 12];

// Let go past this share of the screen's height (or flicked faster than this, in pt/s), the panel
// closes; otherwise it springs back open. Tune on a device.
export const PANEL_CLOSE_DISTANCE_SHARE = 0.25;
export const PANEL_CLOSE_VELOCITY = 800;

// The bar's swipe starts after 8 pt up or down (down dismisses, up opens Now Playing), and gives
// up after 12 pt horizontally, so taps and its buttons still work.
export const BAR_SWIPE_ACTIVE_OFFSET_Y: [number, number] = [-8, 8];
export const BAR_DISMISS_FAIL_OFFSET_X: [number, number] = [-12, 12];

// Let go past this share of the bar's height (or flicked faster than this, in pt/s), the bar is
// dismissed and playback stops; otherwise it springs back. Tune on a device.
export const BAR_DISMISS_DISTANCE_SHARE = 0.5;
export const BAR_DISMISS_VELOCITY = 500;

// Swiped up past this share of the bar's height (or flicked up faster than this, in pt/s), the
// bar opens Now Playing; otherwise nothing happens. The bar itself never moves up. Tune on a device.
export const BAR_OPEN_DISTANCE_SHARE = 0.5;
export const BAR_OPEN_VELOCITY = 500;

// Dismissed, the bar slides down over this long (ease-out) while it fades out. Not dismissed, it
// springs back with BAR_SPRING, carrying the finger's speed.
export const BAR_DISMISS_DURATION_MS = 200;
export const BAR_SPRING: WithSpringConfig = { damping: 26, stiffness: 220, mass: 1 };

// The bar's height before it has been measured (normal text size).
export const ESTIMATED_BAR_HEIGHT = 62;
