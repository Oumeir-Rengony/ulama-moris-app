import { router } from 'expo-router';

type OpenNowPlayingOptions = {
  // Set when the lecture was opened from an event, so the top bar reads "Playing from <event>".
  fromEventSlug?: string;
  // Set when the lecture was opened from a search result, so the top bar reads
  // "Playing from “<query>”".
  fromQuery?: string;
  // Set when opening from Search. Now Playing then takes Search's place in the history, so
  // minimising it returns to the tab Search was opened from (HANDOFF §4.5: "closes Search").
  replaceSearch?: boolean;
};

type NowPlayingParams = {
  slug: string;
  fromEventSlug?: string;
  fromQuery?: string;
};

// Opens Now Playing for one lecture. Every screen calls this instead of writing the route by
// hand, so the player stage can change what "open" means (start playback, set the queue) in one
// place.
export function openNowPlaying(slug: string, options: OpenNowPlayingOptions = {}) {
  const params: NowPlayingParams = { slug };
  if (options.fromEventSlug) {
    params.fromEventSlug = options.fromEventSlug;
  }
  if (options.fromQuery) {
    params.fromQuery = options.fromQuery;
  }

  // Search and Now Playing are both screens of the root stack, so a replace swaps one for the
  // other there and leaves the tabs underneath untouched.
  if (options.replaceSearch) {
    router.replace({ pathname: '/player', params });
    return;
  }
  router.push({ pathname: '/player', params });
}
