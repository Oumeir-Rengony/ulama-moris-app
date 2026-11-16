import { catAt, catForTopic } from '@/theme/tokens';

describe('catAt', () => {
  it('gives the first five positions categories 1 to 5', () => {
    expect(catAt(0)).toBe(1);
    expect(catAt(1)).toBe(2);
    expect(catAt(4)).toBe(5);
  });

  it('starts again at 1 after category 5', () => {
    expect(catAt(5)).toBe(1);
    expect(catAt(12)).toBe(3);
  });

  it('keeps a negative index inside 1 to 5', () => {
    expect(catAt(-1)).toBe(5);
    expect(catAt(-5)).toBe(1);
  });
});

describe('catForTopic', () => {
  it('always gives the same topic the same colour', () => {
    expect(catForTopic('Moon Sighting')).toBe(catForTopic('Moon Sighting'));
  });

  it('ignores case, so topics typed differently by editors match', () => {
    expect(catForTopic('SEERAH')).toBe(catForTopic('Seerah'));
  });

  it('gives a lecture without a topic category 1', () => {
    expect(catForTopic('')).toBe(1);
  });

  it('spreads different topics over more than one colour', () => {
    const topics = ['sahaba r.a', 'Moon Sighting', 'Ramadan', 'Family', 'Fiqh', 'Gaza', 'spiritual', 'Zakaat'];
    const colours = new Set();
    for (const topic of topics) {
      colours.add(catForTopic(topic));
    }
    expect(colours.size).toBeGreaterThan(1);
  });
});
