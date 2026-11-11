// TEMPORARY scaffolding from Stage 1. Each screen stage replaces its placeholder screen with the
// real one. Delete this folder once no route imports it.
import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

type PlaceholderScreenProps = {
  routeName: string;
  details?: string[];
  // Tab screens leave the bottom to the tab bar. Stack screens and modals own it.
  ownsBottomInset: boolean;
  children?: ReactNode;
};

const contentSpacing = 24;

export function PlaceholderScreen({ routeName, details = [], ownsBottomInset, children }: PlaceholderScreenProps) {
  const insets = useSafeAreaInsets();

  let bottomPadding = contentSpacing;
  if (ownsBottomInset) {
    bottomPadding = insets.bottom + contentSpacing;
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-4 px-gutter"
      contentContainerStyle={{ paddingTop: insets.top + contentSpacing, paddingBottom: bottomPadding }}
    >
      <Text variant="overline" className="text-fg-muted">
        Placeholder
      </Text>
      <Text variant="display">{routeName}</Text>
      {details.map((detail) => (
        <Text key={detail} variant="bodySm" className="text-fg-muted">
          {detail}
        </Text>
      ))}
      <View className="gap-2.5">{children}</View>
    </ScrollView>
  );
}

type PlaceholderLinkProps = {
  href: Href;
  label: string;
};

export function PlaceholderLink({ href, label }: PlaceholderLinkProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        className="min-h-touch justify-center rounded-row bg-surface-1 px-[18px] py-3 active:opacity-80"
      >
        <Text variant="title">{label}</Text>
      </Pressable>
    </Link>
  );
}

type PlaceholderButtonProps = {
  label: string;
  onPress: () => void;
};

export function PlaceholderButton({ label, onPress }: PlaceholderButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-touch justify-center rounded-row bg-surface-2 px-[18px] py-3 active:opacity-80"
    >
      <Text variant="title">{label}</Text>
    </Pressable>
  );
}
