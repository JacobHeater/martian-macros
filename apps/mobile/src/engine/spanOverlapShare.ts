/**
 * The share of the shorter of two spans (in milliseconds) that `a` and `b`
 * overlap, 0 when either has no length (MM-490): how the same session
 * recorded twice is told.
 */
export function spanOverlapShare(a: { start: number; end: number }, b: { start: number; end: number }): number {
  const shorter = Math.min(a.end - a.start, b.end - b.start);
  if (!(shorter > 0)) return 0;
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start)) / shorter;
}
