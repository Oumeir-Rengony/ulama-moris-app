// Accent-insensitive title matching for Search. Pure functions, no React.
//
// "Folding" turns text into a plain, comparable form: lower case, no accents, one apostrophe.
// "sahaba", "Şahābā" (S-cedilla, as in the data) and "Ṣaḥābā" (S-dot-below, as in the designs)
// all fold to "sahaba", so any of them finds the others.

export type TextPart = {
  text: string;
  highlighted: boolean;
};

export type MatchRange = {
  // Index of the first matched character in the ORIGINAL text.
  start: number;
  // Index just after the last matched character in the ORIGINAL text.
  end: number;
};

// U+0300–U+036F: the combining accents that normalize('NFD') splits off a letter.
const combiningMarks = /[̀-ͯ]/g;

const plainApostrophe = "'";

// ʿ (ayn) is a modifier letter, not a combining mark, so normalize('NFD') leaves it alone.
// It gets mapped by hand together with the curly and straight apostrophes.
const apostropheLikeCharacters = ['’', "'", 'ʿ'];

// Folds one character. The result is usually one character, but can be empty (a lone combining
// mark) or, for a few rare letters, more than one.
export function foldCharacter(character: string): string {
  if (apostropheLikeCharacters.includes(character)) {
    return plainApostrophe;
  }

  const lowerCase = character.toLowerCase();
  const decomposed = lowerCase.normalize('NFD');
  return decomposed.replace(combiningMarks, '');
}

type FoldedText = {
  folded: string;
  // originalIndexAt[i] is the index in the original text of the character that produced
  // folded[i]. Used to map a match in the folded text back to the original for highlighting.
  originalIndexAt: number[];
};

// Folds the text one character at a time, remembering where each folded character came from.
export function foldWithIndexMap(text: string): FoldedText {
  let folded = '';
  const originalIndexAt: number[] = [];
  let originalIndex = 0;

  // for...of walks whole characters, so a character stored as two UTF-16 units stays together.
  for (const character of text) {
    const foldedCharacter = foldCharacter(character);

    for (let i = 0; i < foldedCharacter.length; i += 1) {
      originalIndexAt.push(originalIndex);
    }
    folded += foldedCharacter;

    originalIndex += character.length;
  }

  return { folded, originalIndexAt };
}

function foldText(text: string): string {
  return foldWithIndexMap(text).folded;
}

// Finds the first place the query appears in the text, ignoring case and accents.
// Returns the range in the original text, or null when there is no match or the query is empty.
export function findMatch(text: string, query: string): MatchRange | null {
  const foldedQuery = foldText(query.trim());
  if (foldedQuery.length === 0) {
    return null;
  }

  const { folded, originalIndexAt } = foldWithIndexMap(text);
  const foldedStart = folded.indexOf(foldedQuery);
  if (foldedStart === -1) {
    return null;
  }
  const foldedEnd = foldedStart + foldedQuery.length;

  const start = originalIndexAt[foldedStart];

  // The match ends where the next folded character starts in the original text. Ending there,
  // rather than right after the last matched letter, keeps any accent stored as its own
  // character (a letter followed by a separate combining mark) inside the highlight.
  let end = text.length;
  const matchRunsToTheEnd = foldedEnd >= originalIndexAt.length;
  if (!matchRunsToTheEnd) {
    end = originalIndexAt[foldedEnd];
  }

  return { start, end };
}

// Splits the text into the parts HighlightedText draws: the matched part is flagged.
// With no match, the whole text is one plain part.
export function splitForHighlight(text: string, match: MatchRange | null): TextPart[] {
  if (match === null) {
    return [{ text, highlighted: false }];
  }

  const parts: TextPart[] = [];

  const before = text.slice(0, match.start);
  if (before.length > 0) {
    parts.push({ text: before, highlighted: false });
  }

  parts.push({ text: text.slice(match.start, match.end), highlighted: true });

  const after = text.slice(match.end);
  if (after.length > 0) {
    parts.push({ text: after, highlighted: false });
  }

  return parts;
}
