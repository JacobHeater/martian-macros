/**
 * `items` with the one at `from` moved to `to`, the others keeping their
 * order. The same list when either place is outside it.
 */
export function moved<T>(items: readonly T[], from: number, to: number): readonly T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}
