import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

// One entry per step of the type scale (DESIGN-SYSTEM.md §10, `type` in src/theme/tokens.ts).
// Each variant sets the font file, size, line height and tracking in one place.
const variantFontClass = {
  display: 'font-manrope-extrabold',
  h1: 'font-manrope-extrabold',
  h2: 'font-manrope-extrabold',
  section: 'font-manrope-extrabold',
  headingSm: 'font-manrope-extrabold',
  title: 'font-manrope-bold',
  body: 'font-manrope',
  bodySm: 'font-manrope',
  meta: 'font-manrope-semibold',
  caption: 'font-manrope',
  label: 'font-manrope-bold',
  overline: 'font-manrope-bold',
} as const;

const variantSizeClass = {
  display: 'text-display',
  h1: 'text-h1',
  h2: 'text-h2',
  section: 'text-section',
  headingSm: 'text-heading-sm',
  title: 'text-title',
  body: 'text-body',
  bodySm: 'text-body-sm',
  meta: 'text-meta',
  caption: 'text-caption',
  label: 'text-label',
  overline: 'text-overline uppercase',
} as const;

export type TextVariant = keyof typeof variantFontClass;

// The `text-*` classes that are not colours: the sizes (tailwind.config.js `fontSize`) and the
// alignments.
const nonColorTextClassNames = new Set([
  'text-left',
  'text-center',
  'text-right',
  'text-justify',
  'text-display',
  'text-h1',
  'text-h2',
  'text-section',
  'text-heading-sm',
  'text-title',
  'text-body',
  'text-body-sm',
  'text-meta',
  'text-caption',
  'text-label',
  'text-overline',
]);

const defaultColorClass = 'text-fg';

// NativeWind resolves two conflicting classes by their order in the generated stylesheet,
// not by their order in `className`. So appending a caller's `text-primary` after our
// `text-fg` would not reliably win. Instead we leave our default out when the caller sets
// their own colour or font.
function callerSetsColor(callerClasses: string[]): boolean {
  for (const callerClass of callerClasses) {
    const classWithoutVariant = removeVariantPrefix(callerClass);
    const isTextClass = classWithoutVariant.startsWith('text-');
    const isNamedNonColorClass = nonColorTextClassNames.has(classWithoutVariant);
    // "text-[15px]" is an arbitrary size. An arbitrary colour (miniPlayer.errorFg) starts with "text-[#".
    const isArbitrarySize = /^text-\[\d/.test(classWithoutVariant);
    if (isTextClass && !isNamedNonColorClass && !isArbitrarySize) {
      return true;
    }
  }
  return false;
}

function callerSetsFont(callerClasses: string[]): boolean {
  for (const callerClass of callerClasses) {
    const classWithoutVariant = removeVariantPrefix(callerClass);
    if (classWithoutVariant.startsWith('font-manrope')) {
      return true;
    }
  }
  return false;
}

// "dark:text-emphasis-fg" → "text-emphasis-fg"
function removeVariantPrefix(className: string): string {
  const lastColon = className.lastIndexOf(':');
  if (lastColon === -1) {
    return className;
  }
  return className.slice(lastColon + 1);
}

function buildClassName(variant: TextVariant, callerClassName: string | undefined): string {
  const callerClasses = callerClassName ? callerClassName.split(/\s+/).filter(Boolean) : [];

  const classes: string[] = [variantSizeClass[variant]];
  if (!callerSetsFont(callerClasses)) {
    classes.push(variantFontClass[variant]);
  }
  if (!callerSetsColor(callerClasses)) {
    classes.push(defaultColorClass);
  }
  classes.push(...callerClasses);

  return classes.join(' ');
}

export type TextProps = NativeTextProps & {
  variant?: TextVariant;
  // Tabular numbers keep digits from jiggling. Use it for every time value (HANDOFF §1).
  tabular?: boolean;
  className?: string;
};

export function Text({ variant = 'body', tabular = false, className, style, ...rest }: TextProps) {
  const combinedClassName = buildClassName(variant, className);

  let combinedStyle = style;
  if (tabular) {
    combinedStyle = [{ fontVariant: ['tabular-nums'] }, style];
  }

  return <NativeText className={combinedClassName} style={combinedStyle} {...rest} />;
}
