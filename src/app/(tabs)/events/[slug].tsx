import { router, useLocalSearchParams } from 'expo-router';

import { PlaceholderButton, PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <PlaceholderScreen
      routeName="Event"
      details={['Route: /events/[slug]', `slug: ${slug}`]}
      ownsBottomInset={false}
    >
      <PlaceholderButton label="Back" onPress={() => router.back()} />
    </PlaceholderScreen>
  );
}
