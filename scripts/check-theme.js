#!/usr/bin/env node
/*
 * Theme check: catches drift between the files that hold colours, and raw colours in UI code.
 * Run with `npm run check:theme`. Reports every problem it finds, then exits with code 1 if any.
 *
 * It parses the theme files with simple regexes, so they must keep their fixed format,
 * ONE TOKEN PER LINE:
 *
 *   src/theme/primitives.ts   one ramp per line:     sand: { 50: '#F1EBDD', 100: '#EAE3D3' },
 *   src/global.css            one variable per line: --color-surface-1: 234 227 211; (RGB channels)
 *                             light values in the first `:root` block, dark values after
 *                             `@media (prefers-color-scheme: dark)`
 *   src/theme/tokens.ts       one colour per line:   surface1: primitives.sand[100],
 *                             inside `export const lightColors = {` and `export const darkColors`
 *                             catClasses entries:    1: { bg: 'bg-cat-1-bg', fg: 'text-cat-1-fg' },
 *   tailwind.config.js        loaded with require(), colours read from theme.extend.colors
 *
 * Checks:
 *   1. Parity: global.css light ↔ dark, global.css → tailwind.config.js, global.css → tokens.ts
 *      (light and dark, same RGB value).
 *   2. No primitive ramp names among the Tailwind colour keys.
 *   3. No raw colours (#rgb, #rrggbb, rgb(, rgba() in src/app and src/components.
 *      Allowed: src/components/<Name>/tokens.ts and src/components/artwork/.
 *   4. catClasses in tokens.ts covers exactly the categories defined in global.css.
 */
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

const paths = {
  primitives: path.join(projectRoot, 'src/theme/primitives.ts'),
  tokens: path.join(projectRoot, 'src/theme/tokens.ts'),
  globalCss: path.join(projectRoot, 'src/global.css'),
  tailwindConfig: path.join(projectRoot, 'tailwind.config.js'),
  uiFolders: [path.join(projectRoot, 'src/app'), path.join(projectRoot, 'src/components')],
};

const problems = [];

function report(problem) {
  problems.push(problem);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// ---------- Parsing ----------

// { sand: { 50: '#F1EBDD', ... }, ... }
function parsePrimitives() {
  const source = readFile(paths.primitives);
  const ramps = {};
  const rampLine = /^\s*(\w+):\s*\{([^}]*)\}/gm;
  for (const rampMatch of source.matchAll(rampLine)) {
    const rampName = rampMatch[1];
    const steps = {};
    const stepPattern = /(\d+):\s*'(#[0-9A-Fa-f]{6})'/g;
    for (const stepMatch of rampMatch[2].matchAll(stepPattern)) {
      steps[stepMatch[1]] = stepMatch[2].toUpperCase();
    }
    ramps[rampName] = steps;
  }
  return ramps;
}

// { light: { 'surface-1': '234 227 211', ... }, dark: { ... } }
function parseGlobalCss() {
  const source = readFile(paths.globalCss);
  const darkMarker = '@media (prefers-color-scheme: dark)';
  const markerIndex = source.indexOf(darkMarker);
  if (markerIndex === -1) {
    report(`global.css: missing the "${darkMarker}" block`);
    return { light: {}, dark: {} };
  }
  const lightPart = source.slice(0, markerIndex);
  const darkPart = source.slice(markerIndex);
  return { light: parseCssVariables(lightPart), dark: parseCssVariables(darkPart) };
}

function parseCssVariables(cssText) {
  const variables = {};
  const variableLine = /--color-([a-z0-9-]+):\s*(\d+)\s+(\d+)\s+(\d+);/g;
  for (const match of cssText.matchAll(variableLine)) {
    variables[match[1]] = `${match[2]} ${match[3]} ${match[4]}`;
  }
  return variables;
}

