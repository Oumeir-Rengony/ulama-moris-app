import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

// Every number that shapes the player's motion, in one file, so tuning on a device is one edit.
// Values come from docs/Audio-Player-Animations.md §5.4 unless a comment says otherwise.

// The fresh entrance: the sheet springs up from below the screen, with a slight overshoot.
export const SHEET_SPRING: WithSpringConfig = { stiffness: 230, damping: 25, mass: 1 };

// The bar growing into Now Playing, and a swipe collapse carrying the finger's speed. No bounce.
export const MORPH_SPRING: WithSpringConfig = { stiffness: 220, damping: 26, mass: 1 };

// A short swipe on Now Playing or on the bar, released before the threshold: back into place.
export const SNAP_BACK_SPRING: WithSpringConfig = { stiffness: 260, damping: 22, mass: 1 };

// The chevron or Android back: Now Playing shrinks into the bar.
export const COLLAPSE_TIMING: WithTimingConfig = { duration: 390, easing: Easing.bezier(0.4, 0, 0.2, 1) };

// The bar dropping away (a switch to another lecture, or a dismiss). openNowPlaying and
// dismissMiniPlayer wait exactly this long, so the flow and the animation never disagree.
export const MINI_EXIT_MS = 320;
// The first 18 % of the drop lifts the bar by 5 px before it falls, like the prototype.
export const MINI_EXIT_LIFT_SHARE = 0.18;
export const MINI_EXIT_LIFT_PX = 5;
// How far the bar falls while it fades out.
export const MINI_DROP_DISTANCE_PX = 70;
// Accelerates away. The spec's choice for a short dismissal that leaves the screen.
export const MINI_EXIT_EASING = Easing.bezier(0.4, 0, 0.9, 0.6);

// The bar coming back on its own (it mounts without a collapse).
export const MINI_RISE_SPRING = MORPH_SPRING;

// With Reduce Motion on, every change is a short crossfade instead.
export const REDUCED_FADE_MS = 200;
export const REDUCED_BAR_FADE_MS = 150;

// The screen behind Now Playing, when Now Playing fully covers it.
export const TUCK = {
  scale: 0.92,
  translateY: 12,
  radius: 26,
  dimOpacity: 0.3,
} as const;

// Not in the spec: SHEET_SPRING overshoots upwards, and without this extra height below the
// window a strip of the tucked list shows under the sheet for a few frames.
export const BACKGROUND_BLEED = 48;

// The bar's shape (HANDOFF §4.6): radius 20, a 44 px thumbnail 8 px from its left and top
// edges, radius 10. The full cover has radius 28.
export const MINI_BAR_RADIUS = 20;
export const MINI_THUMB_SIZE = 44;
export const MINI_THUMB_INSET = 8;
export const MINI_THUMB_RADIUS = 10;
export const FULL_COVER_RADIUS = 28;

// Swipe thresholds. Now Playing collapses past 18 % of the screen or on a fast flick
// (points per second). The bar dismisses past 24 px or on a fast flick.
export const COLLAPSE_SWIPE_SHARE = 0.18;
export const COLLAPSE_SWIPE_VELOCITY = 1000;
export const DISMISS_SWIPE_DISTANCE = 24;
export const DISMISS_SWIPE_VELOCITY = 800;
