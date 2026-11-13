import { router } from 'expo-router';

import type { SearchScope } from './scope';

// Opens the Search screen for lectures (Home's search bar) or events (the Events search button).
export function openSearch(scope: SearchScope) {
  router.push({ pathname: '/search', params: { scope } });
}
