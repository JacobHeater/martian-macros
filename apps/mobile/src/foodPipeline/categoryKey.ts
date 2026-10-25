/**
 * A source category as the food group table looks it up (MM-616): lower
 * case, with hyphens and dashes read as spaces and runs of spaces as one, so
 * the USDA's "Fish  Prepared/Processed", "Fish - Prepared/Processed" and
 * "Fish – Prepared/Processed" are one category.
 */
export function categoryKey(category: string): string {
  return category
    .toLowerCase()
    .replaceAll(/[-‐-―]/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}
