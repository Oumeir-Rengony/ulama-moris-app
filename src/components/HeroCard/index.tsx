import Radio from 'lucide-react-native/icons/radio';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Rosette } from '@/components/artwork/rosette';
import { Pill } from '@/components/ui/pill';
import { Text, type TextVariant } from '@/components/ui/text';

// One forest card shell for Continue listening, Latest event and the Event hero
// (DESIGN-SYSTEM §12). The preset sets the rosette, the title size and the title's right inset.
export type HeroCardPreset = 'continueListening' | 'latestEvent' | 'eventHero';

type RosettePlacement = {
  size: number;
  right: number;
  top: number;
};

type PresetStyle = {
  // null: no rosette. Continue listening has none for now, so its text uses the full width.
  rosette: RosettePlacement | null;
  titleVariant: TextVariant;
  // Keeps the title clear of the rosette.
  titleBlockClass: string;
  // The Event hero shows its overline as the "EVENT" pill; the others as plain overline text.
  overlineAsPill: boolean;
};

const presetStyles: Record<HeroCardPreset, PresetStyle> = {
  continueListening: {
    rosette: null,
    titleVariant: 'section',
    titleBlockClass: '',
    overlineAsPill: false,
  },
  latestEvent: {
    rosette: { size: 220, right: -80, top: -70 },
    titleVariant: 'h2',
    titleBlockClass: 'pr-12',
    overlineAsPill: false,
  },
  eventHero: {
    rosette: { size: 240, right: -90, top: -80 },
    titleVariant: 'h1',
    titleBlockClass: 'pr-[30px]',
    overlineAsPill: true,
  },
};

type HeroCardProps = {
  preset: HeroCardPreset;
  overline: string;
  title: string;
  // Scholar (Continue listening), "dates · venue" (Latest event) or the long date (Event hero).
  subtitle?: string;
  // The bottom row: play + progress, chips + arrow, or info chips.
  children?: ReactNode;
};

export function HeroCard({ preset, overline, title, subtitle, children }: HeroCardProps) {
  const style = presetStyles[preset];

  return (
    <View className="gap-3.5 overflow-hidden rounded-card bg-emphasis p-[22px]">
      {style.rosette ? (
        <View
          testID="hero-rosette"
          className="absolute"
          style={{ right: style.rosette.right, top: style.rosette.top }}
        >
          <Rosette size={style.rosette.size} />
        </View>
      ) : null}

      {style.overlineAsPill ? (
        <Pill label={overline} variant="onEmphasis" size="sm" icon={Radio} />
      ) : (
        <Text variant="overline" className="text-emphasis-fg-muted">
          {overline}
        </Text>
      )}

      <View className={`gap-1.5 ${style.titleBlockClass}`}>
        <Text variant={style.titleVariant} className="text-emphasis-fg">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" className="font-manrope-semibold text-emphasis-fg-muted">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}
