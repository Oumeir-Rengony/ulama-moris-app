import { router } from 'expo-router';

// Opens Now Playing for one lecture. Every screen calls this instead of writing the route by
// hand, so the player stage can change what "open" means (start playback, set the queue) in one
// place.
export function openNowPlaying(slug: string) {
  router.push({ pathname: '/player', params: { slug } });
}
