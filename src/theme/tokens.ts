// Ulama Moris design tokens.
//
// Three colour tiers (each may only point at the one below it):
//   1. primitives → src/theme/primitives.ts              raw hex ramps, never used in screens
//   2. semantic   → this file + global.css                roles; the ONLY colours screens use
//   3. component  → src/components/<Name>/tokens.ts       per-component hooks onto semantic tokens
//
// STYLING: use NativeWind classes (bg-bg, text-fg-muted, bg-primary, text-primary-fg, border-border ...).
// They read the CSS variables in global.css and switch light/dark automatically.
// Use the JS values below only where a className can't reach: react-native-svg fills, icon `color`
// props, StatusBar, navigation theme, Reanimated colour interpolation, shadows (useThemeShadows).
// NativeWind's hook, not React Native's: the classes and these JS values must read the
// same light/dark choice, including an in-app theme switch if one is added later.
import { useColorScheme } from 'nativewind';
import { primitives } from './primitives';

export const lightColors = {
  bg: primitives.sand[50],                    // Screen background
  surface1: primitives.sand[100],             // Lowest raised surface: list rows, cards, empty states
  surface2: primitives.sand[200],             // Higher surface: chips, search field, round icon buttons, skip buttons, active row
  fg: primitives.charcoal[900],               // Primary text and icons
  fgMuted: primitives.stone[600],             // Secondary text, meta, inactive tab
  primary: primitives.olive[600],             // Main action and brand text: selected chip, active play button, scholar names, Now Playing progress and play button
  primaryFg: primitives.sand[50],             // Text/icons on primary
  primarySubtle: primitives.olive[100],       // Soft selected state
  primarySubtleFg: primitives.olive[800],     // Text/icons on primary-subtle
  secondary: primitives.ochre[400],           // Ochre fills: play button on emphasis cards, progress lines
  secondaryFg: primitives.charcoal[900],      // Text/icons on secondary
  secondaryStrong: primitives.ochre[600],     // Ochre text, icons or thin lines on bg/surfaces
  secondarySubtle: primitives.ochre[100],     // Soft ochre background (search highlight, badges)
  secondarySubtleFg: primitives.ochre[700],   // Text on secondary-subtle
  emphasis: primitives.olive[800],            // Emphasis cards: Continue listening, Latest event, Event hero; mini-player thumb
  emphasisFg: primitives.sand[50],            // Text/icons on emphasis
  emphasisFgMuted: primitives.stone[200],     // Secondary text on emphasis (and on the mini player)
  inverse: primitives.charcoal[900],          // Inverse surface (light-mode mini player)
  inverseFg: primitives.sand[50],             // Text/icons on inverse
  track: primitives.olive[300],               // Unfilled progress track
  danger: primitives.clay[500],               // Error lines, strokes, icons
  dangerSubtle: primitives.clay[100],         // Error rows and cards
  dangerSubtleFg: primitives.clay[700],       // Text/icons on danger-subtle
  cat1Bg: primitives.olive[100],              // Category 1 tile/tag background
  cat1Fg: primitives.olive[800],              // Text/icon on cat-1-bg
  cat2Bg: primitives.ochre[100],              // Category 2 tile/tag background
  cat2Fg: primitives.ochre[700],              // Text/icon on cat-2-bg
  cat3Bg: primitives.clay[100],               // Category 3 tile/tag background
  cat3Fg: primitives.clay[700],               // Text/icon on cat-3-bg
  cat4Bg: primitives.teal[100],               // Category 4 tile/tag background
  cat4Fg: primitives.teal[700],               // Text/icon on cat-4-bg
  cat5Bg: primitives.plum[100],               // Category 5 tile/tag background
  cat5Fg: primitives.plum[700],               // Text/icon on cat-5-bg
} as const;

