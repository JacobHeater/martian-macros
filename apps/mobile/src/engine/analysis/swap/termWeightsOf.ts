/**
 * A name's TF-IDF vector over a pool of names (MM-617), of unit length:
 * each term's count in the name times its smoothed inverse document
 * frequency, ln((1 + N) / (1 + df)) + 1, so a word rare across the pool
 * weighs more than one most names share. A term no name of the pool has
 * is left out, as a vocabulary leaves out a word it has not seen; a name
 * with no term of the pool gives an empty vector.
 */
export function termWeightsOf(
  terms: readonly string[],
  documentFrequency: ReadonlyMap<string, number>,
  poolSize: number,
): ReadonlyMap<string, number> {
  const raw = new Map<string, number>();
  for (const term of terms) {
    const df = documentFrequency.get(term) ?? 0;
    if (df === 0) continue;
    const idf = Math.log((1 + poolSize) / (1 + df)) + 1;
    raw.set(term, (raw.get(term) ?? 0) + idf);
  }
  let squares = 0;
  for (const weight of raw.values()) squares += weight * weight;
  const length = Math.sqrt(squares);
  const weights = new Map<string, number>();
  if (!(length > 0)) return weights;
  for (const [term, weight] of raw) weights.set(term, weight / length);
  return weights;
}
