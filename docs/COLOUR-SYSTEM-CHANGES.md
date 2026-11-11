# Colour System Changes

Nov 9, 2026 · @oumeir

## Summary

The colour system moves from 34 flat tokens to three tiers: 35 primitives, 25 semantic role tokens plus 10 category tokens, and 5 scoped component groups. The count stays similar, but every name now has one role and one source value. The final board lives in `html/design-system.html` (image: `artboards/design-system.png`); this doc explains every change and how to use the system.

| Change | Count | Effect |
| --- | --- | --- |
| Exact duplicates removed | 3 | `brand`, `on-accent`, `on-player` folded into their twins |
| Accidental near-duplicates unified | 4 | `accent`, `on-player-muted`, `tab-active`, `highlight` take one value each |
| Surface ladder shortened | 5 → 3 levels | `sheet` and `skeleton` removed |
| Component names replaced by roles | 6 | `hero`, `player`, `cta`, `tab-active`, error clay, borders |
| Secondary (ochre) built out | 5 tokens | Fill, text-on-fill, strong text, subtle fill, text-on-subtle |
| `on-` prefix replaced | all pairs | `on-primary` becomes `primary-fg` (fg = foreground) |
| New colour | 1 | `ochre-600` #725B2A, readable ochre on light surfaces |
| Colours found on screens but missing from the old sheet | 2 | `clay-500` #B8755C formalised as `danger`; spinner grey #D5CDB8 replaced by `border-strong` |
| Bugs fixed on screens | 2 | Search tiles now pair each `cat-N-bg` with its own `cat-N-fg`; hairlines unified at 10% |

## Naming and structure rules

Colours live in three tiers, and each tier may only point at the one below it.

| Tier | What it holds | Example | Used by |
| --- | --- | --- | --- |
| 1. Primitives | Raw hex values in hue ramps, no meaning | `ochre-400` = #C6A75D | Semantic tokens only |
| 2. Semantic | Roles, mapped per theme to primitives | `secondary` → `ochre-400` | Screens and components |
| 3. Component | Per-component hooks, mapped to semantic tokens | `miniPlayer.progress` → `secondary` | That one component |

Naming rules:

- A fill token `X` pairs with `X-fg` for text and icons on top of it, and `X-fg-muted` for secondary text. **fg** means foreground.
- Names describe a role, never a component. `hero` becomes `emphasis`; `cta` becomes `secondary`.
- Two tokens with the same value and the same role are one token. Two roles that happen to share a value stay separate and point at the same primitive.
- Only semantic tokens are exposed as Tailwind classes. Primitives and component tokens are not in the shared palette.

## Duplicates and near-duplicates

Seven old tokens are removed and three take a single shared value. Values shown are old → new; a dash means unchanged.

### Removed

| Removed token | Merged into | Light | Dark | Reason |
| --- | --- | --- | --- | --- |
| `brand` | `primary` | — | — | Identical in both themes |
| `on-accent` | `primary-fg` | — | — | Identical in both themes |
| `on-player` | `emphasis-fg` | — | — | Identical in both themes |
| `accent` | `primary` | #66734C → #56613F | — | Same role; equal in dark, so the light gap was accidental |
| `on-player-muted` | `emphasis-fg-muted` | #BDC0AE → #D5D9C9 | #C9CDBB → #D5D9C9 | Same role as `on-hero-muted` |
| `sheet` | `surface-1` | #E7E0CF → #EAE3D3 | #33382D → #30352B | Indistinguishable from `row`; used once |
| `skeleton` | `surface-2` via `skeleton.bg` | #E1D9C6 → #E4DCC9 | #3A4035 → #363B30 | Indistinguishable from `surface` |

### Unified values

| Old token | Now points at | Light | Dark |
| --- | --- | --- | --- |
| `tab-active` | `primary-subtle` | — | #3F4836 → #3A4334 |
| `on-tab-active` | `primary-subtle-fg` | — | #DDE2D3 → #C9D1BA |
| `highlight` | `secondary-subtle` | — | #5A4E2E → #4A4330 |

### Shared by coincidence, left separate

