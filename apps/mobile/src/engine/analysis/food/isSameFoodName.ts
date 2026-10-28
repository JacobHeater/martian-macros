const smallWords = new Set(['a', 'an', 'the', 'of', 'and', 'with', 'in', 'original', 'brand', 'style']);

function tokensOf(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .split(/[^a-z0-9%]+/)
      .filter((word) => word.length > 1 && !smallWords.has(word)),
  );
}

/**
 * Whether two names name the same food (MM-674): the same words, or every
 * telling word of the shorter in the longer, so a catalog's "Just Bare
 * lightly breaded chicken breast original fillet" is the person's "Just
 * Bare Lightly Breaded Chicken Breast Fillet". Two words at least, so
 * "chicken" alone matches nothing.
 */
export function isSameFoodName(a: string, b: string): boolean {
  const left = tokensOf(a);
  const right = tokensOf(b);
  const [shorter, longer] = left.size <= right.size ? [left, right] : [right, left];
  if (shorter.size < 2) return shorter.size === longer.size && [...shorter].every((word) => longer.has(word));
  return [...shorter].every((word) => longer.has(word));
}