// The text between `startMarker` and the next line that starts with "}".
function extractBlock(source, startMarker) {
  const startIndex = source.indexOf(startMarker);
  if (startIndex === -1) {
    return null;
  }
  const endIndex = source.indexOf('\n}', startIndex);
  return source.slice(startIndex, endIndex);
}

// { light: { surface1: { ramp: 'sand', step: '100' }, ... }, dark: { ... } }
function parseTokenColors() {
  const source = readFile(paths.tokens);
  const lightBlock = extractBlock(source, 'export const lightColors');
  const darkBlock = extractBlock(source, 'export const darkColors');
  if (lightBlock === null) {
    report('tokens.ts: could not find "export const lightColors"');
  }
  if (darkBlock === null) {
    report('tokens.ts: could not find "export const darkColors"');
  }
  return {
    light: parseColorLines(lightBlock ?? ''),
    dark: parseColorLines(darkBlock ?? ''),
  };
}

function parseColorLines(blockText) {
  const colors = {};
  const colorLine = /^\s*(\w+):\s*primitives\.(\w+)\[(\d+)\]/gm;
  for (const match of blockText.matchAll(colorLine)) {
    colors[match[1]] = { ramp: match[2], step: match[3] };
  }
  return colors;
}

// "surface-1" → "surface1", "primary-subtle-fg" → "primarySubtleFg", "cat-1-bg" → "cat1Bg"
function kebabToCamel(kebabName) {
  const parts = kebabName.split('-');
  let camelName = parts[0];
  for (const part of parts.slice(1)) {
    const isNumber = /^\d+$/.test(part);
    if (isNumber) {
      camelName += part;
    } else {
      camelName += part[0].toUpperCase() + part.slice(1);
    }
  }
  return camelName;
}

// "#F1EBDD" → "241 235 221"
function hexToRgbChannels(hex) {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `${red} ${green} ${blue}`;
}

// ---------- Check 1: parity ----------

function checkLightDarkParity(css) {
  for (const name of Object.keys(css.light)) {
    if (!(name in css.dark)) {
      report(`global.css: --color-${name} is in :root (light) but missing from the dark block`);
    }
  }
  for (const name of Object.keys(css.dark)) {
    if (!(name in css.light)) {
      report(`global.css: --color-${name} is in the dark block but missing from :root (light)`);
    }
  }
}

function checkTailwindHasEveryVariable(css, tailwindColors) {
  for (const name of Object.keys(css.light)) {
    if (!(name in tailwindColors)) {
      report(`tailwind.config.js: no colours entry for --color-${name} (expected '${name}')`);
    }
  }
}

function checkTokensMatchCss(css, tokenColors, primitives) {
  const themes = ['light', 'dark'];
  for (const theme of themes) {
    const objectName = `${theme}Colors`;
    for (const [cssName, cssRgb] of Object.entries(css[theme])) {
      const tokenKey = kebabToCamel(cssName);
      const tokenColor = tokenColors[theme][tokenKey];
      if (tokenColor === undefined) {
        report(`tokens.ts: ${objectName} has no "${tokenKey}" for --color-${cssName}`);
        continue;
      }

      const ramp = primitives[tokenColor.ramp];
      const hex = ramp ? ramp[tokenColor.step] : undefined;
      if (hex === undefined) {
        report(`tokens.ts: ${objectName}.${tokenKey} points at primitives.${tokenColor.ramp}[${tokenColor.step}], which does not exist`);
        continue;
      }

      const tokenRgb = hexToRgbChannels(hex);
      if (tokenRgb !== cssRgb) {
        report(`${theme}: --color-${cssName} is "${cssRgb}" in global.css but ${objectName}.${tokenKey} is ${hex} ("${tokenRgb}")`);
      }
    }
  }
}

// ---------- Check 2: no primitives in Tailwind ----------

function checkNoPrimitivesInTailwind(tailwindColors, primitives) {
  const rampNames = Object.keys(primitives);
  for (const colorKey of Object.keys(tailwindColors)) {
    for (const rampName of rampNames) {
      if (colorKey === rampName || colorKey.startsWith(`${rampName}-`)) {
        report(`tailwind.config.js: colour "${colorKey}" looks like a primitive ramp ("${rampName}"). Only semantic tokens may be classes`);
      }
    }
  }
}

