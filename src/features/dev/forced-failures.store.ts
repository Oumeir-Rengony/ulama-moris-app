import { create } from 'zustand';

// DEVELOPMENT ONLY. Switches that make one kind of request fail on purpose, so every error state
// can be seen without turning the network off. Turned on and off at /dev/failures. Not
// persisted: a reload turns them all off. In a release build nothing reads them as on.

export type ForcedFailure =
  // The first page of Home's lectures and of the Events list.
  | 'firstPages'
  // Any later page of those lists (infinite scroll).
  | 'nextPages'
  // Search results, both scopes.
  | 'search'
  // Event detail.
  | 'eventDetail'
  // The lecture audio (Now Playing and the mini player).
  | 'audio'
  // The device seems to have no connection: the offline sheet shows at the next check (return to
  // the app, or its "Try again"). Reload the app to get out of it.
  | 'offline';

export const forcedFailureLabels: { key: ForcedFailure; label: string }[] = [
  { key: 'firstPages', label: 'First page of Home and Events' },
  { key: 'nextPages', label: 'Next pages (infinite scroll)' },
  { key: 'search', label: 'Search results' },
  { key: 'eventDetail', label: 'Event detail' },
  { key: 'audio', label: 'Lecture audio' },
  { key: 'offline', label: 'No connection (offline sheet, reload to leave)' },
];

type ForcedFailuresState = {
  active: ForcedFailure[];
  toggleForcedFailure: (failure: ForcedFailure) => void;
};

export const useForcedFailuresStore = create<ForcedFailuresState>()((set) => ({
  active: [],

  toggleForcedFailure: (failure) => {
    set((state) => {
      if (state.active.includes(failure)) {
        const remaining: ForcedFailure[] = [];
        for (const activeFailure of state.active) {
          if (activeFailure !== failure) {
            remaining.push(activeFailure);
          }
        }
        return { active: remaining };
      }
      return { active: [...state.active, failure] };
    });
  },
}));

export function isFailureForced(failure: ForcedFailure): boolean {
  if (!__DEV__) {
    return false;
  }
  return useForcedFailuresStore.getState().active.includes(failure);
}

// Which switch covers an API path such as "/lectures?page=2&limit=10&type=local".
// Lecture detail has no switch: no error state is designed for it yet.
function failureForApiPath(path: string): ForcedFailure | null {
  if (path.includes('search=')) {
    return 'search';
  }
  if (path.startsWith('/events/')) {
    return 'eventDetail';
  }
  if (path.startsWith('/lectures/')) {
    return null;
  }

  const pageMatch = path.match(/[?&]page=(\d+)/);
  let page = 1;
  if (pageMatch !== null) {
    page = Number(pageMatch[1]);
  }
  if (page > 1) {
    return 'nextPages';
  }
  return 'firstPages';
}

// True when a switch says this API request must fail.
export function isApiFailureForced(path: string): boolean {
  const failure = failureForApiPath(path);
  if (failure === null) {
    return false;
  }
  return isFailureForced(failure);
}
