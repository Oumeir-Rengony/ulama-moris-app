// Venue names come from the API in all caps ("MASJID MUSWALLA, HIGHLANDS"). For display:
// - all caps → each word gets a capital first letter: "Masjid Muswalla, Highlands";
// - anything already in mixed case is returned unchanged, so names like
//   "Nuʿmān Ibn Thābit, Quatre Bornes" keep their spelling and diacritics.
export function formatVenue(raw: string): string {
  const hasLowerCaseLetter = raw !== raw.toUpperCase();
  if (hasLowerCaseLetter) {
    return raw;
  }

  const words = raw.toLowerCase().split(' ');
  const capitalisedWords: string[] = [];
  for (const word of words) {
    if (word.length === 0) {
      capitalisedWords.push(word);
      continue;
    }
    capitalisedWords.push(word[0].toUpperCase() + word.slice(1));
  }
  return capitalisedWords.join(' ');
}
