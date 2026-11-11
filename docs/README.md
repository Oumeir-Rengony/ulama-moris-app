# Ulama Moris – design handoff (consolidated)

This folder is the complete, current handoff for the Ulama Moris app: the design (artboards and working HTML pages), the written spec, the three-tier design system and the setup for this repository. Build from this folder only.

## How to use it

1. The Expo app already exists at the repository root (`src/app/` holds the routes).
2. This folder lives at `docs/updated-doc/`.
3. Open the project in Claude Code and paste:

> Read `docs/updated-doc/HANDOFF.md` first and `docs/updated-doc/DESIGN-SYSTEM.md` second. Style everything with NativeWind using the three-tier colour system: semantic tokens from `docs/updated-doc/global.css` and `docs/updated-doc/tailwind.config.js`, primitives in `docs/updated-doc/src/theme/primitives.ts` (never used in screens), and component tokens in `docs/updated-doc/src/components/*/tokens.ts`. No hex values in components; light and dark must both work. Also use `docs/updated-doc/src/theme/tokens.ts` and `docs/updated-doc/src/data/sample.ts`. The working pages in `docs/updated-doc/html/screens/` and the PNGs in `docs/updated-doc/artboards/screens/` are the visual reference, and `docs/updated-doc/ARTBOARD-MAP.md` maps each artboard region to its HTML line and spec. Match their layout, spacing and copy, but where they disagree with HANDOFF.md, HANDOFF.md wins. For audio, follow `docs/updated-doc/expo-audio.md`. Ignore section 8 of HANDOFF.md (Deferred for later) unless asked. Build the app with expo-router, TypeScript and the navigation map in section 2. Follow the build order in section 7, one step at a time, and show me each step before moving on. Start with steps 1 and 2.

Tip: build one screen per session and compare it with its artboard before moving on.

4. **Error and offline states (separate stage).** Once every screen (build order steps 1–9) is done and checked, start a new session and paste:

> Read `docs/updated-doc/HANDOFF.md` §9 and `docs/updated-doc/ERROR-STATES.md`. The screens are already built; now add the error and offline states on top of them. The PNGs in `docs/updated-doc/artboards/error-states/` are the visual reference and the files in `docs/updated-doc/html/error-states/` are the working HTML pages. Use the same semantic and component tokens as the rest of the app (no hex values in components; light and dark must both work). Follow the order in HANDOFF.md §9.2, one step at a time, and show me each step before moving on.

## Contents

| Path | What it is |
|---|---|
| `HANDOFF.md` | **Read first.** Structure, screens and behaviour. The source of truth |
| `DESIGN-SYSTEM.md` | **Read second.** Three-tier colour system (primitives → semantic → component), naming rules, categories, contrast, type, shadows, NativeWind setup, class recipes, 15-second icons |
| `COLOUR-SYSTEM-CHANGES.md` | Change log from the old flat colour names to the three-tier system, with the migration map |
| `ARTBOARD-MAP.md` | Every region of every artboard mapped to its HTML line, spacing and token classes |
| `expo-audio.md` | How to implement playback with `expo-audio` (background audio, lock-screen controls) |
| `ERROR-STATES.md` | Error and offline states. Built as a separate stage after all screens are done (HANDOFF.md §9) |
| `global.css`, `tailwind.config.js` | NativeWind theme: the semantic tier as classes that switch light/dark |
| `src/theme/primitives.ts` | Tier 1: raw colour ramps (never used in screens) |
| `src/theme/tokens.ts` | Tier 2 in JS: `useThemeColors()`, `useThemeShadows()`, `catAt()`, `catForTopic()`, `catClasses`, the offline `scrim`, the artwork `palette`, type, spacing, radii, sizes |
| `src/components/*/tokens.ts` | Tier 3: component tokens (MiniPlayer, TabBar, Skeleton, Search) |
| `src/data/sample.ts` | Static sample content from the website, with types, topic labels and placeholder recent searches |
| `html/screens/*.html`, `artboards/screens/*.png` | Every screen as a working page (opens in any browser, offline; fonts in `html/fonts/`) and as a 2× PNG, same names. Static snapshots: buttons don't respond |
| `html/design-system.html`, `artboards/design-system.png` | The colour board |
| `html/error-states/*.html`, `artboards/error-states/*.png` | Error and offline designs: one working page and one PNG per state. Used only in the error-states stage |
