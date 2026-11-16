# Mobile app API (v1)

How the Ulama Moris mobile app gets its lectures and events. This is the website's read-only JSON API. It returns data already shaped like the app's `Lecture` and `EventSummary` types, so the app only needs to fetch and render.

All examples below are real responses, trimmed where marked.

## Basics

| | |
|---|---|
| Base URL (production) | `https://www.ulama-moris.org/api/v1` |
| Base URL (local website) | `http://localhost:3000/api/v1` |
| Methods | `GET` only |
| Auth | None |
| Response type | `application/json` |
| Caching | Every response has `Cache-Control: no-store`. Don't add your own HTTP caching on top; see [Freshness](#freshness). |
| CORS | Only matters for the app's web build: `http://localhost:8081` is allowed in development, plus the origin set in `APP_WEB_ORIGIN`. Native iOS and Android requests are unaffected. |

### Endpoints

| Endpoint | Used for | Paged |
|---|---|---|
| `GET /lectures` | Home list, series filter, lecture search | Yes |
| `GET /lectures/{slug}` | Now Playing, deep links, reminder taps | No |
| `GET /events` | Events tab, event search | Yes |
| `GET /events/{slug}` | Event detail screen | No (an event has at most 10 lectures) |

### Conventions

- **Missing values are `null`**, never `""` or left out. The one exception is `category`, which is always an array, possibly empty.
- **Text is trimmed.**
- **Errors** always have the body `{ "error": "<message>" }`, with a 4xx or 5xx status.
- **Slugs** in paths are URL-safe as given. Use the `slug` / `eventSlug` values from responses as-is.

---

## Paged lists and infinite scroll

`/lectures` and `/events` return one page at a time:

```json
{ "items": [ ... ], "total": 94, "page": 1, "hasMore": true }
```

| Query param | Default | Rules |
|---|---|---|
| `page` | `1` | 1-based. Anything that isn't a positive whole number is treated as `1`. |
| `limit` | `10` | Items per page, capped at `50`: a higher value returns 50 items. Anything that isn't a positive whole number uses the default `10`. |

| Response field | Meaning |
|---|---|
| `items` | This page's items. |
| `total` | Number of matching items, for display only (for example "94 lectures"). |
| `page` | The page that was returned. |
| `hasMore` | `true` if there is a next page. |

### How to drive infinite scroll

1. Load `page=1` with your chosen `limit`.
2. When the user nears the end of the list and `hasMore` is `true`, load `page + 1` with the **same** `limit` and filters, and append the `items`.
3. Stop when `hasMore` is `false`.
4. When the filters change (`type` or `search`), clear the list and start again from `page=1`.

Rules:

- **Stop on `hasMore`, not on `total`.** Past the last page, `/lectures` reports `total: 0`. That's Contentful's behaviour, not a sign that the list is empty:
  ```json
  // GET /lectures?page=999&limit=10
  { "items": [], "total": 0, "page": 999, "hasMore": false }

  // GET /events?page=999
  { "items": [], "total": 9, "page": 999, "hasMore": false }
  ```
- **Remove duplicates by `id` (lectures) or `slug` (events) when appending.** Pages are offset based. If a lecture is published while the user scrolls, everything shifts down by one, so the next page can repeat the last item of the previous page. Equally, an item can be skipped. That's acceptable, and pull-to-refresh fixes it.
- **Keep the same `limit` for every page of one list.** Changing it part way through changes the offsets.

---

## `GET /lectures`

Lectures, newest first (by `date`).

