import { PlaceholderLink, PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function HomeScreen() {
  return (
    <PlaceholderScreen routeName="Home" details={['Route: /']} ownsBottomInset={false}>
      <PlaceholderLink href={{ pathname: '/search', params: { scope: 'lectures' } }} label="Search lectures" />
      <PlaceholderLink href="/player" label="Open Now Playing" />
      {__DEV__ ? <PlaceholderLink href="/dev/tokens" label="Design tokens (dev)" /> : null}
    </PlaceholderScreen>
  );
}
