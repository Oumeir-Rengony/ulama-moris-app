import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

// Every number that shapes the player's motion, in one file, so tuning on a device is one edit.
//
// The player is one sheet with two sizes: the bar (index 0) and the full player (index 1). Every
// "index" below is a point on that scale; −1 is gone, below the screen.

// The sheet's spring: every snap (a tap on the bar, the chevron, Android back, a release). Heavily
// damped, with no overshoot, so the sheet never leaves the screen's bottom uncovered. The
// energyThreshold settles it early instead of letting it creep the last pixel into place.
export const SHEET_SPRING: WithSpringConfig = {
  damping: 500,
  stiffness: 1000,
  mass: 3,
  overshootClamping: true,
  energyThreshold: 0.001,
};

// A row tap with nothing loaded: the sheet first jumps to the bar's place (no animation), then
// grows from there into the full player.
export const SHEET_JUMP: WithTimingConfig = { duration: 0 };

// Opening Search: the tab bar slides down out of the way while the mini player drops into its
// place (and the reverse on the way back). About as long as Search's slide in from the right.
export const TAB_BAR_SLIDE_TIMING: WithTimingConfig = { duration: 250 };

// The sheet's drag starts after 8 pt vertically, and gives up after 12 pt horizontally, so the
// seek bar (4 pt horizontally) always wins a scrub.
export const PANEL_ACTIVE_OFFSET_Y: [number, number] = [-8, 8];
export const PANEL_FAIL_OFFSET_X: [number, number] = [-12, 12];

// A finger that moves further than this (pt) is dragging the sheet, not tapping the bar.
export const BAR_TAP_MAX_DISTANCE = 10;

// The sheet counts as resting at an end only this close to it, and only with no finger dragging
// it.
export const RESTING_AT_FULL_INDEX = 0.99;
export const RESTING_AT_BAR_INDEX = 0.01;
export const RESTING_GONE_INDEX = -0.99;

// Over this first bit of the way up, the card stretches from the bar's height down to the
// screen's bottom, and stays pinned there from then on. It happens behind the tab bar.
export const CARD_PINNED_TO_BOTTOM_INDEX = 0.05;
// Past this, the card has left the bar: square corners, no shadow, no outline.
export const CARD_LEAVES_BAR_INDEX = 0.05;
// The card's colour changes from the bar's to Now Playing's over 0 → this.
export const CARD_COLOR_CHANGE_END_INDEX = 0.4;

// The bar's row fades out over 0 → this.
export const BAR_ROW_FADE_OUT_END_INDEX = 0.1;
// Now Playing's content fades in over these.
export const FULL_CONTENT_FADE_IN_START_INDEX = 0.1;
export const FULL_CONTENT_FADE_IN_END_INDEX = 0.3;

// The bar's height before it has been measured (normal text size).
export const ESTIMATED_BAR_HEIGHT = 62;
