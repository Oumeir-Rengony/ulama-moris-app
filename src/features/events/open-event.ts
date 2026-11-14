import { router } from 'expo-router';

type OpenEventOptions = {
  // Set when opening from Search: a result closes Search, so Search doesn't stay in the
  // history behind Event detail.
  replaceSearch?: boolean;
};

// Opens an event's detail screen inside the Events tab.
export function openEvent(slug: string, options: OpenEventOptions = {}) {
  // Search sits in the root stack above the tabs, and Event detail lives in the Events tab's own
  // stack. `router.replace` would swap Search for a second copy of the tabs, so Back would land
  // on the old tabs. `dismissTo` instead closes Search, goes back to the existing tabs, and
  // pushes Event detail onto the Events stack, so Back goes to the Events list.
  if (options.replaceSearch) {
    router.dismissTo({ pathname: '/events/[slug]', params: { slug } });
    return;
  }
  router.push({ pathname: '/events/[slug]', params: { slug } });
}
