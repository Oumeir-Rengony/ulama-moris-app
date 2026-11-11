# Stage 2: Design system (tokens, theme, fonts, typography)

> **Status: ✅ Done (11 Nov 2026).** Verified on the web build: `/dev/tokens` in light and dark, Manrope in all five weights, `check:theme` catching deliberate breaks. Lint, typecheck, `check:theme` and `expo-doctor` (20/20) pass. **Still open:** the iOS simulator checks (§7.3, §7.5 theme switch, §7.6 largest Dynamic Type), once a simulator is available.
> **Doc paths:** the docs refer to `docs/updated-doc/…`. In this repo, those files live directly in `docs/…`.
> **Build order:** this is HANDOFF §7 step 1. It depends on Stage 1 (folder structure and routes).

## Goal

Put the docs' three-tier colour system (primitives → semantic → component) and Manrope typography into the app with NativeWind v4. Every screen and component then styles itself only with semantic classes, and light and dark both work. Make the system **easy to extend without getting messy**:
- adding a primitive, a semantic role, a category, a component token or a whole theme follows one written procedure;
- a check script catches any drift between the four files that hold colours, and any hex value in UI code.

## Skills to load

| Skill | Why |
|---|---|
| `expo-overview` | Entry point. Confirms SDK 58 install rules (`npx expo install`) |
| `expo-design-system` | Token files, how components take variant/size props, auditing for hardcoded colours, spacing and fonts |
| `expo-native-ui` | Native fit: status bar style, navigation theme background, how system controls look in both themes |
| `frontend-design` | Required for user-facing UI changes (root AGENTS.md routing table). Here it covers the typography scale and visual consistency |
| `vercel-composition-patterns` | The `Text` component's API: one `variant` prop, not many boolean props |
| `react-native-best-practices` / `vercel-react-native-skills` | Keep theme hooks cheap (no context re-render storms). Load fonts before the splash hides |
| `playwright-cli` | Screenshot the token preview on web in light and dark (the web build stands in for Android) |

## References

- [DESIGN-SYSTEM.md](../docs/DESIGN-SYSTEM.md):
  - §1 naming rules; §4 primitives; §5 semantic tokens; §5.1 categories; §5.2 ochre rules; §5.3 errors; §6 component tokens
  - **§7 choosing and adding a colour**; §8 contrast; §9 do/don't
  - §10 typography, radii and spacing; §11 shadows; §12 recipes
  - **§14 NativeWind setup** (exact versions and steps); §16 open decisions
