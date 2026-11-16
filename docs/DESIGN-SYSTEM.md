# Ulama Moris: Design System (NativeWind)

Colours live in **three tiers**, and each tier may only point at the one below it. Screens use **semantic tokens only**, as NativeWind classes that switch with the phone's appearance setting. Every semantic token has a light and a dark value. Never write a hex value in a screen.

| Tier | What it holds | Where it lives | Used by |
|---|---|---|---|
| 1. Primitives | Raw hex values in hue ramps, no meaning (`ochre-400`) | `src/theme/primitives.ts` | Semantic and component tokens only |
| 2. Semantic | Roles mapped per theme to primitives (`secondary` → `ochre-400`) | `src/global.css`, `tailwind.config.js`, `src/theme/tokens.ts` | Screens and components |
| 3. Component | Per-component hooks onto semantic tokens (`miniPlayer.progress` → `secondary`) | `src/components/<Name>/tokens.ts` | That one component |

| File | Role |
|---|---|
| `src/theme/primitives.ts` | Tier 1: the 35 raw colours in eight ramps |
| `src/global.css` | Tier 2 as CSS variables (`:root` = light, `@media (prefers-color-scheme: dark)` = dark) |
| `tailwind.config.js` (project root) | Maps the semantic tokens to classes (`bg-surface-1`, `text-fg-muted`, `bg-cat-4-bg`, `border-border-strong` …), plus fonts, type scale, radii, spacing |
| `src/theme/tokens.ts` | The same semantic colours in JS (`useThemeColors()`) for places classes can't reach (SVG fills, icon colours, StatusBar, navigation theme, animations), the category helpers (`catAt`, `catForTopic`, `catClasses`), the offline `scrim`, the artwork `palette`, shadows (`useThemeShadows()`), type, spacing, radii, sizes |
| `src/components/<Name>/tokens.ts` | Tier 3: component tokens for MiniPlayer, TabBar, Skeleton and Search |
| `artboards/design-system.png` | The colour board: light and dark semantic tokens, categories, sample components, primitives and component tokens. In the app, `/dev/tokens` shows the live tokens |

## 1. Naming rules

- A fill token `X` pairs with **`X-fg`** for text and icons on it, and `X-fg-muted` for secondary text on it. (`fg` = foreground; the old `on-` prefix is gone.)
- Names describe a **role, never a component**: `emphasis`, not `hero`; `secondary`, not `cta`.
- Same value **and** same role = one token. Different roles that happen to share a value stay separate tokens pointing at the same primitive (e.g. `emphasis` and `primary-subtle-fg` are both `olive-800` in light).
- **Only semantic tokens** are Tailwind classes. Primitives and component tokens never enter the Tailwind palette.
- Kebab-case in CSS and classes (`surface-1`, `primary-subtle-fg` → `bg-surface-1`, `text-primary-subtle-fg`); camelCase in JS (`surface1`, `primarySubtleFg`).

## 2. Palette and artwork

Brand colours (from the brief): olive `#66734C`, ivory `#F1EBDD`, charcoal `#292D25`, ochre `#C6A75D`, sage `#A9B49A`, terracotta `#B8755C`.
Added during design: olive-deep `#56613F` (olive darkened so small text passes 4.5:1 on ivory; now `olive-600`, the light `primary`) and forest `#3B4330` (now `olive-800`, `emphasis`).

**Artwork uses a fixed illustration palette** (`palette` in tokens.ts) and looks the same in light and dark; it always sits on forest. It sits outside the three UI tiers:
- olive `#66734C` and leaf `#7C8A5D` (rosette leaves), leaf-light `#BCC5AB` (inner leaves of the Now Playing artwork), ochre (rosette sun, logo crescent), terracotta (rosette centre only).
- Never reuse an artwork green as a UI colour. In the UI, olive is `primary` (`olive-600`).
- `palette` is for `react-native-svg` fills only; it is not a Tailwind class.

The offline pop-up's scrim is the one non-artwork fixed colour: `scrim` in tokens.ts (charcoal-900 at 62%, both themes; ERROR-STATES.md).

## 3. How the dark theme was derived

The Now Playing dark screen defines the core dark values directly:

| Now Playing (dark) | Value | Becomes token |
|---|---|---|
| Screen background | `#292D25` (charcoal-900) | `bg` |
| Title / icons | `#F1EBDD` (sand-50) | `fg` |
| Secondary text | `#BDC0AE` (stone-300) | `fg-muted` |
| Round buttons (skip 15) | `#363B30` (charcoal-700) | `surface-2` |
| Progress track | `#555C49` (stone-700) | `track` |
| Accent (play button, fill, scholar name) | `#A9B49A` (olive-300) | `primary` |
| Icon on accent | `#292D25` | `primary-fg` |

