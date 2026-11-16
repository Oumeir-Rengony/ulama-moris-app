# Theme: how to use and extend it

Short and procedural. The full reference is [docs/DESIGN-SYSTEM.md](../../docs/DESIGN-SYSTEM.md); this file tells you which files to touch, in which order.

## The three tiers and the one rule

| Tier | What | Where |
|---|---|---|
| 1. Primitives | Raw hex in hue ramps, no meaning (`ochre-400`) | `src/theme/primitives.ts` |
| 2. Semantic | Roles with a light and a dark value (`secondary` → `ochre-400`) | `src/global.css` (CSS vars), `tailwind.config.js` (classes), `src/theme/tokens.ts` (JS) |
| 3. Component | One component's hooks onto semantic tokens (`miniPlayer.progress` → `secondary`) | `src/components/<Name>/tokens.ts` |

**Each tier points only at the tier below it. Screens and components use semantic classes (and their own component tokens) only.** Never a primitive, never a hex.

## Which file to open

| Job | File |
|---|---|
| Style a view or text | Semantic classes: `bg-surface-1`, `text-fg-muted` … (list in `tailwind.config.js`) |
| A colour where a class can't reach (icon `color`, SVG fill, StatusBar, navigation, animation) | `useThemeColors()` in `tokens.ts` |
| Shadows | `useThemeShadows()` in `tokens.ts` (returns `undefined` in dark) |
| Category colours | `catAt(index)` (by position) / `catForTopic(topic)` (by topic) + `catClasses` in `tokens.ts` |
| Artwork (rosette, logo badge) | `palette` in `tokens.ts`. Fixed, the same in both themes, never a UI colour |
| Text | `<Text variant="…">` from `@/components/ui/text` (type scale in DESIGN-SYSTEM §10) |
| Navigation theme | `useNavigationTheme()` in `navigation-theme.ts` (built from the semantic tokens) |
| See every token in light and dark | `/dev/tokens` route (development builds only) |

Run `npm run check:theme` after any change here. It checks that `global.css`, `tailwind.config.js` and `tokens.ts` agree, and that no raw colour leaked into `src/app` or `src/components`.

The check parses the theme files with simple regexes, so keep their format: **one token per line** (see the header of `scripts/check-theme.js`).

## Recipes

### 1. Use an existing colour (DESIGN-SYSTEM §7)
1. Find the surface it sits on: `bg`, `surface-1`, `surface-2`, `emphasis`, `inverse`, or a fill like `primary`.
2. Colouring a fill? Pick its role: main action `primary`, warm action `secondary`, soft selected `primary-subtle`, error `danger-subtle`.
3. Colour content with the matching `-fg` (`primary-fg` on `primary`). On `bg` and surfaces use `fg` / `fg-muted`, or `primary` for brand text.
4. Ochre text on a light surface? `secondary-strong`, never `secondary`.

Check both themes. If a token fails in one theme, the role is wrong, not the value.

### 2. Add a primitive
1. Add a step to its ramp in `primitives.ts` (lower number = lighter).

Nothing else changes. A primitive does nothing until a semantic or component token points at it.

### 3. A colour only one component needs
1. Add it to `src/components/<Name>/tokens.ts`, pointing at a semantic token.
2. Point at a primitive only when no role fits, and add a comment saying so (see `miniPlayer.errorFg`).

### 4. Add a semantic role
1. Name it by role, not by component (`emphasis`, not `hero`). Use the pairs `X` / `X-fg` / `X-fg-muted` (DESIGN-SYSTEM §1).
2. `src/global.css`: add the light value in `:root` and the dark value in the `prefers-color-scheme: dark` block, as RGB channels with the primitive in a comment.
3. `tailwind.config.js`: add `'name': c('name')` to `colors`.
4. `src/theme/tokens.ts`: add the camelCase key to `lightColors` **and** `darkColors`, pointing at the same primitives.
5. Check contrast against DESIGN-SYSTEM §8 floors (4.5:1 text, 3:1 icons and lines) and add the pair to the §8 table.
6. Add a swatch to `src/app/dev/tokens.tsx`.
7. Run `npm run check:theme`.

### 5. Promote a component token
When a second component needs a component-only colour: do recipe 4 for a new role, then point both components' `tokens.ts` at it.

### 6. Add a category (cat-6)
1. `global.css`: add `--color-cat-6-bg` and `--color-cat-6-fg`, light and dark.
2. `tailwind.config.js`: add the two classes, and widen the safelist regex (`[1-5]` → `[1-6]`).
3. `tokens.ts`: add the keys to `lightColors` / `darkColors`, add `6` to the `Category` type, `catClasses` and `catFgColorKey`, and change `categoryCount` (used by `catAt` and `catForTopic`).
4. Never reuse `danger` for it. Categories tell items apart; they never signal state.
5. Run `npm run check:theme`.

### 7. Add a theme beyond light/dark (high contrast, or an in-app switch)
Check the current NativeWind docs for `vars()` before starting.
1. `tailwind.config.js`: change `darkMode` to `'class'` (DESIGN-SYSTEM §14). Also update the flag in `src/app/+html.tsx`, which must match it.
2. Give each extra theme a full set of every `--color-*` variable, applied at the root through NativeWind's `vars()`.
3. Add a matching `xxxColors` object in `tokens.ts`, and branch `useThemeColors()` / `useThemeShadows()` on it.
4. Extend `scripts/check-theme.js` so the new theme is checked for parity too.

## Category colours: rotation, not a fixed map

Decided 11 Nov 2026 (this replaced the old `topicCategory` map and `catForItem`):
- Colours rotate cat-1 → … → cat-5 → cat-1. Not `Math.random()`, which would flicker between renders and launches.
- **By position** (event date tiles, search result tiles): `catAt(index)`.
- **By topic** (Now Playing topic pill, lecture search tiles): `catForTopic(topic)`. Topics are free text from the API, so the colour is worked out from the topic's letters (case ignored): a topic keeps its colour on every screen. An empty topic gets cat-1.
- `catForTopic` takes the list as an argument so the theme doesn't import from `src/data/`.

## Don'ts

| Do | Don't |
|---|---|
| `border` / `border-strong` for every divider and outline | Write a new `rgba(…)` for a line |
| `cat-N` only to tell items apart | Use `cat-3` (clay) to signal an error |
| Keep a topic on the same category colour everywhere | Let a topic change colour between screens |
| `danger` for error lines and icons | `danger` for positive states |
| Keep artwork colours (`palette`) inside illustrations | Reuse an artwork green as a UI colour |
| Pick tokens by role | Pick a token because its hex happens to match |
| Semantic classes in screens | Primitives in classes (`bg-sand-50`): they are not Tailwind colours on purpose |
| Override colour or weight through `<Text className>` | Hand-assemble `font-manrope-extrabold text-h1` in every screen |
