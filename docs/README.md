# Ulama Moris: docs

The spec, the design references and the guides for the app. Start with `CONTEXT.md`.

## Contents

| Path | What it is |
|---|---|
| `CONTEXT.md` | **Read first.** How the built app works: state, audio, Now Playing, motion, the decisions that override HANDOFF.md, and the checks still to run |
| `HANDOFF.md` | The original spec: structure, screens and behaviour. Where it disagrees with `CONTEXT.md`, `CONTEXT.md` describes what was built |
| `DESIGN-SYSTEM.md` | The three-tier colour system (primitives → semantic → component), naming rules, categories, contrast, type, shadows and NativeWind setup. Step-by-step recipes are in `src/theme/README.md` |
| `ARTBOARD-MAP.md` | Every region of every artboard mapped to its HTML line, spacing and token classes |
| `expo-audio.md` | How playback is implemented with `expo-audio` (background audio, lock-screen controls), plus the real-device checklist |
| `Audio-Player-Animations.md` | The motion spec for the mini player and Now Playing |
| `ERROR-STATES.md` | Error and offline states. **The next stage** (HANDOFF.md §9) |
| `html/screens/*.html`, `artboards/screens/*.png` | Every screen as a working page (opens in any browser, offline; fonts in `html/fonts/`) and as a 2× PNG, same names. Static snapshots: buttons don't respond |
| `html/design-system.html`, `artboards/design-system.png` | The colour board. Update it when a colour token changes (`src/theme/README.md`) |
| `html/error-states/*.html`, `artboards/error-states/*.png` | Error and offline designs: one working page and one PNG per state |
| `videos/mini-player.mov` | The reference recording for the player motion |
| `cover-art.jpg`, `logo.png` | Source images. The app uses its own copies in `assets/images/` |

The theme and data files live in the app, not here: `src/global.css`, `tailwind.config.js`,
`src/theme/`, `src/components/<Name>/tokens.ts` and `src/data/sample.ts`.

## Starting the error-states stage

Paste this into a new session:

> Read `docs/CONTEXT.md`, then `docs/HANDOFF.md` §9 and `docs/ERROR-STATES.md`. The screens are already built; now add the error and offline states on top of them. The PNGs in `docs/artboards/error-states/` are the visual reference and the files in `docs/html/error-states/` are the working HTML pages. Use the same semantic and component tokens as the rest of the app (no hex values in components; light and dark must both work). Follow the order in HANDOFF.md §9.2, one step at a time, and show me each step before moving on.
