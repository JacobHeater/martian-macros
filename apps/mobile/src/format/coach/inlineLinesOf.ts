/**
 * The model's answer to the day's inline lines (MM-687), read line by
 * line: each line starts with the item's number and a period or bracket;
 * the words after it are the line. A number said twice keeps the first.
 */
export function inlineLinesOf(text: string): ReadonlyMap<number, string> {
  const lines = new Map<number, string>();
  for (const match of text.matchAll(/^\s*(\d+)[.)]\s*(.+?)\s*$/gm)) {
    const number = Number(match[1]);
    const words = match[2] ?? '';
    if (!lines.has(number) && words !== '') lines.set(number, words);
  }
  return lines;
}
