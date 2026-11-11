import { router } from 'expo-router';

// Opens an event's detail screen inside the Events tab.
export function openEvent(slug: string) {
  router.push({ pathname: '/events/[slug]', params: { slug } });
}
