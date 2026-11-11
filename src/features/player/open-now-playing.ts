import { router } from 'expo-router';

type OpenNowPlayingOptions = {
  // Set when the lecture was opened from an event, so the top bar reads "Playing from <event>".
  fromEventSlug?: string;
};

// Opens Now Playing for one lecture. Every screen calls this instead of writing the route by
// hand, so the player stage can change what "open" means (start playback, set the queue) in one
// place.
export function openNowPlaying(slug: string, options: OpenNowPlayingOptions = {}) {
  if (options.fromEventSlug) {
    router.push({ pathname: '/player', params: { slug, fromEventSlug: options.fromEventSlug } });
    return;
  }
  router.push({ pathname: '/player', params: { slug } });
}
