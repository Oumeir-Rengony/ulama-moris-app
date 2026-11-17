import Search from 'lucide-react-native/icons/search';
import WifiOff from 'lucide-react-native/icons/wifi-off';
import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeHeader } from '@/components/HomeHeader';
import { SkeletonRow } from '@/components/Skeleton';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { scrim, useThemeShadows } from '@/theme/tokens';

// offline:  the sheet as it shows, and again after a check that found no connection.
// checking: "Try again" was pressed and the connection is being checked.
export type OfflineSheetStatus = 'offline' | 'checking';

type OfflineSheetProps = {
  status: OfflineSheetStatus;
  // The Home chip labels, for the Home skeleton drawn behind the scrim.
  seriesLabels: string[];
  onTryAgainPress?: () => void;
};

const message =
  'Ulama Moris needs the internet to load and play lectures. Check your Wi‑Fi or mobile data, then try again.';

// A chip as it looks on Home, as a plain shape: the first one selected.
function ChipShape({ label, isSelected }: { label: string; isSelected: boolean }) {
  let chipClass = 'bg-surface-2';
  let labelClass = 'font-manrope-bold text-fg';
  if (isSelected) {
    chipClass = 'bg-primary';
    labelClass = 'font-manrope-bold text-primary-fg';
  }

  return (
    <View className={`min-h-10 justify-center rounded-full px-4 py-2 ${chipClass}`}>
      <Text variant="bodySm" numberOfLines={1} className={labelClass}>
        {label}
      </Text>
    </View>
  );
}

// Home as it looks before anything has loaded: the header, the search field, the chips and
// placeholder rows, with Home's spacing. Drawn behind the offline sheet, so the app never shows
// half-loaded content under it. Plain views only, no buttons: nothing back here can take focus
// (on the web a hidden button could still be reached with the keyboard).
function HomeSkeletonBehind({ seriesLabels }: { seriesLabels: string[] }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      pointerEvents="none"
      className="absolute inset-0 bg-bg"
      style={{ paddingTop: insets.top }}
    >
      <View className="w-full self-center" style={{ maxWidth: 600 }}>
        <HomeHeader />

        <View className="mt-6 gap-1.5 px-gutter">
          <Text variant="bodySm" className="font-manrope-bold text-primary">
            Assalāmu ’alaykum
          </Text>
          <Text variant="h1">Nurture your heart with today’s reminders</Text>
        </View>

        <View className="mt-[18px] px-gutter">
          <View className="min-h-[52px] flex-row items-center gap-2.5 rounded-full bg-surface-2 px-[18px] py-3">
            <Icon icon={Search} size={20} color="fgMuted" />
            <Text variant="body" numberOfLines={1} className="shrink text-fg-muted">
              Search by topic
            </Text>
          </View>
        </View>

        <View className="mt-[34px] px-gutter">
          <Text variant="section">Latest lectures</Text>
        </View>

        <View className="mt-2 flex-row flex-wrap gap-2 px-gutter">
          {seriesLabels.map((label, index) => (
            <ChipShape key={label} label={label} isSelected={index === 0} />
          ))}
        </View>

        <View className="mt-3.5 gap-2.5 px-gutter">
          <SkeletonRow variant="lecture" />
          <SkeletonRow variant="lecture" />
          <SkeletonRow variant="lecture" />
        </View>
      </View>
    </View>
  );
}

// The blocking "No internet connection" pop-up: Home's skeleton under a fixed charcoal scrim (the
// same in both themes), and a sheet anchored to the bottom. It can't be dismissed; only a
// connection closes it. It owns its bottom inset.
export function OfflineSheet({ status, seriesLabels, onTryAgainPress }: OfflineSheetProps) {
  const insets = useSafeAreaInsets();
  const shadows = useThemeShadows();
  const titleRef = useRef<ComponentRef<typeof View>>(null);

  // Screen-reader focus starts on the title, so the sheet is read from the top.
  // sendAccessibilityEvent doesn't exist on react-native-web.
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    const title = titleRef.current;
    if (title !== null) {
      AccessibilityInfo.sendAccessibilityEvent(title, 'focus');
    }
  }, []);

  const isChecking = status === 'checking';

  // While checking, the button is busy and ignores presses.
  function handleTryAgainPress() {
    if (isChecking) {
      return;
    }
    onTryAgainPress?.();
  }

  let buttonContent = (
    <Text variant="body" className="font-manrope-bold text-primary-fg">
      Try again
    </Text>
  );
  let buttonLabel = 'Try again';
  if (isChecking) {
    buttonLabel = 'Checking connection';
    buttonContent = (
      <View className="flex-row items-center gap-2">
        <Spinner size={18} color="primaryFg" />
        <Text variant="body" className="font-manrope-bold text-primary-fg">
          Checking connection
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <HomeSkeletonBehind seriesLabels={seriesLabels} />
      <View className="absolute inset-0" style={{ backgroundColor: scrim }} />

      <View className="flex-1 justify-end px-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <View
          accessibilityViewIsModal
          className="w-full self-center rounded-card bg-bg px-6 pb-6 pt-7"
          style={{ maxWidth: 600, boxShadow: shadows.offlineSheet }}
        >
          <View className="items-center">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-danger-subtle">
              <Icon icon={WifiOff} size={30} color="dangerSubtleFg" />
            </View>
            {/* The View is the focus target: Text takes no ref. */}
            <View ref={titleRef} accessible accessibilityRole="header" className="mt-5">
              <Text variant="h2" className="text-center font-manrope-extrabold">
                No internet connection
              </Text>
            </View>
            <Text
              variant="body"
              accessibilityLiveRegion="polite"
              className="mt-3 text-center font-manrope text-fg-muted"
            >
              {message}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
            accessibilityState={{ busy: isChecking }}
            onPress={handleTryAgainPress}
            className="mt-6 min-h-[52px] items-center justify-center rounded-full bg-primary px-6 active:opacity-80"
          >
            {buttonContent}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