export const darkColors: Record<keyof typeof lightColors, string> = {
  bg: primitives.charcoal[900],
  surface1: primitives.charcoal[800],
  surface2: primitives.charcoal[700],
  fg: primitives.sand[50],
  fgMuted: primitives.stone[300],
  primary: primitives.olive[300],
  primaryFg: primitives.charcoal[900],
  primarySubtle: primitives.olive[850],
  primarySubtleFg: primitives.olive[200],
  secondary: primitives.ochre[400],
  secondaryFg: primitives.charcoal[900],
  secondaryStrong: primitives.ochre[400],
  secondarySubtle: primitives.ochre[900],
  secondarySubtleFg: primitives.ochre[200],
  emphasis: primitives.olive[800],
  emphasisFg: primitives.sand[50],
  emphasisFgMuted: primitives.stone[200],
  inverse: primitives.sand[50],
  inverseFg: primitives.charcoal[900],
  track: primitives.stone[700],
  danger: primitives.clay[500],
  dangerSubtle: primitives.clay[900],
  dangerSubtleFg: primitives.clay[200],
  cat1Bg: primitives.olive[850],
  cat1Fg: primitives.olive[200],
  cat2Bg: primitives.ochre[900],
  cat2Fg: primitives.ochre[200],
  cat3Bg: primitives.clay[900],
  cat3Fg: primitives.clay[200],
  cat4Bg: primitives.teal[900],
  cat4Fg: primitives.teal[200],
  cat5Bg: primitives.plum[900],
  cat5Fg: primitives.plum[200],
};

export type SemanticColor = keyof typeof lightColors;

// border = fg at 10%, border-strong = fg at 20% (both themes). The classes live in tailwind.config.js.
export const borderAlpha = { border: 0.1, borderStrong: 0.2 } as const;

// Follows the same light/dark choice as the NativeWind classes.
export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  if (colorScheme === 'dark') {
    return darkColors;
  }
  return lightColors;
}

// Category colours tell list items and topics apart. They carry no meaning, and never signal
// state (errors use danger). They are assigned by ROTATION: cat-1 → cat-2 … cat-5 → cat-1 again.
// Not Math.random(): a random colour would change on every render and every launch.
export type Category = 1 | 2 | 3 | 4 | 5;

const categoryCount = 5;

// Position rule (event date tiles, search result tiles): item 0 → cat-1 … item 5 → cat-1 again.
export function catAt(index: number): Category {
  // The extra "+ categoryCount" keeps the result positive if a negative index ever comes in.
  const position = ((index % categoryCount) + categoryCount) % categoryCount;
  return (position + 1) as Category;
}

// Topic rule (Now Playing topic pill, lecture search tiles). A topic must keep the same colour on
// every screen. Topics are free text from the API with no fixed list, so the colour is worked
// out from the topic's own letters: the same text always adds up to the same number. Case is
// ignored, so "SEERAH" and "Seerah" match. An empty topic (a lecture without one) is cat-1.
// cat-3 is left out: it shares the clay hue of the error colour, and Now Playing shows the topic
// pill right above its "This lecture didn’t load" row, where a clay pill would look like part of
// the error.
const topicCategories: Category[] = [1, 2, 4, 5];

export function catForTopic(topic: string): Category {
  let letterTotal = 0;
  for (const character of topic.toLowerCase()) {
    letterTotal += character.codePointAt(0) ?? 0;
  }
  const position = letterTotal % topicCategories.length;
  return topicCategories[position];
}

// Tailwind only keeps classes it can see written out, so the class names are literal here.
// Usage:
//   const cat = catClasses[catAt(index)];
//   <View className={cat.bg}><Text className={cat.fg}>24</Text></View>
export const catClasses: Record<Category, { bg: string; fg: string }> = {
  1: { bg: 'bg-cat-1-bg', fg: 'text-cat-1-fg' },
  2: { bg: 'bg-cat-2-bg', fg: 'text-cat-2-fg' },
  3: { bg: 'bg-cat-3-bg', fg: 'text-cat-3-fg' },
  4: { bg: 'bg-cat-4-bg', fg: 'text-cat-4-fg' },
  5: { bg: 'bg-cat-5-bg', fg: 'text-cat-5-fg' },
};

// JS colour for an icon on a category tile (lucide `color` prop), e.g. the search result AudioLines icon.
//   const colors = useThemeColors();
//   <AudioLines color={colors[catFgColorKey[category]]} />
export const catFgColorKey: Record<Category, SemanticColor> = {
  1: 'cat1Fg',
  2: 'cat2Fg',
  3: 'cat3Fg',
  4: 'cat4Fg',
  5: 'cat5Fg',
};

// Scrim behind the blocking offline pop-up: charcoal-900 at 62%, the same in both themes.
// A scrim is an overlay, not a theme colour, so it isn't a semantic token. Apply it with `style`.
export const scrim = 'rgba(41, 45, 37, 0.62)';