The rest of the app follows the same logic:
- **Light and dark swap grounds:** ivory ↔ charcoal for background and text.
- **Olive becomes sage in dark,** because olive on charcoal is too dark to see. `primary` is `olive-600` in light and `olive-300` in dark, with charcoal on top.
- **Surfaces climb in dark:** `bg` `#292D25` → `surface-1` `#30352B` → `surface-2` `#363B30`, each a step lighter than the ground. In light they step darker than ivory.
- **Emphasis cards stay forest** `#3B4330` in both themes; on charcoal they read as a slightly raised card. The ochre `secondary` stays the same (it sits on forest either way).
- **Mini player:** `inverse` (charcoal) in light, `emphasis` (forest) in dark, because charcoal would vanish on the charcoal ground. This per-theme switch is why it has component tokens (§6).
- **Categories:** the light pastels are mixed down into charcoal and their foregrounds lightened, so each keeps its hue in both themes.

## 4. Tier 1: primitives (35)

| Ramp | Steps (lower = lighter) |
|---|---|
| `sand` | 50 `#F1EBDD` · 100 `#EAE3D3` · 200 `#E4DCC9` |
| `charcoal` | 700 `#363B30` · 800 `#30352B` · 900 `#292D25` |
| `stone` | 200 `#D5D9C9` · 300 `#BDC0AE` · 600 `#5A5F52` · 700 `#555C49` |
| `olive` | 100 `#DDE2D3` · 200 `#C9D1BA` · 300 `#A9B49A` · 600 `#56613F` · 800 `#3B4330` · 850 `#3A4334` |
| `ochre` | 100 `#EFE2BF` · 200 `#E3CF9A` · 400 `#C6A75D` · 600 `#725B2A` · 700 `#5E5130` · 900 `#4A4330` |
| `clay` | 100 `#EBD3C8` · 200 `#E6BCA9` · 500 `#B8755C` · 700 `#5E4034` · 900 `#4A3831` |
| `teal` | 100 `#D3E0DC` · 200 `#B7D3CC` · 700 `#2F4A45` · 900 `#2F403C` |
| `plum` | 100 `#E5D6DD` · 200 `#DDC2CE` · 700 `#4F3A45` · 900 `#44363D` |

`ochre-600` is new (readable ochre on light surfaces); `clay-500` was already on screens and is now formalised.

## 5. Tier 2: semantic tokens

| Token (class suffix) | Light | Dark | Use |
|---|---|---|---|
| `bg` | sand-50 `#F1EBDD` | charcoal-900 `#292D25` | App/screen background |
| `surface-1` | sand-100 `#EAE3D3` | charcoal-800 `#30352B` | Lowest raised surface: list rows, recent-search card, search result rows, empty states, error cards' ground |
| `surface-2` | sand-200 `#E4DCC9` | charcoal-700 `#363B30` | Higher surface: chips, search field, round icon buttons, skip-15 buttons, active row, skeleton bars |
| `fg` | charcoal-900 `#292D25` | sand-50 `#F1EBDD` | Primary text and icons |
| `fg-muted` | stone-600 `#5A5F52` | stone-300 `#BDC0AE` | Secondary text, meta lines, inactive tab |
| `primary` | olive-600 `#56613F` | olive-300 `#A9B49A` | Main action and brand text: selected chip, active row play button, active number tile, scholar names, links, Now Playing progress fill, slider thumb and play button |
| `primary-fg` | sand-50 `#F1EBDD` | charcoal-900 `#292D25` | Text/icons on primary |
| `primary-subtle` | olive-100 `#DDE2D3` | olive-850 `#3A4334` | Soft selected state (active tab pill) |
| `primary-subtle-fg` | olive-800 `#3B4330` | olive-200 `#C9D1BA` | Text/icons on primary-subtle |
| `secondary` | ochre-400 `#C6A75D` | ochre-400 `#C6A75D` | Ochre fills: the one primary action on emphasis cards (play / arrow), ochre progress on emphasis cards and the mini player |
| `secondary-fg` | charcoal-900 `#292D25` | charcoal-900 `#292D25` | Text/icons on secondary |
| `secondary-strong` | ochre-600 `#725B2A` | ochre-400 `#C6A75D` | Ochre text, icons or thin lines on bg/surfaces |
| `secondary-subtle` | ochre-100 `#EFE2BF` | ochre-900 `#4A4330` | Soft ochre background (search highlight, badges) |
| `secondary-subtle-fg` | ochre-700 `#5E5130` | ochre-200 `#E3CF9A` | Text on secondary-subtle |
| `emphasis` | olive-800 `#3B4330` | olive-800 `#3B4330` | Emphasis cards (Continue listening, Latest event, Event hero), mini-player thumb |
| `emphasis-fg` | sand-50 `#F1EBDD` | sand-50 `#F1EBDD` | Text/icons on emphasis |
| `emphasis-fg-muted` | stone-200 `#D5D9C9` | stone-200 `#D5D9C9` | Secondary text on emphasis (and on the mini player) |
| `inverse` | charcoal-900 `#292D25` | sand-50 `#F1EBDD` | Inverse surface (light-mode mini player) |
| `inverse-fg` | sand-50 `#F1EBDD` | charcoal-900 `#292D25` | Text/icons on inverse |
| `track` | olive-300 `#A9B49A` | stone-700 `#555C49` | Unfilled progress track |
| `danger` | clay-500 `#B8755C` | clay-500 `#B8755C` | Error lines, strokes, icons |
| `danger-subtle` | clay-100 `#EBD3C8` | clay-900 `#4A3831` | Error rows, cards and icon circles |
| `danger-subtle-fg` | clay-700 `#5E4034` | clay-200 `#E6BCA9` | Text/icons on danger-subtle |
| `border` | `fg` at 10% | `fg` at 10% | Hairlines, dividers |
| `border-strong` | `fg` at 20% | `fg` at 20% | Outlines (event link pill), spinner ring |

