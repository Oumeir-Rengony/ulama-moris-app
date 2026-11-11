// Tier 1: primitives. Raw colours in hue ramps, no meaning.
// ONLY semantic tokens (global.css / tokens.ts) and component tokens may reference these.
// Never use a primitive directly in a screen.
export const primitives = {
  sand: { 50: '#F1EBDD', 100: '#EAE3D3', 200: '#E4DCC9' },
  charcoal: { 700: '#363B30', 800: '#30352B', 900: '#292D25' },
  stone: { 200: '#D5D9C9', 300: '#BDC0AE', 600: '#5A5F52', 700: '#555C49' },
  olive: { 100: '#DDE2D3', 200: '#C9D1BA', 300: '#A9B49A', 600: '#56613F', 800: '#3B4330', 850: '#3A4334' },
  ochre: { 100: '#EFE2BF', 200: '#E3CF9A', 400: '#C6A75D', 600: '#725B2A', 700: '#5E5130', 900: '#4A4330' },
  clay: { 100: '#EBD3C8', 200: '#E6BCA9', 500: '#B8755C', 700: '#5E4034', 900: '#4A3831' },
  teal: { 100: '#D3E0DC', 200: '#B7D3CC', 700: '#2F4A45', 900: '#2F403C' },
  plum: { 100: '#E5D6DD', 200: '#DDC2CE', 700: '#4F3A45', 900: '#44363D' },
} as const;

export type PrimitiveRamp = keyof typeof primitives;
