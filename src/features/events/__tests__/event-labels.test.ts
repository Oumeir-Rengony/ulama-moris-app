import {
  eventLectureCountLabel,
  eventLectureMetaLabel,
  eventStatsLabel,
  eventVenueLabel,
  latestEventMetaLabel,
  lectureNumberLabel,
  pausedLectureMetaLabel,
  playingLectureMetaLabel,
  recordedLecturesLabel,
} from '@/features/events/event-labels';
import { bareLecture, fullEvent, fullLecture, noVenueEvent } from '@/test-utils/fixtures';

describe('lectureNumberLabel', () => {
  it('counts from 01, with a leading zero below 10', () => {
    expect(lectureNumberLabel(0)).toBe('01');
    expect(lectureNumberLabel(8)).toBe('09');
  });

  it('has no leading zero from 10', () => {
    expect(lectureNumberLabel(9)).toBe('10');
    expect(lectureNumberLabel(99)).toBe('100');
  });
});

describe('lecture counts', () => {
  it('uses the singular for one lecture', () => {
    expect(eventLectureCountLabel(noVenueEvent)).toBe('1 lecture');
    expect(recordedLecturesLabel(noVenueEvent)).toBe('1 recorded lecture');
  });

  it('uses the plural for several lectures', () => {
    expect(eventLectureCountLabel(fullEvent)).toBe('4 lectures');
    expect(recordedLecturesLabel(fullEvent)).toBe('4 recorded lectures');
  });
});

describe('eventStatsLabel', () => {
  it('joins the count, duration and date range', () => {
    expect(eventStatsLabel(fullEvent)).toBe('4 lectures · 2h 34m · 24 Oct – 31 Oct 2026');
  });
});

describe('venue labels', () => {
  it('adds the formatted venue after the date range', () => {
    expect(latestEventMetaLabel(fullEvent)).toBe('24 Oct – 31 Oct 2026 · Masjid Muswalla, Highlands');
    expect(eventVenueLabel(fullEvent)).toBe('Masjid Muswalla, Highlands');
  });

  it('leaves the venue out when the event has none', () => {
    expect(latestEventMetaLabel(noVenueEvent)).toBe('17 Nov 2023 – 22 Aug 2025');
    expect(eventVenueLabel(noVenueEvent)).toBeUndefined();
  });
});

describe('event detail row meta', () => {
  it('shows the date and clock duration', () => {
    expect(eventLectureMetaLabel(fullLecture)).toBe('31 Oct · 46:21');
  });

  it('shows only the date when the duration is unknown', () => {
    expect(eventLectureMetaLabel(bareLecture)).toBe('2 Oct');
  });

  it('shows the paused position and the total', () => {
    expect(pausedLectureMetaLabel(fullLecture, '16:05')).toBe('Paused · 16:05 / 46:21');
  });

  it('shows only the paused position when the duration is unknown', () => {
    expect(pausedLectureMetaLabel(bareLecture, '2:00')).toBe('Paused · 2:00');
  });
});

describe('playingLectureMetaLabel', () => {
  it('shows the position over the duration', () => {
    expect(playingLectureMetaLabel(fullLecture, '16:05')).toBe('Now playing · 16:05 / 46:21');
  });

  it('shows only the position when the duration is unknown', () => {
    expect(playingLectureMetaLabel(bareLecture, '2:00')).toBe('Now playing · 2:00');
  });
});

describe('events with missing data', () => {
  const undatedEvent = { slug: 'new-event', title: 'New event', total: 0, latestTime: 0 };

  it('shows only the lecture count when there is no duration or date range', () => {
    expect(eventStatsLabel(undatedEvent)).toBe('0 lectures');
  });

  it('leaves the date range out of the latest event line when there is none', () => {
    expect(latestEventMetaLabel({ ...undatedEvent, location: 'MASJID MUSWALLA, HIGHLANDS' })).toBe(
      'Masjid Muswalla, Highlands',
    );
  });

  it('leaves the date out of an event lecture row when the lecture has none', () => {
    expect(eventLectureMetaLabel({ ...fullLecture, date: undefined })).toBe('46:21');
  });
});