### 5.1 Categories (5)

Five colours named by number, from five hues: **cat-1 sage → cat-2 ochre → cat-3 clay → cat-4 teal → cat-5 plum**, then repeat. All five are muted to the same depth, so the set reads as one family.

| Category | bg (light / dark) | fg (light / dark) |
|---|---|---|
| `cat-1` | olive-100 `#DDE2D3` / olive-850 `#3A4334` | olive-800 `#3B4330` / olive-200 `#C9D1BA` |
| `cat-2` | ochre-100 `#EFE2BF` / ochre-900 `#4A4330` | ochre-700 `#5E5130` / ochre-200 `#E3CF9A` |
| `cat-3` | clay-100 `#EBD3C8` / clay-900 `#4A3831` | clay-700 `#5E4034` / clay-200 `#E6BCA9` |
| `cat-4` | teal-100 `#D3E0DC` / teal-900 `#2F403C` | teal-700 `#2F4A45` / teal-200 `#B7D3CC` |
| `cat-5` | plum-100 `#E5D6DD` / plum-900 `#44363D` | plum-700 `#4F3A45` / plum-200 `#DDC2CE` |

- Use them to tell list items and topics apart: event date tiles, search result tiles, "Popular topics" chips, the Now Playing topic tag. **Never to signal state.** `cat-3` and `danger` share clay primitives but are separate tokens, so recolouring the cycle never changes error states.
- **Which category (decided 11 Nov 2026): rotation.** Category colours carry no meaning, so they rotate cat-1 → cat-2 → … → cat-5 → cat-1. There is no fixed topic → colour map (the old `topicCategory` map and `catForItem` were removed). Not `Math.random()`: a random colour would change on every render and launch.
  - **By position:** `catAt(index)` → `cat-[(index % 5) + 1]`.
  - **By topic:** `catForTopic(topic)` works the colour out from the topic's letters (case ignored), because topics are free text from the API with no fixed list. So a topic keeps its colour on every screen. An empty topic is `cat-1`.
  - By topic: search result tiles (lectures), the Now Playing topic tag.
  - By position: event date tiles (Events list, events-scope search results).
  - Fixed `cat-1`: the Events count chip and the Event detail number tiles.
- Background: `bg-cat-N-bg`; its text or icon: `text-cat-N-fg` (icons take `colors[catFgColorKey[N]]` from `useThemeColors()`). Always pair a `cat-N-bg` with its own `cat-N-fg`.
- Tailwind only keeps class names it can see written out, so use the literal map in `tokens.ts` (the config also safelists the pattern as a backup):