- [COLOUR-SYSTEM-CHANGES.md](../docs/COLOUR-SYSTEM-CHANGES.md): old-to-new name map. Use it if a reference uses an old name (`hero`, `cta`, `on-primary`)
- Source files to copy unchanged: [global.css](../docs/global.css), [tailwind.config.js](../docs/tailwind.config.js), [src/theme/primitives.ts](../docs/src/theme/primitives.ts), [src/theme/tokens.ts](../docs/src/theme/tokens.ts), [src/components/*/tokens.ts](../docs/src/components/)
- Visual reference: [html/design-system.html](../docs/html/design-system.html), [artboards/design-system.png](../docs/artboards/design-system.png) (and [ARTBOARD-MAP.md §6](../docs/ARTBOARD-MAP.md))
- [HANDOFF.md §0–§1](../docs/HANDOFF.md): colour names to tokens, and design principles (contrast, touch targets, Manrope, tabular numbers)

## 1. Install NativeWind (DESIGN-SYSTEM §14, follow exactly)

1. `npx expo install nativewind@4.2.7` (pinned). Then `npm i -D tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11`. Don't use NativeWind v5 or Tailwind v4.
2. `babel.config.js`: `presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"]`. Check that this works with `experiments.reactCompiler: true`. The compiler is enabled through babel-preset-expo, so leave that preset's options otherwise as they are.
3. `metro.config.js`: `withNativeWind(getDefaultConfig(__dirname), { input: "./src/global.css" })`.
4. `nativewind-env.d.ts` at the root: `/// <reference types="nativewind/types" />`. Make sure `tsconfig.json`'s `include` picks it up.
5. Before writing code, check NativeWind's installation page for SDK 58 notes. The docs say SDK 58 isn't officially listed yet; a test bundle passed, but nobody has rendered it on a device.

## 2. Copy the token files (tiers 1–3)

| From `docs/` | To | Tier |
|---|---|---|
| `src/theme/primitives.ts` | `src/theme/primitives.ts` | 1 |
| `global.css` | `src/global.css` (replaces the template's version) | 2 (CSS vars, light + dark) |
| `tailwind.config.js` | `tailwind.config.js` (root) | 2 (classes) |
| `src/theme/tokens.ts` | `src/theme/tokens.ts` | 2 (JS values, categories, palette, type, spacing, radii, sizes, shadows) |
| `src/components/{MiniPlayer,TabBar,Skeleton,Search}/tokens.ts` | same paths under `src/components/` | 3 |

- Change the relative imports in component tokens (`../../theme/tokens`) to `@/theme/tokens`, to match the project's import style.
- Don't edit any values. The docs are the source of truth for every hex value and every class.
- **One planned change to `tokens.ts`:** replace the fixed `topicCategory` map and `catForItem` with the rotation rule (`catForTopic`, decided 11 Nov 2026; see Stage 3 §2.3). Keep `catAt`, `catClasses` and `catFgColorKey` as they are. Note the change in `src/theme/README.md` and in DESIGN-SYSTEM §5.1.
- One known exception to "no hex in components" stays, because the docs chose it: `miniPlayer.errorFg = 'text-[#E6BCA9]'` (DESIGN-SYSTEM §5.3, §6). Leave the explanatory comment in place. The check script (§5) allowlists `tokens.ts` files only, so this can't spread.

## 3. Wire the theme into the app

- `src/app/_layout.tsx`:
  - `import '@/global.css'` as the first import.
  - Build the React Navigation theme from `useThemeColors()`: `background: bg`, `card: bg`, `text: fg`, `border` from `borderAlpha`, `primary: primary`, `notification: danger`. This means stack transitions and the area behind screens never flash white or black.
  - `<StatusBar style="auto" />` from `expo-status-bar`.
- Set the root view's background to the theme, so there is no flash between the splash and the first screen. Use `expo-system-ui`'s `SystemUI.setBackgroundColorAsync(colors.bg)` when the colour scheme changes. Check first that the SDK 58 docs still offer this API.
- **Replace the starter theme:**
  - Delete `src/constants/theme.ts`, `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme*.ts`, `src/components/themed-text.tsx` and `themed-view.tsx`.
  - Move the Stage 1 placeholder screens to `<View className="flex-1 bg-bg">` and the new `Text` component.
  - Use only NativeWind's `useColorScheme`, through `useThemeColors()`. Don't use React Native's, so the classes and the JS colours always agree (tokens.ts header comment).
- Update the Stage 1 `TabBar` placeholder to use semantic classes, as a first real use of the tokens. The full styling comes in Stage 3 (Components).

## 4. Fonts and typography

- `npx expo install @expo-google-fonts/manrope expo-font` (expo-font is already present; the command keeps versions aligned).
- In the root layout, use `useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold })`. Return `null` and keep the splash showing until the fonts have loaded *or* failed. Then call `SplashScreen.hideAsync()`. If loading fails, log the error and keep going with system fonts. Don't swallow the error silently.
- The family names must match `tailwind.config.js` `fontFamily` and `tokens.ts` `font` exactly (`Manrope_500Medium`, …).
- **`Text` component** (`src/components/ui/text.tsx`): one `variant` prop sets size, line height, tracking and the font file, so screens don't hand-assemble `font-manrope-extrabold text-h1` each time.
  - Variants come from the type scale in DESIGN-SYSTEM §10 / `tokens.ts` `type`: `display`, `h1`, `h2`, `section`, `headingSm`, `title`, `body`, `bodySm`, `meta`, `caption`, `label`, `overline`.
  - Each variant is written out in one plain object, `variant → className` (for example `h1: 'font-manrope-extrabold text-h1'`, `overline: 'font-manrope-bold text-overline uppercase'`).
  - The default colour is `text-fg`. A `className` prop is appended last, so a caller can override the colour or weight (`text-fg-muted`, `text-primary`).
  - An optional `tabular` boolean adds `fontVariant: ['tabular-nums']`, for all time values (HANDOFF §1).
  - Never use `allowFontScaling={false}` (AGENTS.md). The component passes through `numberOfLines` and `maxFontSizeMultiplier`.
- Add no other UI primitives in this stage. Chips, IconButton and HeroCard are built with the screens that first need them, following the recipes in DESIGN-SYSTEM §12.

## 5. Keep the system clean as it grows

### 5.1 Theme check script: `scripts/check-theme.js` (`npm run check:theme`)

A plain Node script with no new dependencies. Each check is a separate, clearly named function. It reports every problem it finds, then exits with code 1 if there were any.
1. **Parity:**
   - every `--color-*` variable in `src/global.css` `:root` also exists in the dark block, and the reverse;
   - every variable has a `colors` entry in `tailwind.config.js`;
   - every variable has a camelCase key in `tokens.ts` `lightColors` **and** `darkColors`, with the same RGB value.
   - Parse with simple regexes. The files have a fixed, one-token-per-line format; document that format at the top of the script.
2. **No primitives in Tailwind:** no colour key in `tailwind.config.js` matches a ramp name from `primitives.ts` (`sand-`, `olive-`, …).
3. **No raw colours in UI code:** fail on `#rgb`/`#rrggbb`/`rgb(`/`rgba(` in `src/app/**` and `src/components/**`. Allowed exceptions: `src/components/*/tokens.ts` and `src/components/artwork/**`, since artwork uses `palette` from tokens.ts and needs no raw hex either.
4. **Category literals:** `catClasses` in tokens.ts has `bg`/`fg` entries for exactly the categories defined in `global.css`.

Run it in the definition of done for every later stage. Add it to AGENTS.md "Commands".

### 5.2 Agent guide: `src/theme/README.md`

It sits next to the code, so agents editing the theme find it. AGENTS.md links to it from a new "Design system" section. It is short and procedural, and it links to DESIGN-SYSTEM.md rather than repeating it:
- **The three tiers and the one rule:** each tier points only at the tier below. Screens use semantic classes only.
- **Which file holds what** (the table in DESIGN-SYSTEM §0), and which to open for which job.
- **Recipes, each as a numbered checklist of files to touch in order:**
  1. *Use an existing colour*: the four-step choice in DESIGN-SYSTEM §7.
  2. *Add a primitive*: add a step to its ramp in `primitives.ts`. Nothing else changes.
  3. *A component-only colour*: add it to `src/components/<Name>/tokens.ts`, pointing at a semantic token. Point at a primitive only when no role fits, and add a comment saying so (the `miniPlayer.errorFg` pattern).
  4. *Add a semantic role*:
     - name it by role (§1 naming rules, the `X` / `X-fg` / `X-fg-muted` pairs);
     - add the light and dark values in `global.css`, the class in `tailwind.config.js`, and the value in `tokens.ts` `lightColors`/`darkColors`;
     - check contrast (§8 floors) and add the pair to the §8 table;
     - update `html/design-system.html`;
     - run `npm run check:theme`.
  5. *Promote a component token* when a second component needs it: recipe 4, then point both components' tokens at the new role.
  6. *Add a category (cat-6)*:
     - add the CSS vars and Tailwind classes;
     - add it to the `Category` type, `catClasses`, `catFgColorKey` and `catAt`'s modulo in tokens.ts;
     - widen the safelist regex.
     - Never reuse `danger` for it.
  7. *Add a theme beyond light/dark* (for example high contrast, or an in-app switch):
     - change `darkMode` to `'class'` (DESIGN-SYSTEM §14);
     - give each extra theme a full set of every `--color-*` variable, applied at the root through NativeWind's `vars()`;
     - add a matching `xxxColors` object in tokens.ts and branch `useThemeColors()`/`useThemeShadows()` on it.
     - Check the current NativeWind docs for `vars()` before starting.
- **Don'ts:** the DESIGN-SYSTEM §9 table. Also: no new `rgba(…)` lines (use `border`/`border-strong`), no primitives in classes, and no picking a token because its hex happens to match.

### 5.3 Token preview route (development only)

Add `src/app/dev/tokens.tsx`. It renders every semantic swatch, category pair, type variant, radius and shadow in the current theme. It is the in-app version of `html/design-system.html`. Guard it so production builds don't reach it: when `!__DEV__`, redirect to `/`. Link to it only from the Home placeholder. It is how you visually check a new token in both themes.

## 6. Files touched

- New: `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `nativewind-env.d.ts`, `src/theme/primitives.ts`, `src/theme/tokens.ts`, `src/theme/README.md`, `src/components/{MiniPlayer,TabBar,Skeleton,Search}/tokens.ts`, `src/components/ui/text.tsx`, `src/app/dev/tokens.tsx`, `scripts/check-theme.js`
- Replaced: `src/global.css`
- Edited: `src/app/_layout.tsx` (CSS import, fonts, splash, navigation theme, status bar), the Stage 1 placeholder screens, `src/components/TabBar/index.tsx`, `package.json` (dependencies, `check:theme` script), `AGENTS.md` ("Design system" section with a link to `src/theme/README.md`, plus the new command)
- Deleted: `src/constants/theme.ts`, `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme.ts`, `use-color-scheme.web.ts`, `src/components/themed-text.tsx`, `themed-view.tsx`

## 7. Verification

1. `npx expo lint`, `npx tsc --noEmit` and `npm run check:theme` all pass. `npx expo-doctor` shows no new problems.
2. Break things on purpose to test the check script, then revert:
   - remove a dark variable and confirm the script fails;
   - put `#fff` in a screen and confirm the script fails.
3. iOS simulator, light and dark (Settings → Developer → Dark Appearance, or `xcrun simctl ui booted appearance dark`). On `/dev/tokens`, check:
   - every swatch matches `artboards/design-system.png`;
   - Manrope renders in all five weights, not the system font;
   - opacity modifiers render (`bg-emphasis-fg/[0.12]`);
   - `miniPlayer.bg` switches between inverse and emphasis;
   - shadows show in light and disappear in dark.
4. Web build, checked with `playwright-cli`: screenshots of `/dev/tokens` with `colorScheme: 'light'` and `'dark'`, compared with `html/design-system.html`.
5. Switch the theme while the app is open. Classes, icon colours from `useThemeColors()`, the status bar and the navigation background all change together. No white flash when pushing to Search or opening Player.
6. Font scaling: at the largest Dynamic Type size, the `Text` variants still scale and nothing gets clipped on the preview screen.
