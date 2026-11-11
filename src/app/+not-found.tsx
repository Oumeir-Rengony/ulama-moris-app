import { usePathname } from 'expo-router';

import { PlaceholderLink, PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function NotFoundScreen() {
  const pathname = usePathname();

  return (
    <PlaceholderScreen routeName="Page not found" details={[`No screen for ${pathname}`]} ownsBottomInset>
      <PlaceholderLink href="/" label="Go to Home" />
    </PlaceholderScreen>
  );
}
