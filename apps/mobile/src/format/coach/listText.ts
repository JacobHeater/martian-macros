/**
 * A list in a sentence (MM-617's grammar): "A", "A and B", "A, B and C".
 * No serial comma, as the app writes everywhere. Empty is "".
 */
export function listText(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
