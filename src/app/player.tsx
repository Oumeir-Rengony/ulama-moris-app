import { router } from 'expo-router';

import { PlaceholderButton, PlaceholderScreen } from '@/components/PlaceholderScreen';

// Full-screen modal: no header covers the notch, so this screen owns its top and bottom insets.
export default function PlayerScreen() {
  // TODO(player stage): if nothing is loaded in the player (e.g. a cold deep link to /player),
  // router.replace('/') instead of showing an empty Now Playing screen.
  return (
    <PlaceholderScreen routeName="Now Playing" details={['Route: /player']} ownsBottomInset>
      <PlaceholderButton label="Close" onPress={() => router.back()} />
    </PlaceholderScreen>
  );
}