// ---------- Check 3: no raw colours in UI code ----------

const rawColorPattern = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|\brgba?\(/;

function isAllowedToHoldRawColors(filePath) {
  const relativePath = path.relative(projectRoot, filePath).split(path.sep).join('/');
  const isComponentTokens = /^src\/components\/[^/]+\/tokens\.ts$/.test(relativePath);
  const isArtwork = relativePath.startsWith('src/components/artwork/');
  return isComponentTokens || isArtwork;
}

function listSourceFiles(folder) {
  if (!fs.existsSync(folder)) {
    return [];
  }
  const files = [];
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const entryPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(entryPath));
    } else if (/\.(ts|tsx|js|jsx|css)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

function checkNoRawColorsInUi() {
  for (const folder of paths.uiFolders) {
    for (const filePath of listSourceFiles(folder)) {
      if (isAllowedToHoldRawColors(filePath)) {
        continue;
      }
      const lines = readFile(filePath).split('\n');
      lines.forEach((line, lineIndex) => {
        if (rawColorPattern.test(line)) {
          const relativePath = path.relative(projectRoot, filePath);
          report(`${relativePath}:${lineIndex + 1}: raw colour in UI code. Use a semantic class or useThemeColors(): ${line.trim()}`);
        }
      });
    }
  }
}

// ---------- Check 4: category literals ----------

function checkCategoryClasses(css) {
  const cssCategories = new Set();
  for (const name of Object.keys(css.light)) {
    const categoryMatch = /^cat-(\d+)-bg$/.exec(name);
    if (categoryMatch) {
      cssCategories.add(categoryMatch[1]);
    }
  }

  const source = readFile(paths.tokens);
  const catClassesBlock = extractBlock(source, 'export const catClasses');
  if (catClassesBlock === null) {
    report('tokens.ts: could not find "export const catClasses"');
    return;
  }

  const tokenCategories = new Set();
  const entryLine = /^\s*(\d+):\s*\{\s*bg:\s*'bg-cat-(\d+)-bg',\s*fg:\s*'text-cat-(\d+)-fg'\s*\}/gm;
  for (const match of catClassesBlock.matchAll(entryLine)) {
    const key = match[1];
    if (match[2] !== key || match[3] !== key) {
      report(`tokens.ts: catClasses[${key}] must use bg-cat-${key}-bg and text-cat-${key}-fg`);
    }
    tokenCategories.add(key);
  }

  for (const category of cssCategories) {
    if (!tokenCategories.has(category)) {
      report(`tokens.ts: catClasses has no entry for cat-${category}, which global.css defines`);
    }
  }
  for (const category of tokenCategories) {
    if (!cssCategories.has(category)) {
      report(`tokens.ts: catClasses has cat-${category}, which global.css does not define`);
    }
  }
}

// ---------- Run ----------

function main() {
  const primitives = parsePrimitives();
  const css = parseGlobalCss();
  const tokenColors = parseTokenColors();
  const tailwindColors = require(paths.tailwindConfig).theme.extend.colors;

  checkLightDarkParity(css);
  checkTailwindHasEveryVariable(css, tailwindColors);
  checkTokensMatchCss(css, tokenColors, primitives);
  checkNoPrimitivesInTailwind(tailwindColors, primitives);
  checkNoRawColorsInUi();
  checkCategoryClasses(css);

  if (problems.length > 0) {
    console.error(`check:theme found ${problems.length} problem(s):\n`);
    for (const problem of problems) {
      console.error(`  ✗ ${problem}`);
    }
    process.exit(1);
  }

  const variableCount = Object.keys(css.light).length;
  console.log(`check:theme passed (${variableCount} colour variables, light and dark in sync, no raw colours in UI code).`);
}

main();
