/** The whole numbers from 0 up to but not including `count`. */
export function upTo(count: number): number[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => i);
}
