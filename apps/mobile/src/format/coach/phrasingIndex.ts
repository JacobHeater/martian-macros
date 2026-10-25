/**
 * Which of `count` phrasings a key gets (MM-617): FNV-1a over the key's
 * UTF-16 code units, so the same key always reads the same, and a key one
 * character apart (another day, another finding) usually reads another.
 * Not random and not stored: the same day reads the same on every phone.
 */
export function phrasingIndex(key: string, count: number): number {
  if (count <= 1) return 0;
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % count;
}
