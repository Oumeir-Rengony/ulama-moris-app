import { topicOrder } from '@/data/sample';
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
  const knownTopics = ['sahaba r.a', 'islamic finance', 'current affairs', 'seerah', 'akhlaq', 'fiqh'];

  it('rotates topics in their first-seen order', () => {
    expect(catForTopic('sahaba r.a', knownTopics)).toBe(1);
    expect(catForTopic('islamic finance', knownTopics)).toBe(2);
    expect(catForTopic('akhlaq', knownTopics)).toBe(5);
    expect(catForTopic('fiqh', knownTopics)).toBe(1);
  });

  it('always gives the same topic the same colour', () => {
    const first = catForTopic('seerah', knownTopics);
    const second = catForTopic('seerah', knownTopics);
    expect(second).toBe(first);
  });

  it('gives an unknown topic category 1', () => {
    expect(catForTopic('not a topic', knownTopics)).toBe(1);
  });

  it('orders the sample topics by where they first appear in the data', () => {
    expect(topicOrder[0]).toBe('sahaba r.a');
    expect(catForTopic('sahaba r.a', topicOrder)).toBe(1);
  });
});