```tsx
import { catAt, catClasses } from '@/theme/tokens';

const cat = catClasses[catAt(index)];

<View className={`w-[60px] h-16 rounded-thumb items-center justify-center ${cat.bg}`}>
  <Text className={`font-manrope-extrabold text-[22px] ${cat.fg}`}>24</Text>
</View>
```

### 5.2 Secondary (ochre) rules

Ochre `#C6A75D` is only 1.9:1 on `bg`, so:

| Need | Token |
|---|---|
| Ochre button, play button, progress fill | `secondary` |
| Icon or label on an ochre fill | `secondary-fg` |
| Ochre text, icon or thin line on `bg` / a surface | `secondary-strong` |
| Soft ochre background (search highlight) | `secondary-subtle` + `secondary-subtle-fg` |

### 5.3 Error colours

There is no red. Errors use the **clay** `danger` family, so they stay calm and match the rest of the app.

| Where the error sits | Background | Text / icon | Example |
|---|---|---|---|
| On a light or dark screen ground (cards, rows, footers, icon circles) | `bg-danger-subtle` | `text-danger-subtle-fg` | "Lectures didn’t load" card, Now Playing alert row |
| Lines and icons on a screen ground | – | `danger` | Error strokes |
| On the mini player | `miniPlayer.bg` (unchanged) | `miniPlayer.errorFg` | "Didn’t load. Tap retry."; the 3px progress line becomes `miniPlayer.errorLine` (`danger`) |
| Behind a blocking pop-up | `scrim` (charcoal-900 at 62%, same in both themes) | – | Offline pop-up |

Why the mini player has its own error text token: `danger-subtle-fg` is dark brown in light mode, unreadable on the charcoal bar. `miniPlayer.errorFg` uses light clay (`clay-200` `#E6BCA9`) in **both** themes; no semantic role fits yet, so it points at the primitive.

There is no warning colour. Nothing in the designs needs one yet; add it only when a warning state is designed.

## 6. Tier 3: component tokens

Defined next to the component, pointing at semantic tokens (a primitive only when no role fits, with a comment). Create one only when the per-theme mapping differs from a single semantic token, or a stable hook is useful. When a second component needs the same value, promote it to a semantic token.

| Component | File | Token → value |
|---|---|---|
| Mini player | `src/components/MiniPlayer/tokens.ts` | `bg` → `inverse` (light) / `emphasis` (dark); `outline` → 1px `border` in dark only; `thumbBg` → `emphasis`; `fg` → `inverse-fg` / `emphasis-fg`; `fgMuted` → `emphasis-fg-muted`; `progress` → `secondary`; `errorLine` → `danger`; `retryBg` → `emphasis-fg` at 12%; `errorFg` → `clay-200` (primitive; no role fits yet) |
| Tab bar | `src/components/TabBar/tokens.ts` | `activeBg` → `primary-subtle`; `activeFg` → `primary-subtle-fg`; `inactiveFg` → `fg-muted`; `divider` → top `border` |
| Skeleton | `src/components/Skeleton/tokens.ts` | `bg` → `surface-2`; `row` → `surface-1`; spinner ring → `fg` at `border-strong` alpha, arc → `primary` |
| Search | `src/components/Search/tokens.ts` | `highlight` → `secondary-subtle`; `highlightFg` → `secondary-subtle-fg` |

Everything else uses semantic tokens directly (the emphasis card is just `bg-emphasis`). The change log also defines `likeButton.active` (clay-500). The heart isn't in the app, so it isn't included; add it in the component folder if the like button returns.

## 7. Choosing and adding a colour

**Choosing:**
1. **Find the surface it sits on:** `bg`, `surface-1`, `surface-2`, `emphasis`, `inverse`, or a fill like `primary`.
2. **Colouring a fill? Pick its role:** main action `primary`; warm/listening action `secondary`; soft selected state `primary-subtle`; error `danger-subtle`.
3. **Colour content with the matching `-fg`:** on `primary` use `primary-fg`, on `emphasis` use `emphasis-fg`. On `bg` and surfaces use `fg` / `fg-muted` (or `primary` for brand text such as scholar names).
4. **Ochre text on a light surface?** `secondary-strong`, never `secondary`.
5. **Check both themes.** If a token fails in one theme, the role is wrong, not the value.

**Adding:**
1. **Add a primitive first**, in its ramp with a step number.
2. **One component needs it?** Use it through that component's tokens, with a comment that it points at a primitive.
3. **Second use? Promote it** to a semantic token named by role, with light and dark values and a contrast check (4.5:1 text, 3:1 icons/lines).
4. **Update** `primitives.ts`, `global.css`, `tailwind.config.js`, `tokens.ts` and the swatches in `src/app/dev/tokens.tsx`.