These roles share a hex value but mean different things, so they stay separate tokens on one primitive: `emphasis` and `primary-subtle-fg` (light, #3B4330); `emphasis` and dark `miniPlayer.bg`; `secondary-fg` and light `fg` (#292D25); light `track` and dark `primary` (#A9B49A).

## Tier 1: Primitives

Thirty-five raw colours in eight ramps; one is new (`ochre-600`) and one was already on the screens but missing from the old sheet (`clay-500`). Lower numbers are lighter. Components never use these directly.

| Ramp | Steps |
| --- | --- |
| sand | 50 #F1EBDD · 100 #EAE3D3 · 200 #E4DCC9 |
| charcoal | 700 #363B30 · 800 #30352B · 900 #292D25 |
| stone | 200 #D5D9C9 · 300 #BDC0AE · 600 #5A5F52 · 700 #555C49 |
| olive | 100 #DDE2D3 · 200 #C9D1BA · 300 #A9B49A · 600 #56613F · 800 #3B4330 · 850 #3A4334 |
| ochre | 100 #EFE2BF · 200 #E3CF9A · 400 #C6A75D · **600 #725B2A (new)** · 700 #5E5130 · 900 #4A4330 |
| clay | 100 #EBD3C8 · 200 #E6BCA9 · **500 #B8755C (added)** · 700 #5E4034 · 900 #4A3831 |
| teal | 100 #D3E0DC · 200 #B7D3CC · 700 #2F4A45 · 900 #2F403C |
| plum | 100 #E5D6DD · 200 #DDC2CE · 700 #4F3A45 · 900 #44363D |

`ochre-600` is a starting value chosen for contrast (about 5.4:1 on `sand-50`, 4.7:1 on `sand-200`); adjust its hue by eye if needed.

## Tier 2: Semantic tokens

These 35 tokens are the only colours screens use and the only ones exposed as Tailwind classes.

| Group | Token | Light | Dark |
| --- | --- | --- | --- |
| Base | `bg` | sand-50 #F1EBDD | charcoal-900 #292D25 |
| Base | `surface-1` | sand-100 #EAE3D3 | charcoal-800 #30352B |
| Base | `surface-2` | sand-200 #E4DCC9 | charcoal-700 #363B30 |
| Content | `fg` | charcoal-900 #292D25 | sand-50 #F1EBDD |
| Content | `fg-muted` | stone-600 #5A5F52 | stone-300 #BDC0AE |
| Content | `border` | `fg` at 10% | `fg` at 10% |
| Content | `border-strong` | `fg` at 20% | `fg` at 20% |
| Primary | `primary` | olive-600 #56613F | olive-300 #A9B49A |
| Primary | `primary-fg` | sand-50 #F1EBDD | charcoal-900 #292D25 |
| Primary | `primary-subtle` | olive-100 #DDE2D3 | olive-850 #3A4334 |
| Primary | `primary-subtle-fg` | olive-800 #3B4330 | olive-200 #C9D1BA |
| Secondary | `secondary` | ochre-400 #C6A75D | ochre-400 #C6A75D |
| Secondary | `secondary-fg` | charcoal-900 #292D25 | charcoal-900 #292D25 |
| Secondary | `secondary-strong` | ochre-600 #725B2A | ochre-400 #C6A75D |
| Secondary | `secondary-subtle` | ochre-100 #EFE2BF | ochre-900 #4A4330 |
| Secondary | `secondary-subtle-fg` | ochre-700 #5E5130 | ochre-200 #E3CF9A |
| Emphasis | `emphasis` | olive-800 #3B4330 | olive-800 #3B4330 |
| Emphasis | `emphasis-fg` | sand-50 #F1EBDD | sand-50 #F1EBDD |
| Emphasis | `emphasis-fg-muted` | stone-200 #D5D9C9 | stone-200 #D5D9C9 |
| Inverse | `inverse` | charcoal-900 #292D25 | sand-50 #F1EBDD |
| Inverse | `inverse-fg` | sand-50 #F1EBDD | charcoal-900 #292D25 |
| Controls | `track` | olive-300 #A9B49A | stone-700 #555C49 |
| Status | `danger` | clay-500 #B8755C | clay-500 #B8755C |
| Status | `danger-subtle` | clay-100 #EBD3C8 | clay-900 #4A3831 |
| Status | `danger-subtle-fg` | clay-700 #5E4034 | clay-200 #E6BCA9 |
| Category 1 | `cat-1-bg` / `cat-1-fg` | olive-100 / olive-800 | olive-850 / olive-200 |
| Category 2 | `cat-2-bg` / `cat-2-fg` | ochre-100 / ochre-700 | ochre-900 / ochre-200 |
| Category 3 | `cat-3-bg` / `cat-3-fg` | clay-100 / clay-700 | clay-900 / clay-200 |
| Category 4 | `cat-4-bg` / `cat-4-fg` | teal-100 / teal-700 | teal-900 / teal-200 |
| Category 5 | `cat-5-bg` / `cat-5-fg` | plum-100 / plum-700 | plum-900 / plum-200 |

List items pick their category as `cat-[(index % 5) + 1]`. `danger` and `cat-3` share clay primitives but are separate tokens, so recolouring the cycle never changes error states.

`danger` (clay-500 #B8755C, both themes) is the solid error colour, used today for the mini-player error progress line. Use it for lines, strokes and icons; for error text on light surfaces use `danger-subtle-fg`.

## Secondary colour

Ochre (#C6A75D) is readable on dark surfaces but only 1.9:1 on the ivory background, so it now has a darker sibling, `secondary-strong`, for text and icons in light mode.

| Ochre #C6A75D on | Contrast | Use it for |
| --- | --- | --- |
| `bg`, light (#F1EBDD) | 1.9:1 | Fills only, with a `secondary-fg` label |
| `emphasis` (#3B4330) | 4.4:1 | Fills, icons, progress lines |
| `inverse`, light (#292D25) | 6.1:1 | Anything |
| `surface-2`, dark (#363B30) | 5.0:1 | Anything |

Which token to use:

| Need | Token |
| --- | --- |
| Ochre button, play button, progress fill | `secondary` |
| Icon or label on an ochre fill | `secondary-fg` (6.1:1) |
| Ochre text, icon or thin line on `bg` or a surface | `secondary-strong` |
| Soft ochre background: search highlight, “match” badge | `secondary-subtle` |
| Text on that soft background | `secondary-subtle-fg` |

Current uses that move to `secondary`: the ochre play button on Continue listening, the arrow on the Latest event card, the Continue listening progress fill and the mini-player progress line.

## Tier 3: Component tokens

Only five components get their own tokens; everything else uses semantic tokens directly (the hero card is just `bg-emphasis`).

| Component | Token | Light | Dark | Why it exists |
| --- | --- | --- | --- | --- |
| Mini player | `miniPlayer.bg` | `inverse` | `emphasis` | Maps to a different role in each theme |
| Mini player | `miniPlayer.fg` | `inverse-fg` | `emphasis-fg` | Follows the background |
| Mini player | `miniPlayer.fg-muted` | `emphasis-fg-muted` | `emphasis-fg-muted` | Scholar name |
| Mini player | `miniPlayer.progress` | `secondary` | `secondary` | Progress line |
| Mini player | `miniPlayer.error-line` | `danger` | `danger` | Progress line when the lecture fails to load |
| Mini player | `miniPlayer.error-fg` | clay-200 (primitive) | clay-200 (primitive) | Error text on a dark bar; no semantic role fits yet |
| Tab bar | `tabBar.active-bg` / `active-fg` | `primary-subtle` / `primary-subtle-fg` | same | Stable hook if the tab style changes |
| Skeleton | `skeleton.bg` | `surface-2` | `surface-2` | Stable hook for loading states |
| Search | `search.highlight` | `secondary-subtle` | `secondary-subtle` | Stable hook for matched text |
| Like button | `likeButton.active` | clay-500 (primitive) | clay-500 (primitive) | Filled heart; deliberately not `danger`, so “liked” never reads as an error token |

The screens already use light clay (#E6BCA9) for mini-player error text, which reads well on the dark bar. The old token sheet described it as `ink-clay` (#5E4034), which would be nearly unreadable there; `miniPlayer.error-fg` now records the value the screens actually use.

Rules for component tokens:

1. Define them in the component’s own folder, never in the global theme or Tailwind palette.
2. Point them at semantic tokens. Point at a primitive only when no role fits, with a comment saying so.
3. Create one only when the per-theme mapping differs from a single semantic token, or a stable hook is useful.
4. When a second component needs the same value, promote it to a semantic token (for example, `emphasis-danger-fg`).

## Migration map

Every old token, in the order of the original spec, with its replacement.

| Old token | New token | Value changes? |
| --- | --- | --- |
| `background` | `bg` | No |
| `surface` | `surface-2` | No |
| `row` | `surface-1` | No |
| `sheet` | `surface-1` | Yes, both themes |
| `skeleton` | `skeleton.bg` → `surface-2` | Yes, both themes |
| `foreground` | `fg` | No |
| `foreground` at 8–10% | `border` | No |
| `foreground` at 20% | `border-strong` | No |
| `muted` | `fg-muted` | No |
| `brand` | `primary` | No |
| `primary` | `primary` | No |
| `on-primary` | `primary-fg` | No |
| `accent` | `primary` | Yes, light |
| `on-accent` | `primary-fg` | No |
| `track` | `track` | No |
| `hero` | `emphasis` | No |
| `on-hero` | `emphasis-fg` | No |
| `on-hero-muted` | `emphasis-fg-muted` | No |
| `cta` | `secondary` | No |
| `on-cta` | `secondary-fg` | No |
| `player` | `miniPlayer.bg` | No |
| `on-player` | `miniPlayer.fg` | No |
| `on-player-muted` | `miniPlayer.fg-muted` | Yes, both themes |
| `tab-active` | `tabBar.active-bg` → `primary-subtle` | Yes, dark |
| `on-tab-active` | `tabBar.active-fg` → `primary-subtle-fg` | Yes, dark |
| `highlight` | `search.highlight` → `secondary-subtle` | Yes, dark |
| `tint-sage` / `ink-sage` | `cat-1-bg` / `cat-1-fg` | No |
| `tint-ochre` / `ink-ochre` | `cat-2-bg` / `cat-2-fg` | No |
| `tint-clay` / `ink-clay` | `cat-3-bg` / `cat-3-fg` | No |
| `tint-clay` / `ink-clay` in error states | `danger-subtle` / `danger-subtle-fg` | No |
| `ink-clay` in mini-player error text | `miniPlayer.error-fg` | Yes, both themes |
| `tint-teal` / `ink-teal` | `cat-4-bg` / `cat-4-fg` | No |
| `tint-plum` / `ink-plum` | `cat-5-bg` / `cat-5-fg` | No |
| (new) | `secondary-strong`, `secondary-subtle-fg`, `inverse`, `inverse-fg` | New tokens |

### Values on the screens that had no token

An audit of all 15 screens found these hard-coded values outside the old sheet. Each now maps to a token or is marked as illustration.

| Value on screens | Where | New token |
| --- | --- | --- |
| #B8755C | Mini-player error progress line | `danger` (clay-500) |
| #B8755C | Liked heart on Now Playing | `likeButton.active` (clay-500) |
| #D5CDB8 | Loading spinner ring on Home and Events | `border-strong` |
| `fg` at 8% | Hairlines above the tab bar, recent-search dividers | `border` (10%) |
| `fg` at 12% | Translucent retry button on the mini player | `emphasis-fg` at 12% (keep as an alpha of the role) |
| #7C8A5D, #BCC5AB, #66734C in artwork | Album art, thumbnails, hero leaves | Illustration palette, outside UI tokens |

## Visual changes to verify

Every change is small; these are the screens where a user could notice one.

- [ ] **Now Playing, light:** progress fill, thumb, play/pause and “Try again” get slightly darker (#66734C → #56613F).
- [ ] **Mini player:** scholar name is lighter in light mode and brighter in dark mode (both now #D5D9C9).
- [ ] **Mini player error, light:** error text becomes light clay and is now readable on charcoal.
- [ ] **Tab bar, dark:** active pill slightly darker and icon slightly dimmer; check the pill still separates from the bar.
- [ ] **Search results, dark:** highlight drops from #5A4E2E to #4A4330. Highest risk: if matches look too faint against `surface-1`, keep a separate `search.highlight` value.
- [ ] **Home:** empty-series card and skeleton rows each shift one barely visible step.
- [ ] **Search results:** ochre and clay result tiles now use their own `cat-N-fg` instead of sage text on every tile.
- [ ] **Home and Events:** hairlines move from 8% to 10% and the spinner ring becomes `border-strong`; both are barely visible changes.

## How to use the system

Pick tokens by role, never by hex: if two tokens look the same today, the one whose name matches the job is correct.

### Choosing a colour

1. **Find the surface it sits on.** `bg`, `surface-1`, `surface-2`, `emphasis`, `inverse`, or a fill such as `primary`.
2. **If you are colouring a fill, pick its role.** Main action: `primary`. Warm or listening action: `secondary`. Selected or soft state: `primary-subtle`. Error: `danger-subtle`.
3. **Colour content with the matching `-fg`.** On `primary` use `primary-fg`; on `emphasis` use `emphasis-fg`. On `bg` and surfaces, use `fg` or `fg-muted`.
4. **Need ochre text on a light surface?** Use `secondary-strong`, never `secondary`.
5. **Check both themes.** A token that works in light must still work in dark; if it does not, the role is wrong, not the value.

### Contrast floors

| What | Minimum | Example pairs that pass |
| --- | --- | --- |
| Body text, labels | 4.5:1 | `fg` on any surface; `primary-fg` on `primary`; `secondary-strong` on `surface-2` |
| Large text (18 px+, or 14 px bold) | 3:1 | `fg-muted` titles on `surface-2` |
| Icons, progress lines, strokes | 3:1 | `secondary` on `emphasis` or `inverse`; `danger` on the light mini player (3.9:1) |
| Decorative fills with their own label | No minimum | `secondary` button on `bg`, because its `secondary-fg` label carries it |

### Do and don’t

| Do | Don’t |
| --- | --- |
| Use `border` / `border-strong` for every divider and outline | Write a new `rgba(...)` for a line |
| Use `cat-N` only to tell items apart | Use `cat-3` (clay) to signal an error |
| Keep a topic on the same category colour everywhere | Let one topic change colour between Home and Search |
| Use `danger` for error lines and icons | Use `danger` for “liked” or other positive states |
| Keep artwork colours inside illustrations | Reuse an artwork green as a UI colour |

### Adding a colour

1. **Add a primitive first.** Put the value in its ramp with a step number; never put a raw hex on a screen.
2. **Use it through a component token while only one component needs it.** Comment that it points at a primitive.
3. **Promote it to a semantic token on the second use,** named by role, with values for both themes.
4. **Update the board.** `html/design-system.html` is a static snapshot: update its swatches, ramps and tables by hand (and re-export `artboards/design-system.png`) whenever a token changes.

### Names in code

Tokens are kebab-case (`surface-1`, `primary-subtle-fg`) and become camelCase in JavaScript objects (`surface1`, `primarySubtleFg`). In NativeWind, only semantic tokens are exposed as classes (`bg-surface-1`, `text-primary-fg`); primitives and component tokens stay out of the Tailwind palette.

## Open decisions

- [ ] **Remove ochre from the category cycle?** Ochre is both `secondary` (“act here”) and category 2, which dilutes the secondary signal. Options: swap in a new hue or run a four-colour cycle.
- [ ] **Merge `olive-850` into `olive-800`?** #3A4334 and #3B4330 are the same lightness; only a slight hue shift separates them.
- [ ] **Confirm the `ochre-600` hue.** #725B2A is set for contrast; adjust by eye while keeping at least 4.5:1 on `surface-2`.
- [ ] **Keep the dark search highlight separate?** Decide after checking search results in dark mode (see Visual changes).
- [ ] **Lift `danger` for the dark mini player?** clay-500 on `emphasis` (#3B4330) is about 2.8:1, below the 3:1 floor for lines. Options: a lighter clay for dark mode, or a thicker error line.
- [ ] **Category by topic or by position?** Home and Search colour tiles by topic (Ṣaḥābā sage, Finance ochre, Fire clay); Events uses list position. Pick one rule. By topic is easier to learn, because a topic keeps its colour everywhere.
