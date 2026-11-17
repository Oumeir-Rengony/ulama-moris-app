import { isApiFailureForced, isFailureForced, useForcedFailuresStore } from '@/features/dev/forced-failures.store';

beforeEach(() => {
  useForcedFailuresStore.setState({ active: [] });
});

function turnOn(...failures: Parameters<typeof isFailureForced>[0][]) {
  for (const failure of failures) {
    useForcedFailuresStore.getState().toggleForcedFailure(failure);
  }
}

describe('forced failure switches', () => {
  it('are all off at first', () => {
    expect(isFailureForced('firstPages')).toBe(false);
    expect(isFailureForced('audio')).toBe(false);
  });

  it('turn on and off again', () => {
    turnOn('audio');
    expect(isFailureForced('audio')).toBe(true);

    useForcedFailuresStore.getState().toggleForcedFailure('audio');
    expect(isFailureForced('audio')).toBe(false);
  });
});

describe('isApiFailureForced', () => {
  it('fails nothing while every switch is off', () => {
    expect(isApiFailureForced('/lectures?page=1&limit=10&type=local')).toBe(false);
  });

  it('fails only the first pages with "firstPages"', () => {
    turnOn('firstPages');
    expect(isApiFailureForced('/lectures?page=1&limit=10&type=local')).toBe(true);
    expect(isApiFailureForced('/events?page=1&limit=10')).toBe(true);
    expect(isApiFailureForced('/lectures?page=2&limit=10&type=local')).toBe(false);
  });

  it('fails only later pages with "nextPages"', () => {
    turnOn('nextPages');
    expect(isApiFailureForced('/lectures?page=2&limit=10&type=local')).toBe(true);
    expect(isApiFailureForced('/events?page=3&limit=10')).toBe(true);
    expect(isApiFailureForced('/lectures?page=1&limit=10&type=local')).toBe(false);
  });

  it('fails search requests, on any page, with "search" only', () => {
    turnOn('search');
    expect(isApiFailureForced('/lectures?page=1&limit=10&search=sahaba')).toBe(true);
    expect(isApiFailureForced('/events?page=2&limit=10&search=majlis')).toBe(true);
    expect(isApiFailureForced('/lectures?page=1&limit=10&type=local')).toBe(false);
  });

  it('fails event detail with "eventDetail", not the events list', () => {
    turnOn('eventDetail');
    expect(isApiFailureForced('/events/the-sahaba-radiyyallahu-anhum')).toBe(true);
    expect(isApiFailureForced('/events?page=1&limit=10')).toBe(false);
  });

  it('never fails a single lecture lookup', () => {
    turnOn('firstPages', 'nextPages', 'search', 'eventDetail', 'audio');
    expect(isApiFailureForced('/lectures/gravity-of-talking-bad')).toBe(false);
  });
});
