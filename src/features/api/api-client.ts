import { isApiFailureForced } from '@/features/dev/forced-failures.store';

// The one place the app talks to the website's API (/api/v1). The fetchers in
// features/<domain>/<domain>.api.ts call getJson and turn its result into the app's types.

// Thrown when the API answers with an error status (400, 404, 500 …). A failed connection
// (no internet, server down) throws fetch's own TypeError instead.
// The message starts with "API <status>:" so development tools can recognise it by its text
// (QueryBoundary keeps a failed load out of LogBox by matching it).
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(`API ${status}: ${message}`);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Set in .env. Inlined when the bundle is built, so restart Metro after changing it.
function readBaseUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (baseUrl === undefined || baseUrl === '') {
    throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to .env, then restart Metro.');
  }
  return baseUrl;
}

// The `error` text from an error body ({ "error": "Lecture not found" }), for logs only.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === 'string') {
      return body.error;
    }
  } catch {
    // The body wasn't JSON (a proxy or server error page). The status says enough.
  }
  return `Request failed with status ${response.status}`;
}

// GET a path such as "/lectures?page=1" and return the parsed JSON body.
export async function getJson(path: string): Promise<unknown> {
  // Development only: fail the way a lost connection does, to show the error states.
  if (isApiFailureForced(path)) {
    throw new TypeError('Network request failed (forced at /dev/failures)');
  }

  const response = await fetch(`${readBaseUrl()}${path}`);

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  return response.json();
}

// True for the API's 404, so a fetcher can turn "not found" into null instead of an error.
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

// The API sends a missing value as null; the app's types leave it out (undefined), so it can be
// passed straight to an optional prop.
export function nullToUndefined<Value>(value: Value | null): Value | undefined {
  if (value === null) {
    return undefined;
  }
  return value;
}
