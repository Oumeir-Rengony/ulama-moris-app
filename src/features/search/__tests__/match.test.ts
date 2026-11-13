import { findMatch, foldCharacter, splitForHighlight } from '@/features/search/match';
import { dotBelowTitle } from '@/test-utils/fixtures';

// Returns the part of `text` that findMatch says matched, or null.
function matchedText(text: string, query: string): string | null {
  const match = findMatch(text, query);
  if (match === null) {
    return null;
  }
  return text.slice(match.start, match.end);
}

describe('foldCharacter', () => {
  it('maps every apostrophe-like character to a straight apostrophe', () => {
    expect(foldCharacter('’')).toBe("'");
    expect(foldCharacter("'")).toBe("'");
    expect(foldCharacter('ʿ')).toBe("'");
  });

  it('lower-cases and drops accents', () => {
    expect(foldCharacter('Ş')).toBe('s');
    expect(foldCharacter('Ṣ')).toBe('s');
    expect(foldCharacter('ā')).toBe('a');
  });
});

describe('findMatch', () => {
  it('matches the cedilla spelling "Şahābā"', () => {
    expect(matchedText("Gravity of Talking Bad about the Şahābā Radiyallāhu 'Anhum", 'sahaba')).toBe('Şahābā');
  });

  it('matches the dot-below spelling "Ṣaḥābā"', () => {
    expect(matchedText(dotBelowTitle, 'sahaba')).toBe('Ṣaḥābā');
  });

  it('ignores upper and lower case', () => {
    expect(matchedText('Rights of Parents in Old Age', 'PARENTS')).toBe('Parents');
  });

  it('treats curly, straight and ayn apostrophes as the same', () => {
    expect(matchedText('Radiyallāhu ’Anhum', "radiyallahu 'anhum")).toBe('Radiyallāhu ’Anhum');
    expect(matchedText("Radiyallāhu 'Anhum", 'radiyallahu ’anhum')).toBe("Radiyallāhu 'Anhum");
    expect(matchedText('Nuʿmān Ibn Thābit', "nu'man")).toBe('Nuʿmān');
  });

  it('maps the highlight back to the original indexes', () => {
    const title = "Sacrifices of the Şahābā Radiyallāhu 'Anhum for Islam";
    expect(findMatch(title, 'sahaba')).toEqual({ start: 18, end: 24 });
    expect(matchedText(title, 'sahaba')).toBe('Şahābā');
  });

  it('keeps an accent stored as its own character inside the highlight', () => {
    // "Şahābā" written as plain letters followed by separate combining marks.
    const decomposedTitle = 'The Şahābā'.normalize('NFD');
    const highlighted = matchedText(decomposedTitle, 'sahaba');
    expect(highlighted).toBe('Şahābā'.normalize('NFD'));
  });

  it('returns null for an empty or blank query', () => {
    expect(findMatch('Rights of Parents', '')).toBeNull();
    expect(findMatch('Rights of Parents', '   ')).toBeNull();
  });

  it('returns null when the query is not in the text', () => {
    expect(findMatch('Rights of Parents', 'zakat')).toBeNull();
  });
});

describe('splitForHighlight', () => {
  it('splits a match at the start', () => {
    const title = 'Sahaba stories';
    expect(splitForHighlight(title, findMatch(title, 'sahaba'))).toEqual([
      { text: 'Sahaba', highlighted: true },
      { text: ' stories', highlighted: false },
    ]);
  });

  it('splits a match in the middle', () => {
    const title = 'The Sahaba Radiyyallahu Anhum';
    expect(splitForHighlight(title, findMatch(title, 'sahaba'))).toEqual([
      { text: 'The ', highlighted: false },
      { text: 'Sahaba', highlighted: true },
      { text: ' Radiyyallahu Anhum', highlighted: false },
    ]);
  });

  it('splits a match at the end', () => {
    const title = 'Stories of the Sahaba';
    expect(splitForHighlight(title, findMatch(title, 'sahaba'))).toEqual([
      { text: 'Stories of the ', highlighted: false },
      { text: 'Sahaba', highlighted: true },
    ]);
  });

  it('returns the whole text as one plain part when there is no match', () => {
    expect(splitForHighlight('Rights of Parents', null)).toEqual([{ text: 'Rights of Parents', highlighted: false }]);
  });
});
