// Development-only preview of the design tokens: the in-app version of docs/html/design-system.html.
// Open it in light and dark to check a new token visually.
import { Redirect, router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { miniPlayer } from '@/components/MiniPlayer/tokens';
import { search } from '@/components/Search/tokens';
import { skeleton } from '@/components/Skeleton/tokens';
import { tabBar } from '@/components/TabBar/tokens';
import { Text, type TextVariant } from '@/components/ui/text';
import {
  catAt,
  catClasses,
  catFgColorKey,
  useThemeColors,
  useThemeShadows,
  type Category,
  type SemanticColor,
} from '@/theme/tokens';

type Swatch = {
  name: string;
  // Literal class names, so Tailwind keeps them.
  className: string;
  // The same colour in JS (useThemeColors). Shown next to the class swatch: both must match.
  jsKey?: SemanticColor;
};

type SwatchGroup = {
  title: string;
  swatches: Swatch[];
};

const swatchGroups: SwatchGroup[] = [
  {
    title: 'Base',
    swatches: [
      { name: 'bg', className: 'bg-bg', jsKey: 'bg' },
      { name: 'surface-1', className: 'bg-surface-1', jsKey: 'surface1' },
      { name: 'surface-2', className: 'bg-surface-2', jsKey: 'surface2' },
      { name: 'fg', className: 'bg-fg', jsKey: 'fg' },
      { name: 'fg-muted', className: 'bg-fg-muted', jsKey: 'fgMuted' },
      { name: 'border', className: 'bg-border' },
      { name: 'border-strong', className: 'bg-border-strong' },
    ],
  },
  {
    title: 'Primary',
    swatches: [
      { name: 'primary', className: 'bg-primary', jsKey: 'primary' },
      { name: 'primary-fg', className: 'bg-primary-fg', jsKey: 'primaryFg' },
      { name: 'primary-subtle', className: 'bg-primary-subtle', jsKey: 'primarySubtle' },
      { name: 'primary-subtle-fg', className: 'bg-primary-subtle-fg', jsKey: 'primarySubtleFg' },
    ],
  },
  {
    title: 'Secondary',
    swatches: [
      { name: 'secondary', className: 'bg-secondary', jsKey: 'secondary' },
      { name: 'secondary-fg', className: 'bg-secondary-fg', jsKey: 'secondaryFg' },
      { name: 'secondary-strong', className: 'bg-secondary-strong', jsKey: 'secondaryStrong' },
      { name: 'secondary-subtle', className: 'bg-secondary-subtle', jsKey: 'secondarySubtle' },
      { name: 'secondary-subtle-fg', className: 'bg-secondary-subtle-fg', jsKey: 'secondarySubtleFg' },
    ],
  },
  {
    title: 'Emphasis and inverse',
    swatches: [
      { name: 'emphasis', className: 'bg-emphasis', jsKey: 'emphasis' },
      { name: 'emphasis-fg', className: 'bg-emphasis-fg', jsKey: 'emphasisFg' },
      { name: 'emphasis-fg-muted', className: 'bg-emphasis-fg-muted', jsKey: 'emphasisFgMuted' },
      { name: 'inverse', className: 'bg-inverse', jsKey: 'inverse' },
      { name: 'inverse-fg', className: 'bg-inverse-fg', jsKey: 'inverseFg' },
    ],
  },
  {
    title: 'Controls and status',
    swatches: [
      { name: 'track', className: 'bg-track', jsKey: 'track' },
      { name: 'danger', className: 'bg-danger', jsKey: 'danger' },
      { name: 'danger-subtle', className: 'bg-danger-subtle', jsKey: 'dangerSubtle' },
      { name: 'danger-subtle-fg', className: 'bg-danger-subtle-fg', jsKey: 'dangerSubtleFg' },
    ],
  },
];

const typeVariants: { variant: TextVariant; sample: string }[] = [
  { variant: 'display', sample: 'Events' },
  { variant: 'h1', sample: 'Nurture your heart' },
  { variant: 'h2', sample: 'The Sahaba Radiyyallahu Anhum' },
  { variant: 'section', sample: 'Latest lectures' },
  { variant: 'headingSm', sample: 'Recent searches' },
  { variant: 'title', sample: 'Sacrifices of the Ṣaḥābā for Islam' },
  { variant: 'body', sample: 'Search by topic' },
  { variant: 'bodySm', sample: 'Conferences, programmes and gatherings.' },
  { variant: 'meta', sample: 'Mufti Houzeifa Mamoojee' },
  { variant: 'caption', sample: '31 Oct · 36 min · Masjid Muswalla' },
  { variant: 'label', sample: '2026' },
  { variant: 'overline', sample: 'Continue listening' },
];

const radii: { name: string; className: string }[] = [
  { name: 'thumb-sm 10', className: 'rounded-thumb-sm' },
  { name: 'tile 14', className: 'rounded-tile' },
  { name: 'thumb 16', className: 'rounded-thumb' },
  { name: 'mini 20', className: 'rounded-mini' },
  { name: 'row 22', className: 'rounded-row' },
  { name: 'card 28', className: 'rounded-card' },
  { name: 'full', className: 'rounded-full' },
];

const categories: Category[] = [1, 2, 3, 4, 5];

// Six positions, to show the rotation wrapping back to cat-1.
const rotationPositions = [0, 1, 2, 3, 4, 5];

function SectionTitle({ title }: { title: string }) {
  return (
    <Text variant="section" className="mt-[34px]">
      {title}
    </Text>
  );
}

function SwatchRow({ swatch }: { swatch: Swatch }) {
  const colors = useThemeColors();

  let jsValueLabel = 'class only';
  let jsSwatchStyle = undefined;
  if (swatch.jsKey !== undefined) {
    jsValueLabel = colors[swatch.jsKey];
    jsSwatchStyle = { backgroundColor: colors[swatch.jsKey] };
  }

  return (
    <View className="min-h-touch flex-row items-center gap-3">
      <View className={`h-10 w-10 rounded-tile border border-border ${swatch.className}`} />
      <View className="h-10 w-10 rounded-tile border border-border" style={jsSwatchStyle} />
      <View className="flex-1">
        <Text variant="meta">{swatch.name}</Text>
        <Text variant="caption" tabular className="text-fg-muted">
          {jsValueLabel}
        </Text>
      </View>
    </View>
  );
}

function CategoryPair({ category }: { category: Category }) {
  const colors = useThemeColors();
  const classes = catClasses[category];
  const jsForeground = colors[catFgColorKey[category]];

  return (
    <View className={`min-h-touch flex-row items-center justify-between rounded-tile px-3 py-2 ${classes.bg}`}>
      <Text variant="meta" className={classes.fg}>
        cat-{category}
      </Text>
      <View className="h-4 w-4 rounded-full" style={{ backgroundColor: jsForeground }} />
    </View>
  );
}

export default function TokensPreviewScreen() {
  const insets = useSafeAreaInsets();
  const shadows = useThemeShadows();
  const { colorScheme } = useColorScheme();

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="px-gutter"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-row items-center justify-between">
        <Text variant="display">Tokens</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close token preview"
          onPress={() => router.back()}
          className="h-touch min-w-touch items-center justify-center rounded-full bg-surface-2 px-4"
        >
          <Text variant="bodySm" className="font-manrope-bold">
            Close
          </Text>
        </Pressable>
      </View>
      <Text variant="bodySm" className="mt-1.5 text-fg-muted">
        Theme: {colorScheme}. Left square = class, right square = useThemeColors().
      </Text>

      {swatchGroups.map((group) => (
        <View key={group.title}>
          <SectionTitle title={group.title} />
          <View className="mt-3 gap-1">
            {group.swatches.map((swatch) => (
              <SwatchRow key={swatch.name} swatch={swatch} />
            ))}
          </View>
        </View>
      ))}

      <SectionTitle title="Categories" />
      <View className="mt-3 gap-2">
        {categories.map((category) => (
          <CategoryPair key={category} category={category} />
        ))}
      </View>
      <Text variant="meta" className="mt-4 text-fg-muted">
        Rotation by position (catAt), wrapping after cat-5
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {rotationPositions.map((position) => {
          const classes = catClasses[catAt(position)];
          return (
            <View key={position} className={`h-16 w-[60px] items-center justify-center rounded-thumb ${classes.bg}`}>
              <Text variant="section" className={classes.fg}>
                {position + 1}
              </Text>
            </View>
          );
        })}
      </View>

      <SectionTitle title="Type" />
      <View className="mt-3 gap-3">
        {typeVariants.map((entry) => (
          <View key={entry.variant} className="gap-0.5">
            <Text variant="caption" className="text-fg-muted">
              {entry.variant}
            </Text>
            <Text variant={entry.variant}>{entry.sample}</Text>
          </View>
        ))}
        <View className="gap-0.5">
          <Text variant="caption" className="text-fg-muted">
            title + tabular (times)
          </Text>
          <Text variant="title" tabular>
            16:05 / 46:21 · 1:02:05
          </Text>
        </View>
        <View className="gap-0.5">
          <Text variant="caption" className="text-fg-muted">
            Manrope weights
          </Text>
          <Text variant="body" className="font-manrope-regular">
            Regular 400
          </Text>
          <Text variant="body">Medium 500</Text>
          <Text variant="body" className="font-manrope-semibold">
            SemiBold 600
          </Text>
          <Text variant="body" className="font-manrope-bold">
            Bold 700
          </Text>
          <Text variant="body" className="font-manrope-extrabold">
            ExtraBold 800
          </Text>
        </View>
      </View>

      <SectionTitle title="Radii" />
      <View className="mt-3 flex-row flex-wrap gap-3">
        {radii.map((entry) => (
          <View key={entry.name} className="items-center gap-1.5">
            <View className={`h-16 w-16 bg-surface-2 ${entry.className}`} />
            <Text variant="caption" className="text-fg-muted">
              {entry.name}
            </Text>
          </View>
        ))}
      </View>

      <SectionTitle title="Shadows" />
      <Text variant="caption" className="mt-1.5 text-fg-muted">
        Light only. Dark mode has no shadows.
      </Text>
      <View className="mt-4 flex-row gap-6">
        <View className="items-center gap-3">
          <View className="h-24 w-24 rounded-card bg-surface-2" style={{ boxShadow: shadows.artwork }} />
          <Text variant="caption" className="text-fg-muted">
            artwork
          </Text>
        </View>
        <View className="items-center gap-3">
          <View className="h-[76px] w-24 rounded-[26px] bg-primary" style={{ boxShadow: shadows.playButton }} />
          <Text variant="caption" className="text-fg-muted">
            playButton
          </Text>
        </View>
      </View>

      <SectionTitle title="Opacity and component tokens" />
      <View className="mt-3 gap-3.5 rounded-card bg-emphasis p-[22px]">
        <Text variant="overline" className="text-emphasis-fg-muted">
          On emphasis
        </Text>
        <View className="min-h-8 flex-row items-center self-start rounded-full bg-emphasis-fg/[0.12] px-3">
          <Text variant="meta" className="font-manrope-bold text-emphasis-fg">
            bg-emphasis-fg/[0.12]
          </Text>
        </View>
        <View className="h-1 overflow-hidden rounded-full bg-emphasis-fg/[0.18]">
          <View className="h-1 w-[35%] rounded-full bg-secondary" />
        </View>
      </View>

      <View className={`mt-3 overflow-hidden rounded-mini px-3 pb-2.5 pt-2 ${miniPlayer.bg} ${miniPlayer.outline}`}>
        <Text variant="bodySm" numberOfLines={1} className={`font-manrope-bold ${miniPlayer.fg}`}>
          miniPlayer.bg (inverse light / emphasis dark)
        </Text>
        <Text variant="caption" className={`font-manrope-semibold ${miniPlayer.fgMuted}`}>
          miniPlayer.fgMuted
        </Text>
        <Text variant="caption" className={`font-manrope-semibold ${miniPlayer.errorFg}`}>
          miniPlayer.errorFg
        </Text>
        <View className={`absolute bottom-0 left-0 h-[3px] w-[35%] ${miniPlayer.progress}`} />
      </View>

      <View className={`mt-3 flex-row gap-1 pt-2 ${tabBar.divider}`}>
        <View className={`min-h-8 flex-1 items-center justify-center rounded-full ${tabBar.activeBg}`}>
          <Text variant="caption" className="font-manrope-extrabold text-fg">
            tabBar.activeBg
          </Text>
        </View>
        <View className="min-h-8 flex-1 items-center justify-center">
          <Text variant="caption" className={`font-manrope-semibold ${tabBar.inactiveFg}`}>
            tabBar.inactiveFg
          </Text>
        </View>
      </View>

      <View className={`mt-3 gap-2 rounded-row p-4 ${skeleton.row}`}>
        <View className={`h-3 w-[85%] rounded-full ${skeleton.bg}`} />
        <View className={`h-2.5 w-[55%] rounded-full ${skeleton.bg}`} />
        <View className={`h-2.5 w-[70%] rounded-full ${skeleton.bg}`} />
      </View>

      <Text variant="title" className="mt-3">
        Search highlight:{' '}
        <Text variant="title" className={`rounded ${search.highlight} ${search.highlightFg}`}>
          Ṣaḥābā
        </Text>
      </Text>
    </ScrollView>
  );
}
