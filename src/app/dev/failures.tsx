// Development-only switches that make requests fail on purpose, to check every error state
// without turning the network off. Open by URL: /dev/failures.
// The switches reset on reload. A switch takes effect on the next request: pull to refresh,
// switch tabs, or press "Try again".
import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import {
  forcedFailureLabels,
  useForcedFailuresStore,
  type ForcedFailure,
} from '@/features/dev/forced-failures.store';

function goBack() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}

type FailureSwitchProps = {
  failure: ForcedFailure;
  label: string;
  isOn: boolean;
};

function FailureSwitch({ failure, label, isOn }: FailureSwitchProps) {
  const toggleForcedFailure = useForcedFailuresStore((state) => state.toggleForcedFailure);

  function handlePress() {
    toggleForcedFailure(failure);
  }

  let stateClass = 'bg-surface-2';
  let stateLabel = 'Off';
  if (isOn) {
    stateClass = 'bg-danger-subtle';
    stateLabel = 'Failing';
  }

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: isOn }}
      onPress={handlePress}
      className="min-h-touch flex-row items-center justify-between gap-3 rounded-row bg-surface-1 px-4 py-3 active:opacity-80"
    >
      <Text variant="body" className="flex-1">
        {label}
      </Text>
      <View className={`rounded-full px-3 py-1 ${stateClass}`}>
        <Text variant="meta" className="font-manrope-bold">
          {stateLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ForcedFailuresScreen() {
  const insets = useSafeAreaInsets();
  const activeFailures = useForcedFailuresStore((state) => state.active);

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
        <Text variant="display">Failures</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close failure switches"
          onPress={goBack}
          className="h-touch min-w-touch items-center justify-center rounded-full bg-surface-2 px-4"
        >
          <Text variant="bodySm" className="font-manrope-bold">
            Close
          </Text>
        </Pressable>
      </View>
      <Text variant="bodySm" className="mt-1.5 text-fg-muted">
        A failing request fails like a lost connection. It applies from the next request; a reload turns
        every switch off.
      </Text>

      <View className="mt-6 gap-2">
        {forcedFailureLabels.map((item) => (
          <FailureSwitch
            key={item.key}
            failure={item.key}
            label={item.label}
            isOn={activeFailures.includes(item.key)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