## 8. Contrast (WCAG)

| Pair | Light | Dark |
|---|---|---|
| `fg` on `bg` | 11.8 | 11.8 |
| `fg-muted` on `bg` | 5.5 | 7.6 |
| `fg-muted` on `surface-1` | 5.1 | 6.8 |
| `fg-muted` on `surface-2` | 4.8 | 6.2 |
| `primary` on `bg` | 5.6 | 6.5 |
| `primary` on `surface-1` | 5.2 | 5.8 |
| `primary-fg` on `primary` | 5.6 | 6.5 |
| `primary-subtle-fg` on `primary-subtle` | 7.8 | 6.6 |
| `secondary-fg` on `secondary` | 6.1 | 6.1 |
| `secondary-strong` on `bg` | 5.4 | 6.1 |
| `secondary-strong` on `surface-2` | 4.7 | 5.0 |
| `secondary-subtle-fg` on `secondary-subtle` | 6.0 | 6.4 |
| `emphasis-fg-muted` on `emphasis` | 7.2 | 7.2 |
| `inverse-fg` on `inverse` | 11.8 | 11.8 |
| `miniPlayer.fgMuted` on `miniPlayer.bg` | 9.8 | 7.2 |
| `miniPlayer.errorFg` on `miniPlayer.bg` | 8.1 | 6.0 |
| `danger-subtle-fg` on `danger-subtle` | 6.5 | 6.4 |
| `cat-1-fg` on `cat-1-bg` | 7.8 | 6.6 |
| `cat-2-fg` on `cat-2-bg` | 6.0 | 6.4 |
| `cat-3-fg` on `cat-3-bg` | 6.5 | 6.4 |
| `cat-4-fg` on `cat-4-bg` | 7.1 | 6.9 |
| `cat-5-fg` on `cat-5-bg` | 7.4 | 6.9 |

Floors: body text 4.5:1; large text (18 px+, or 14 px bold) 3:1; icons, progress lines, strokes 3:1; decorative fills that carry their own label: none. The progress `track` is low-contrast on purpose; the filled part and the thumb carry the position. Known gap: the mini-player error line (`danger` on the dark-mode `emphasis` bar) is about 2.8:1 (3.8:1 on the light-mode `inverse` bar); see §16.

## 9. Do and don't

| Do | Don't |
|---|---|
| `border` / `border-strong` for every divider and outline | Write a new `rgba(…)` for a line |
| `cat-N` only to tell items apart | Use `cat-3` (clay) to signal an error |
| Keep a topic on the same category colour everywhere | Let a topic change colour between screens |
| `danger` for error lines and icons | `danger` for positive states |
| Keep artwork colours (`palette`: `#7C8A5D`, `#BCC5AB`, `#66734C` …) inside illustrations | Reuse an artwork green as a UI colour |
| Pick tokens by role: if two look the same today, use the one whose name matches the job | Pick a token because its hex happens to match |

## 10. Typography, radii, spacing

