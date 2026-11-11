export type SearchScope = 'lectures' | 'events';

// Reads the `?scope=` route param. A missing or unknown value means the lectures scope.
export function parseSearchScope(raw: string | string[] | undefined): SearchScope {
  if (raw === 'events') {
    return 'events';
  }
  return 'lectures';
}
