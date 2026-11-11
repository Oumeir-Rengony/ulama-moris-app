/** @type {import('tailwindcss').Config} */
// NativeWind v4 (Tailwind v3). Semantic colours come from CSS variables in global.css,
// so every class flips automatically between light and dark.
const c = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  // Routes, components and hooks all live under src/ in this project.
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Backup for the category colours: prefer the literal class map in src/theme/tokens.ts (catClasses).
  safelist: [{ pattern: /^(bg|text)-cat-[1-5]-(bg|fg)$/ }],
  // Follows the system. Set 'class' if you add an in-app theme switch; tokens.ts already
  // reads NativeWind's useColorScheme, so the JS colours will follow it too.
  darkMode: 'media',
  theme: {
    extend: {
      // Only semantic tokens (tier 2) are exposed as classes.
      // No primitives, no component tokens, no artwork palette here.
      colors: {
        'bg': c('bg'),
        'surface-1': c('surface-1'),
        'surface-2': c('surface-2'),
        'fg': c('fg'),
        'fg-muted': c('fg-muted'),
        'primary': c('primary'),
        'primary-fg': c('primary-fg'),
        'primary-subtle': c('primary-subtle'),
        'primary-subtle-fg': c('primary-subtle-fg'),
        'secondary': c('secondary'),
        'secondary-fg': c('secondary-fg'),
        'secondary-strong': c('secondary-strong'),
        'secondary-subtle': c('secondary-subtle'),
        'secondary-subtle-fg': c('secondary-subtle-fg'),
        'emphasis': c('emphasis'),
        'emphasis-fg': c('emphasis-fg'),
        'emphasis-fg-muted': c('emphasis-fg-muted'),
        'inverse': c('inverse'),
        'inverse-fg': c('inverse-fg'),
        'track': c('track'),
        'danger': c('danger'),
        'danger-subtle': c('danger-subtle'),
        'danger-subtle-fg': c('danger-subtle-fg'),
        // Five category colours: tell list items and topics apart, never signal state.
        'cat-1-bg': c('cat-1-bg'),
        'cat-1-fg': c('cat-1-fg'),
        'cat-2-bg': c('cat-2-bg'),
        'cat-2-fg': c('cat-2-fg'),
        'cat-3-bg': c('cat-3-bg'),
        'cat-3-fg': c('cat-3-fg'),
        'cat-4-bg': c('cat-4-bg'),
        'cat-4-fg': c('cat-4-fg'),
        'cat-5-bg': c('cat-5-bg'),
        'cat-5-fg': c('cat-5-fg'),
        // Hairlines and outlines: fg at a fixed alpha, so they follow the theme.
        'border': 'rgb(var(--color-fg) / 0.1)',
        'border-strong': 'rgb(var(--color-fg) / 0.2)',
      },
      fontFamily: {
        // Custom fonts in RN pick the FILE, not a weight: use these, not font-bold etc.
        manrope: ['Manrope_500Medium'],
        'manrope-regular': ['Manrope_400Regular'],
        'manrope-semibold': ['Manrope_600SemiBold'],
        'manrope-bold': ['Manrope_700Bold'],
        'manrope-extrabold': ['Manrope_800ExtraBold'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '35px', letterSpacing: '-0.8px' }],
        h1: ['28px', { lineHeight: '32px', letterSpacing: '-0.6px' }],
        h2: ['22px', { lineHeight: '26px', letterSpacing: '-0.3px' }],
        section: ['20px', { lineHeight: '24px', letterSpacing: '-0.2px' }],
        title: ['15px', { lineHeight: '20px' }],
        body: ['15px', { lineHeight: '22px' }],
        'heading-sm': ['16px', { lineHeight: '20px', letterSpacing: '-0.16px' }], // brand name, "Recent searches", "Popular topics"
        'body-sm': ['14px', { lineHeight: '21px' }],
        meta: ['13px', { lineHeight: '17px' }],
        caption: ['12px', { lineHeight: '16px' }],
        label: ['12px', { lineHeight: '16px', letterSpacing: '1.4px' }], // Events year headers (bold)
        overline: ['11px', { lineHeight: '14px', letterSpacing: '1.5px' }], // always bold (700), uppercase
      },
      borderRadius: {
        'thumb-sm': '10px', // mini player thumb (not 'sm', so Tailwind's built-in rounded-sm stays 2px)
        tile: '14px', // number tiles, search result tiles, "EVENT" pill
        thumb: '16px',
        mini: '20px',
        row: '22px',
        card: '28px',
      },
      spacing: {
        gutter: '24px', // screen side padding for content
        bar: '12px', // side inset for top bars and the tab bar, so 44px buttons line up with content at 24
        touch: '44px',
      },
    },
  },
  plugins: [],
};