// Illustration palette (fixed, theme-independent). Use it ONLY for artwork (rosettes, the logo
// badge), which keeps the same colours in light and dark. It sits outside the three UI tiers:
// never reuse an artwork green as a UI colour.
export const palette = {
  ivory: '#F1EBDD',
  charcoal: '#292D25',
  olive: '#66734C',       // main leaves
  oliveDeep: '#56613F',   // logo badge
  forest: '#3B4330',
  sage: '#A9B49A',
  ochre: '#C6A75D',       // rosette sun, logo crescent
  terracotta: '#B8755C',  // rosette centre only
  leaf: '#7C8A5D',        // lighter leaf in rosettes
  leafLight: '#BCC5AB',   // inner leaves of the Now Playing artwork
} as const;

// Fonts: npx expo install @expo-google-fonts/manrope expo-font
// In className use font-manrope (Medium) / -regular / -semibold / -bold / -extrabold (see tailwind.config.js).
export const font = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export const type = {
  display: { fontFamily: font.extrabold, fontSize: 32, lineHeight: 35, letterSpacing: -0.8 },
  h1: { fontFamily: font.extrabold, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  h2: { fontFamily: font.extrabold, fontSize: 22, lineHeight: 26, letterSpacing: -0.3 },
  section: { fontFamily: font.extrabold, fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
  title: { fontFamily: font.bold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: font.medium, fontSize: 15, lineHeight: 22 },
  headingSmall: { fontFamily: font.extrabold, fontSize: 16, lineHeight: 20, letterSpacing: -0.16 },
  bodySmall: { fontFamily: font.medium, fontSize: 14, lineHeight: 21 },
  meta: { fontFamily: font.semibold, fontSize: 13, lineHeight: 17 },
  caption: { fontFamily: font.medium, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: font.bold, fontSize: 12, lineHeight: 16, letterSpacing: 1.4 },
  overline: { fontFamily: font.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  tabLabel: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
  // Times: always use tabular numbers so digits don't jiggle
  time: { fontFamily: font.semibold, fontSize: 12, fontVariant: ['tabular-nums'] as const },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, section: 34 } as const;
export const screenPadding = 24;
// Top bars and the tab bar use a smaller side inset so 44px icon buttons line up
// optically with content that starts at screenPadding.
export const barInset = 12;

export const radius = {
  thumbSm: 10, // mini player thumb (class: rounded-thumb-sm)
  tile: 14,    // number tiles, search result tiles, "EVENT" pill
  thumb: 16,   // date tiles
  mini: 20,    // mini player
  row: 22,     // list rows (including search results), empty states
  card: 28,    // emphasis cards, artwork
  pill: 999,
} as const;

export const size = {
  touch: 44,          // minimum touch target
  iconButton: 44,
  searchField: 52,
  dateTile: 60,       // Events date tile width (height 64)
  searchTile: 48,     // search result tile
  playButtonRow: 44,
  playButtonHero: 52,
  skipButton: 60,     // Now Playing back/forward 15
  tag: 34,            // Now Playing topic tag and event link height
  artwork: 342,       // 390 - 2 * 24
} as const;

// Shadows use React Native's `boxShadow` style (CSS syntax), so the values match the
// design files exactly. Usage:
//   const shadows = useThemeShadows();
//   <View style={{ boxShadow: shadows.artwork }} />
export const lightShadows = {
  artwork: '0px 28px 48px -26px rgba(41, 45, 37, 0.55)',
  playButton: '0px 14px 28px -16px rgba(41, 45, 37, 0.6)',
  offlineSheet: '0px 30px 60px -30px rgba(0, 0, 0, 0.6)',
  // The mini player floating over the content, above the tab bar.
  miniPlayer: '0px 14px 30px -14px rgba(41, 45, 37, 0.6)',
};

// Dark mode drops shadows: a dark shadow on the charcoal ground can't be seen.
export const darkShadows: Record<keyof typeof lightShadows, string | undefined> = {
  artwork: undefined,
  playButton: undefined,
  offlineSheet: undefined,
  // Dark keeps the bar's 1px outline instead.
  miniPlayer: undefined,
};

export function useThemeShadows() {
  const { colorScheme } = useColorScheme();
  if (colorScheme === 'dark') {
    return darkShadows;
  }
  return lightShadows;
}
