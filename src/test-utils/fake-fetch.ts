// TEST ONLY. A stand-in for the global fetch, so the API fetchers can be tested without a server.
// Each test says what the "API" answers; the fake records every URL that was asked for.

export const testApiBaseUrl = 'https://api.test/api/v1';

type FakeAnswer = {
  status: number;
  body: unknown;
};

// Answers a request URL (without the base URL, e.g. "/lectures?page=1&limit=10").
type FakeApi = (path: string) => FakeAnswer;

let requestedPaths: string[] = [];

function toPath(url: string): string {
  if (url.startsWith(testApiBaseUrl)) {
    return url.slice(testApiBaseUrl.length);
  }
  return url;
}

function fakeResponse(answer: FakeAnswer): Response {
  const isOk = answer.status >= 200 && answer.status < 300;
  const response = {
    ok: isOk,
    status: answer.status,
    json: async () => answer.body,
  };
  return response as unknown as Response;
}

// Every fetch is answered by `api`. Call in beforeEach (or at the start of a test).
export function answerFetchWith(api: FakeApi): void {
  requestedPaths = [];
  process.env.EXPO_PUBLIC_API_URL = testApiBaseUrl;

  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const path = toPath(String(input));
    requestedPaths.push(path);
    return fakeResponse(api(path));
  }) as typeof fetch;
}

// Every fetch fails the way it does with no connection: fetch itself throws.
export function failFetchWithNoConnection(): void {
  requestedPaths = [];
  process.env.EXPO_PUBLIC_API_URL = testApiBaseUrl;

  global.fetch = jest.fn(async () => {
    throw new TypeError('Network request failed');
  }) as typeof fetch;
}

// The paths asked for since the fake was set up, in order.
export function fetchedPaths(): string[] {
  return requestedPaths;
}

// A complete lecture as the API sends it, with every optional value set.
export function apiLecture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'api-lecture-1',
    slug: 'gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum',
    title: "Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum",
    author: 'Mufti Houzeifa Mamoojee',
    date: '2026-10-31T21:15:00.000+04:00',
    duration: '35:48',
    masjid: 'MASJID MUSWALLA, HIGHLANDS',
    url: 'https://example.com/gravity.m4a',
    series: 'local',
    event: 'The Sahaba Radiyyallahu Anhum',
    eventSlug: 'the-sahaba-radiyyallahu-anhum',
    category: ['sahaba r.a'],
    ...overrides,
  };
}

// A complete event as the API sends it, with every optional value set.
export function apiEvent(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'the-sahaba-radiyyallahu-anhum',
    title: 'The Sahaba Radiyyallahu Anhum',
    total: 4,
    duration: '2h 34m',
    location: 'MASJID MUSWALLA, HIGHLANDS',
    dateRange: '24 Oct – 31 Oct 2026',
    dateRangeLong: '24 – 31 October 2026',
    year: '2026',
    day: '24',
    month: 'Oct',
    latestTime: 1793466900000,
    ...overrides,
  };
}

// A page of items as the API sends it.
export function apiPage(items: unknown[], options: { total: number; page: number; hasMore: boolean }) {
  return { items, total: options.total, page: options.page, hasMore: options.hasMore };
}
