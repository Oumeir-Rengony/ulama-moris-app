import { PlaceholderLink, PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function EventsScreen() {
  return (
    <PlaceholderScreen routeName="Events" details={['Route: /events']} ownsBottomInset={false}>
      <PlaceholderLink href={{ pathname: '/search', params: { scope: 'events' } }} label="Search events" />
      <PlaceholderLink
        href={{ pathname: '/events/[slug]', params: { slug: 'the-sahaba-radiyyallahu-anhum' } }}
        label="Open The Sahaba Radiyyallahu Anhum"
      />
    </PlaceholderScreen>
  );
}
