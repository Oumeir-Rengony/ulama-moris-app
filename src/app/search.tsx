import { router, useLocalSearchParams } from 'expo-router';

import { PlaceholderButton, PlaceholderScreen } from '@/components/PlaceholderScreen';
import { parseSearchScope } from '@/features/search/scope';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope = parseSearchScope(params.scope);

  return (
    <PlaceholderScreen
      routeName="Search"
      details={['Route: /search', `scope param: ${params.scope ?? '(none)'}`, `parsed scope: ${scope}`]}
      ownsBottomInset
    >
      <PlaceholderButton label="Back" onPress={() => router.back()} />
    </PlaceholderScreen>
  );
}