- **Font:** Manrope (`@expo-google-fonts/manrope`). In React Native, custom fonts select a **file**, not a weight, so use `font-manrope` (Medium 500, the default body weight), `font-manrope-regular`, `font-manrope-semibold`, `font-manrope-bold`, `font-manrope-extrabold` (not `font-bold`).
- **Sizes:** `text-display` 32, `text-h1` 28, `text-h2` 22, `text-section` 20, `text-heading-sm` 16 (ExtraBold: brand name, "Recent searches", "Popular topics"), `text-title` / `text-body` 15, `text-body-sm` 14, `text-meta` 13, `text-caption` 12, `text-label` 12 (Bold, tracked: Events year headers), `text-overline` 11 (always Bold 700, uppercase, tracked: card overlines, "EVENT" pill).
- Sentence-case labels: the Now Playing "Playing from" line is `text-caption font-manrope-semibold text-fg-muted`; the search results heading ("3 lectures found") is `text-body-sm font-manrope-bold text-fg-muted`. Neither is uppercase.
- **Times:** tabular numbers, `style={{ fontVariant: ['tabular-nums'] }}`.
- **Tracking:** use the values in the type tokens. A few HTML headings differ by a fraction of a pixel (greeting −0.7 vs −0.6, Now Playing title −0.44 vs −0.3); the tokens win.
- **Radii:** `rounded-thumb-sm` 10 (mini player thumb; Tailwind's own `rounded-sm` is left at its default 2px), `rounded-tile` 14 (number tiles, search result tiles, "EVENT" pill), `rounded-thumb` 16 (date tiles), `rounded-mini` 20, `rounded-row` 22 (list rows, **including search result rows**), `rounded-card` 28, `rounded-full` for pills, tags and round buttons.
- **Spacing:** screen padding `px-gutter` (24); top bars and the tab bar `px-bar` (12), so 44px icon buttons line up optically with content at 24 (Home's header uses 20 left / 12 right); minimum touch target `h-touch w-touch` (44).
- **Hairlines:** always `border` (fg at 10%). As an edge of a container use `border-t border-border` (tab bar top edge, `tabBar.divider`); as a standalone divider use a `h-px bg-border` view (recent-search dividers). The mini player's dark-mode outline is the same token (`miniPlayer.outline`).
- **Outlines:** the Now Playing event link pill uses `border-[1.5px] border-border-strong`.

## 11. Shadows

Three shadows, all from the design files, applied with React Native's `boxShadow` style (it takes a CSS string, so the values match exactly):

| Name | Value (light) | Used on |
|---|---|---|
| `artwork` | `0px 28px 48px -26px rgba(41, 45, 37, 0.55)` | Now Playing artwork |
| `playButton` | `0px 14px 28px -16px rgba(41, 45, 37, 0.6)` | Now Playing play/pause button |
| `offlineSheet` | `0px 30px 60px -30px rgba(0, 0, 0, 0.6)` | Offline pop-up sheet (ERROR-STATES.md) |

**Dark mode has no shadows**: a dark shadow on the charcoal ground can't be seen. `useThemeShadows()` returns `undefined` in dark, so the same code works in both themes:

```tsx
const shadows = useThemeShadows();
<View style={{ boxShadow: shadows.artwork }} className="rounded-card overflow-hidden" />
```

## 12. Component recipes

```tsx
// Screen
<View className="flex-1 bg-bg" />

// Lecture row (Home): text block + play button
<Pressable className="flex-row items-center gap-3.5 pl-[18px] pr-3 py-3.5 rounded-row bg-surface-1 active:opacity-80">
  <View className="flex-1 gap-1">
    <Text numberOfLines={2} className="font-manrope-bold text-title text-fg">…</Text>
    <Text numberOfLines={1} className="font-manrope-semibold text-meta text-primary">Mufti Houzeifa Mamoojee</Text>
    <Text numberOfLines={1} className="font-manrope text-caption text-fg-muted">31 Oct · 36 min · Masjid Muswalla, Highlands</Text>
  </View>
  <Pressable accessibilityLabel="Play …" className="w-touch h-touch rounded-full bg-bg items-center justify-center" />
</Pressable>
// Active row: bg-surface-2; its play button bg-primary with a primary-fg icon.

// Filter chip
<Pressable className={`h-10 px-4 rounded-full justify-center ${isSelected ? 'bg-primary' : 'bg-surface-2'}`}>
  <Text className={`font-manrope-bold text-body-sm ${isSelected ? 'text-primary-fg' : 'text-fg'}`}>Local</Text>
</Pressable>

// Emphasis card: build ONE <HeroCard> component, used by Continue listening, Latest event
// and the Event hero. Only the rosette size/offset and the text's right padding differ:
//   Continue listening: rosetteSize 220, rosetteOffset { right: -70, top: -60 }, text pr-10
//   Latest event:       rosetteSize 220, rosetteOffset { right: -80, top: -70 }, text pr-12
//   Event hero:         rosetteSize 240, rosetteOffset { right: -90, top: -80 }, text pr-[30px]
<View className="rounded-card bg-emphasis p-[22px] gap-3.5 overflow-hidden">
  {/* rosette: absolutely positioned SVG, fixed palette colours */}
  <Text className="font-manrope-bold text-overline uppercase text-emphasis-fg-muted">Continue listening</Text>
  <Text className="font-manrope-extrabold text-section text-emphasis-fg">…</Text>
  <Pressable className="w-[52px] h-[52px] rounded-full bg-secondary items-center justify-center" />
</View>

// Chip on an emphasis card (lecture count, duration, venue, "EVENT" pill)
<View className="h-8 px-3 rounded-full bg-emphasis-fg/[0.12] flex-row items-center gap-1.5" />

// Ochre progress track on an emphasis card (Continue listening)
<View className="h-1 rounded-full bg-emphasis-fg/[0.18] overflow-hidden">
  <View className="h-1 rounded-full bg-secondary" style={{ width: `${percent}%` }} />
</View>

// Count chip ("11 events"): fixed cat-1
<View className="h-8 px-3 rounded-full bg-cat-1-bg flex-row items-center gap-1.5">
  <Text className="font-manrope-bold text-meta text-cat-1-fg">11 events</Text>
</View>

// Now Playing tags: topic pill (category by topic) + outlined event link
const topicCat = catClasses[catForTopic(lecture.category[0] ?? '')];
<View className="flex-row gap-2">
  <View className={`h-[34px] px-3 rounded-full justify-center ${topicCat.bg}`}>
    <Text className={`font-manrope-bold text-meta ${topicCat.fg}`}>Ṣaḥābā r.a</Text>
  </View>
  <Pressable
    accessibilityLabel="Open event: The Sahaba Radiyyallahu Anhum"
    className="h-[34px] pl-3 pr-2 rounded-full flex-row items-center gap-1.5 border-[1.5px] border-border-strong shrink"
  >
    {/* Layers icon, event name (numberOfLines={1}), ChevronRight */}
  </Pressable>
</View>

// Now Playing skip button (back 15 / forward 15)
<Pressable accessibilityLabel="Back 15 seconds" className="w-[60px] h-[60px] rounded-full bg-surface-2 items-center justify-center" />

// Search result row (tile coloured by category, chevron at the end)
import { search } from '@/components/Search/tokens';
<Pressable className="flex-row items-center gap-3.5 pl-2.5 pr-3 py-2.5 rounded-row bg-surface-1">
  <View className={`w-12 h-12 rounded-tile items-center justify-center ${cat.bg}`} />
  {/* title with <Text className={`${search.highlight} ${search.highlightFg}`}> around the match, scholar, meta */}
</Pressable>

// Mini player (component tokens): play/pause + forward 15, ochre progress line on the bottom edge.
import { miniPlayer } from '@/components/MiniPlayer/tokens';
<View className={`rounded-mini pl-2 pr-2 pt-2 pb-2.5 flex-row items-center overflow-hidden ${miniPlayer.bg} ${miniPlayer.outline}`}>
  <View className={`w-touch h-touch rounded-thumb-sm ${miniPlayer.thumbBg}`} />
  <Text className={`font-manrope-bold text-body-sm ${miniPlayer.fg}`}>…</Text>
  <Text className={`font-manrope-semibold text-caption ${failed ? miniPlayer.errorFg : miniPlayer.fgMuted}`}>…</Text>
  <View className={`absolute left-0 bottom-0 h-[3px] ${failed ? miniPlayer.errorLine : miniPlayer.progress}`} />
</View>

// Error row (Now Playing audio didn't load)
<View accessibilityRole="alert" className="rounded-[18px] px-3.5 py-3 flex-row gap-3 bg-danger-subtle">
  <Text className="font-manrope-extrabold text-body-sm text-danger-subtle-fg">This lecture didn’t load</Text>
</View>

// Dividers and outlines
<View className="h-px bg-border" />
<Pressable className="border-[1.5px] border-border-strong rounded-full" />
```

Icons (lucide-react-native and custom SVGs) take a `color` prop, not a class: `const colors = useThemeColors(); <Play color={colors.primaryFg} fill={colors.primaryFg} />`. NativeWind's `cssInterop` can also map `className` to `color` if you prefer.

## 13. The 15-second icons

Custom SVG (lucide has no "15" icon). 24 × 24 viewBox, stroke 2, round caps and joins.

- **Forward 15:** arc `M20 12a8 8 0 1 1-2.3-5.6` + arrow `M20 4v4h-4`.
- **Back 15:** the arc and arrow mirrored (`M4 12a8 8 0 1 0 2.3-5.6`, `M4 4v4h4`). The **digits are not mirrored**, so "15" still reads normally.
- **Digits** (stroke 1.8): "1" `M8.6 10.3l1.3-.9v5.6`; "5" `M15.5 9.4h-2.8l-.35 2.6c.35-.25.8-.4 1.3-.4a1.7 1.7 0 0 1 0 3.4c-.65 0-1.25-.3-1.55-.75` (top bar, stem down the left, rounded base).
- The "5" has a top bar, a stem down the left side and a rounded base, so it reads clearly as "15" at small sizes. Built in `src/components/icons/skip-15-icon.tsx`.
- Sizes: 26 in the Now Playing 60px buttons, 22 in the mini player.

## 14. NativeWind setup (v4)

**Decision: stay on the stable line, NativeWind 4.2.7 + Tailwind CSS 3.** Don't use the NativeWind v5 release candidate (and so not Tailwind CSS v4): v5 is marked "not intended for production use".

**Version check (7 Nov 2026):** the NativeWind docs list v4.2.7 as stable with support up to Expo SDK 57. This project is on **SDK 58**, which isn't listed yet. A test install of exactly the setup below on this project's dependencies (SDK 58, React Native 0.88.1, Reanimated 4.7.1, Worklets 0.13.0) installed with no peer conflicts, and `expo export` bundled iOS and Android cleanly. Every token class compiled, including opacity modifiers (`bg-emphasis-fg/[0.12]`) and dark variants. Not yet checked: rendering on a device or simulator. Run the app on iOS and Android once after setup, before building screens. Official guide: https://www.nativewind.dev/docs/getting-started/installation.

Steps for this project (it uses `package-lock.json`, so `npx`). **Already done:** they record how the app was set up. The handoff copies of the theme files mentioned in steps 2–3 have been removed; the app's own files are the source now.

1. `npx expo install nativewind@4.2.7` (pin it so a future v5 `latest` tag isn't picked up), then `npm i -D tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11` (resolves to Tailwind 3.4.19). Reanimated, Worklets and safe-area-context are already in package.json at SDK 58 versions; if you ever reinstall them, use `npx expo install`.
2. Copy `tailwind.config.js` to the project root. **Replace** the template's `src/global.css` with this package's `global.css`. (The template's font variables in it are only used by the starter's `src/constants/theme.ts`, which Manrope replaces.)
3. Copy `src/theme/primitives.ts` and `src/theme/tokens.ts` to `src/theme/`, and each `src/components/<Name>/tokens.ts` into the folder of the component it belongs to.
4. `babel.config.js`: `presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"]`.
5. `metro.config.js`: wrap the Expo config with `withNativeWind(config, { input: "./src/global.css" })`.
6. `import "@/global.css";` at the top of `src/app/_layout.tsx` (`@/` points at `src/`).
7. Add `nativewind-env.d.ts` with `/// <reference types="nativewind/types" />`.
8. `"userInterfaceStyle": "automatic"` is already set in `app.json`, so dark mode follows the system. The `dark:` variants in the component tokens follow it too (`darkMode: 'media'`).
9. Fonts: `npx expo install @expo-google-fonts/manrope expo-font` and load the five weights in `tokens.ts` → `font` before hiding the splash screen.

In-app theme switch later: change `darkMode` to `'class'` and use NativeWind's `useColorScheme().setColorScheme()`. Nothing else changes: `useThemeColors()` and `useThemeShadows()` in `tokens.ts` already read NativeWind's `useColorScheme` (not React Native's), so icons, shadows and classes always follow the same choice. When NativeWind v5 ships as stable, the same CSS variables move into `global.css` under Tailwind v4's `@theme`, and `tailwind.config.js` goes away.

## 15. The complete component set

Every interactive element in the app is listed below. Build these and only these; the token set above covers exactly them.

| Screen | Controls |
|---|---|
| Home | Search bar (button), Continue listening play/pause, series chips, lecture row play buttons |
| Events | Search button, Latest event card, event rows |
| Event detail | Back, share, lecture row play buttons |
| Now Playing | Close (chevron), event link pill, progress slider, back 15, play/pause, forward 15 |
| Search | Back, input, mic / clear, recent searches (run, remove, clear all), popular topic chips, result rows |
| Mini player + tabs | Open player (text area), play/pause, forward 15, Home tab, Events tab |

## 16. Open decisions

Carried over from the colour-system change log (since removed). None blocks the build; the values above are the current answer.

- Remove ochre from the category cycle? (It's also `secondary`, which dilutes the "act here" signal.)
- Merge `olive-850` into `olive-800`?
- Confirm the `ochre-600` hue (keep ≥ 4.5:1 on `surface-2`).
- Keep a separate dark search highlight if matches look faint? (`search.highlight` dropped from `#5A4E2E` to `#4A4330` in dark.)
- Lift `danger` for the dark mini player (2.8:1 for the error line)?
- ~~Category by topic or by position?~~ Decided 11 Nov 2026: rotation, by topic where an item has a topic, otherwise by list position (§5.1). 16 Nov 2026: the topic colour is worked out from the topic's letters, since API topics have no fixed list.