| Query param | Values |
|---|---|
| `page`, `limit` | See [Paged lists](#paged-lists-and-infinite-scroll). |
| `type` | Optional. One of `local`, `guest` or `islahi-majlis`. Any other value returns **400**. |
| `search` | Optional. Matches the lecture **title**, ignoring case and accents (`sahaba`, `SAHABA` and `Şahābā` all match "Şahābā"). Leading and trailing spaces are ignored, and an empty search means no filter. |

`type` and `search` can be combined.

### Example: `GET /lectures?page=1&limit=2`

```json
{
  "items": [
    {
      "id": "1iEGTjX7Rtu1dshU00v5FI",
      "slug": "gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum",
      "title": "Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum",
      "author": "Mufti Houzeifa Mamoojee",
      "date": "2026-10-31T21:15:00.000+04:00",
      "duration": "35:48",
      "masjid": "MASJID MUSWALLA, HIGHLANDS",
      "url": "https://assets.ctfassets.net/n7lbwg9xm90s/7lJFzEb2gn6EnvmH9mBuH/fc731919e30ab5fdf593a29e46499de8/9debee86-94dd-4bb1-90ee-a18f944b00bf.m4a",
      "series": "local",
      "event": "The Sahaba Radiyyallahu Anhum",
      "eventSlug": "the-sahaba-radiyyallahu-anhum",
      "category": ["sahaba r.a"]
    },
    {
      "id": "2Lj8Tjw39fHLd4br7v2ObJ",
      "slug": "sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam",
      "title": "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam",
      "author": "Mawlana Zyad Ally Quenette",
      "date": "2026-10-31T20:15:00.000+04:00",
      "duration": "46:21",
      "masjid": "MASJID MUSWALLA, HIGHLANDS",
      "url": "https://assets.ctfassets.net/n7lbwg9xm90s/xtKHdICdGePSFGwWeF6sU/2c2c6bf9726cc1821d7c767dd52a7449/b4e8c60f-d0e4-41b1-a309-3b113785f976.m4a",
      "series": "local",
      "event": "The Sahaba Radiyyallahu Anhum",
      "eventSlug": "the-sahaba-radiyyallahu-anhum",
      "category": ["sahaba r.a"]
    }
  ],
  "total": 94,
  "page": 1,
  "hasMore": true
}
```

### Example: `GET /lectures?type=guest&limit=1`

This one isn't part of an event, so `event` and `eventSlug` are `null`:

```json
{
  "items": [
    {
      "id": "6XPrJ05Ge7Vw2dBOTgLIyN",
      "slug": "what-is-so-special-about-gaza",
      "title": "What is so Special about Gaza",
      "author": "Mawlana Ridwan Kajee",
      "date": "2026-02-17T21:00:00.000+04:00",
      "duration": "59:00",
      "masjid": "Masjid Shan e Islam, Port Louis",
      "url": "https://downloads.ctfassets.net/n7lbwg9xm90s/3ZDzXHnQ0qZZI2nbezkCXz/e49036187ba2d8afe815338da9c8f94e/What_is_so_Special_about_Gaza_by_Mawlana_Ridwan_Kajee.mp3",
      "series": "guest",
      "event": null,
      "eventSlug": null,
      "category": ["Gaza"]
    }
  ],
  "total": 8,
  "page": 1,
  "hasMore": true
}
```

### Example: unknown `type` (`GET /lectures?type=international`)

`400 Bad Request`

```json
{ "error": "Unknown type \"international\"" }
```

### Lecture fields

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Always set. Stable and unique. Use it as the list key and for de-duplication. |
| `slug` | `string \| null` | Pass it to `GET /lectures/{slug}`. |
| `title` | `string \| null` | May contain accented characters (`Şahābā`). |
| `author` | `string \| null` | The speaker. |
| `date` | `string \| null` | ISO 8601 with offset, recorded in Mauritius time (`+04:00`). Show it in Mauritius time, not the device's, so dates match the website. |
| `duration` | `string \| null` | `"MM:SS"` or `"H:MM:SS"` as entered by editors (`"35:48"`). Treat it as display text. It may be `null` or malformed on older lectures. Get the real length from the audio player. |
| `masjid` | `string \| null` | Where it was recorded. |
| `url` | `string \| null` | Direct audio file URL (`.m4a` or `.mp3`, on `assets.ctfassets.net` or `downloads.ctfassets.net`). Stream it directly. `null` means there's nothing to play, so disable the play button. |
| `series` | `"local" \| "guest" \| "islahi-majlis" \| null` | The same values the `type` filter takes. |
| `event` | `string \| null` | Title of the event the lecture belongs to. A lecture belongs to at most one event. |
| `eventSlug` | `string \| null` | Pass it to `GET /events/{slug}`. Set whenever `event` is set. |
| `category` | `string[]` | Topic tags, possibly empty. Free text, so the case varies (`"Gaza"`, `"sahaba r.a"`). |

---

## `GET /lectures/{slug}`

One lecture. The body is the lecture itself, **not** wrapped in `items`. It has the same fields as above.

### Example: `GET /lectures/sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam`

```json
{
  "id": "2Lj8Tjw39fHLd4br7v2ObJ",
  "slug": "sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam",
  "title": "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam",
  "author": "Mawlana Zyad Ally Quenette",
  "date": "2026-10-31T20:15:00.000+04:00",
  "duration": "46:21",
  "masjid": "MASJID MUSWALLA, HIGHLANDS",
  "url": "https://assets.ctfassets.net/n7lbwg9xm90s/xtKHdICdGePSFGwWeF6sU/2c2c6bf9726cc1821d7c767dd52a7449/b4e8c60f-d0e4-41b1-a309-3b113785f976.m4a",
  "series": "local",
  "event": "The Sahaba Radiyyallahu Anhum",
  "eventSlug": "the-sahaba-radiyyallahu-anhum",
  "category": ["sahaba r.a"]
}
```

### Example: unknown slug (`GET /lectures/nope`)

`404 Not Found`

```json
{ "error": "Lecture not found" }
```

This endpoint can't tell "no such lecture" apart from a brief Contentful failure, so a 404 here **may be temporary**. For a deep link or reminder tap, show "Lecture not found" with a **Retry** button. Don't permanently forget the slug.

---

## `GET /events`

Events, ordered by their **most recent lecture**, newest first. Events with no dated lecture come last.

| Query param | Values |
|---|---|
| `page`, `limit` | See [Paged lists](#paged-lists-and-infinite-scroll). |
| `search` | Optional. Matches the event **title**, ignoring case and accents. An empty search means no filter. |

### Example: `GET /events?page=1&limit=2`

```json
{
  "items": [
    {
      "slug": "the-sahaba-radiyyallahu-anhum",
      "title": "The Sahaba Radiyyallahu Anhum",
      "total": 4,
      "duration": "2h 34m",
      "location": "MASJID MUSWALLA, HIGHLANDS",
      "dateRange": "24 Oct – 31 Oct 2026",
      "dateRangeLong": "24 – 31 October 2026",
      "year": "2026",
      "day": "24",
      "month": "Oct",
      "latestTime": 1793466900000
    },
    {
      "slug": "monthly-islahi-majlis-sat-09-may-2026",
      "title": "Monthly Islahi Majlis - Sat 09 May 2026",
      "total": 5,
      "duration": "1h 19m",
      "location": "Nuʿmān Ibn Thābit, Quatre Bornes",
      "dateRange": "9 May 2026",
      "dateRangeLong": "9 May 2026",
      "year": "2026",
      "day": "9",
      "month": "May",
      "latestTime": 1778346000000
    }
  ],
  "total": 9,
  "page": 1,
  "hasMore": true
}
```

### Event fields

All dates are computed in Mauritius time from the event's lectures. They are ready to display, so don't reformat them.

| Field | Type | Notes |
|---|---|---|
| `slug` | `string` | Always set. Pass it to `GET /events/{slug}`. Use it as the list key. |
| `title` | `string` | Always set. |
| `total` | `number` | Number of lectures in the event. Can be `0` for a newly created event. |
| `duration` | `string \| null` | Total length of all lectures (`"2h 34m"`, `"45m"`). `null` if any lecture has no usable duration. |
| `location` | `string \| null` | The masjid, only when **every** lecture was recorded at the same one. Otherwise `null`. |
| `dateRange` | `string \| null` | Short form for cards: `"9 May 2026"`, `"24 Oct – 31 Oct 2026"`. |
| `dateRangeLong` | `string \| null` | Long form for the detail screen: `"9 May 2026"`, `"24 – 31 October 2026"`, `"30 October – 2 November 2026"`. |
| `year` | `string \| null` | Year of the most recent lecture. Use it for year headings. |
| `day`, `month` | `string \| null` | For a date badge (`"24"`, `"Oct"`). This is when the event **started**, except for events that span two years, where it's the last date so the badge doesn't contradict the year heading. |
| `latestTime` | `number` | Epoch milliseconds of the most recent lecture, the field the list is sorted by. `0` when no lecture has a date. |

If no lecture has a date, all the date fields are `null` and `latestTime` is `0`.

### Grouping by year (to match the website)

The list arrives newest first, so walk it in order:

1. Start a new heading each time `year` changes.
2. Put events with `year: null` under a final **"Other events"** heading.

With infinite scroll, a year's group may continue on the next page. Append to the last group when the year matches; don't start a duplicate heading.

---

## `GET /events/{slug}`

One event and **all** of its lectures, newest first. Not paged: an event holds at most 10 lectures.

### Example: `GET /events/the-sahaba-radiyyallahu-anhum` (lectures trimmed to 2 of 4)

```json
{
  "event": {
    "slug": "the-sahaba-radiyyallahu-anhum",
    "title": "The Sahaba Radiyyallahu Anhum",
    "total": 4,
    "duration": "2h 34m",
    "location": "MASJID MUSWALLA, HIGHLANDS",
    "dateRange": "24 Oct – 31 Oct 2026",
    "dateRangeLong": "24 – 31 October 2026",
    "year": "2026",
    "day": "24",
    "month": "Oct",
    "latestTime": 1793466900000
  },
  "lectures": [
    {
      "id": "1iEGTjX7Rtu1dshU00v5FI",
      "slug": "gravity-of-talking-bad-about-the-sahaba-radiyallahu-anhum",
      "title": "Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum",
      "author": "Mufti Houzeifa Mamoojee",
      "date": "2026-10-31T21:15:00.000+04:00",
      "duration": "35:48",
      "masjid": "MASJID MUSWALLA, HIGHLANDS",
      "url": "https://assets.ctfassets.net/n7lbwg9xm90s/7lJFzEb2gn6EnvmH9mBuH/fc731919e30ab5fdf593a29e46499de8/9debee86-94dd-4bb1-90ee-a18f944b00bf.m4a",
      "series": "local",
      "event": "The Sahaba Radiyyallahu Anhum",
      "eventSlug": "the-sahaba-radiyyallahu-anhum",
      "category": ["sahaba r.a"]
    },
    {
      "id": "2Lj8Tjw39fHLd4br7v2ObJ",
      "slug": "sacrifices-of-the-sahaba-radiyallahu-anhum-for-islam",
      "title": "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam",
      "author": "Mawlana Zyad Ally Quenette",
      "date": "2026-10-31T20:15:00.000+04:00",
      "duration": "46:21",
      "masjid": "MASJID MUSWALLA, HIGHLANDS",
      "url": "https://assets.ctfassets.net/n7lbwg9xm90s/xtKHdICdGePSFGwWeF6sU/2c2c6bf9726cc1821d7c767dd52a7449/b4e8c60f-d0e4-41b1-a309-3b113785f976.m4a",
      "series": "local",
      "event": "The Sahaba Radiyyallahu Anhum",
      "eventSlug": "the-sahaba-radiyyallahu-anhum",
      "category": ["sahaba r.a"]
    }
  ]
}
```

- `event` has the same fields as an item in `GET /events`.
- `lectures` has the same fields as in `GET /lectures`. It's `[]` for an event with no lectures yet, which is a valid state: show an empty state, not an error.

### Example: unknown slug (`GET /events/nope`)

`404 Not Found`

```json
{ "error": "Event not found" }
```

Unlike lectures, this 404 is reliable: a Contentful failure returns 500 instead.

---

## Errors

| Status | When | Body | What the app should do |
|---|---|---|---|
| `400` | `/lectures` with an unknown `type` | `{ "error": "Unknown type \"…\"" }` | A bug in the app. Only send `local`, `guest` or `islahi-majlis`. |
| `404` | `/lectures/{slug}` not found | `{ "error": "Lecture not found" }` | Show "not found" with Retry (may be temporary). |
| `404` | `/events/{slug}` not found | `{ "error": "Event not found" }` | Show "not found". |
| `500` | Contentful failed | `{ "error": "Failed to fetch lectures" }` (or `lecture`, `events`, `event`) | Show an error with Retry. For a failed next page in infinite scroll, keep the items already loaded and show a retry row at the bottom. Don't clear the list. |

Read the status code first. The `error` text is for logs, not for display.

Invalid `page` or `limit` values never cause an error. They fall back to their defaults.

---

## Freshness

The website caches Contentful data on the server and clears that cache when an editor publishes. Responses are sent with `no-store`, so the app sees a change as soon as the website does.

For the app this means:

- Don't add HTTP caching on the client (no cache headers, no CDN in between). It's fine to keep data in memory or in a query cache (for example React Query) for the session, but **pull-to-refresh should refetch from `page=1`**.
- Refetching on app foreground is cheap, because the server answers from its own cache.

---

## Quick reference

```
GET /api/v1/lectures?page=1&limit=10&type=guest&search=sabr
  → { items: Lecture[], total, page, hasMore }

GET /api/v1/lectures/{slug}
  → Lecture                         | 404 { error }

GET /api/v1/events?page=1&limit=10&search=seerah
  → { items: EventSummary[], total, page, hasMore }

GET /api/v1/events/{slug}
  → { event: EventSummary, lectures: Lecture[] }   | 404 { error }
```

```ts
type Series = "local" | "guest" | "islahi-majlis";

type Lecture = {
  id: string;
  slug: string | null;
  title: string | null;
  author: string | null;
  date: string | null;        // ISO 8601, +04:00
  duration: string | null;    // "MM:SS" or "H:MM:SS", display only
  masjid: string | null;
  url: string | null;         // audio file
  series: Series | null;
  event: string | null;
  eventSlug: string | null;
  category: string[];
};

type EventSummary = {
  slug: string;
  title: string;
  total: number;
  duration: string | null;    // "2h 34m"
  location: string | null;
  dateRange: string | null;     // "24 Oct – 31 Oct 2026"
  dateRangeLong: string | null; // "24 – 31 October 2026"
  year: string | null;
  day: string | null;
  month: string | null;
  latestTime: number;         // epoch ms, 0 if undated
};

type Page<T> = { items: T[]; total: number; page: number; hasMore: boolean };
type ApiError = { error: string };
```
