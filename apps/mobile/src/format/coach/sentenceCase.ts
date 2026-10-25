/**
 * A sentence that starts with a capital (MM-617's grammar), however its
 * first word came in: a food named mid-sentence ("cookie butter: 170 kcal")
 * is capitalized when it opens one. Only the first letter changes, so
 * "General Tso's" keeps the rest of its case; a sentence that opens with a
 * number ("1,054 kcal over.", "4.8 g protein") is left as it is.
 */
export function sentenceCase(text: string): string {
  const at = text.search(/[A-Za-z0-9]/);
  if (at < 0 || !/[A-Za-z]/.test(text.charAt(at))) return text;
  return `${text.slice(0, at)}${text.charAt(at).toUpperCase()}${text.slice(at + 1)}`;
}
