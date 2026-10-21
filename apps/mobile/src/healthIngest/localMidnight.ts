/** Midnight, local time, at the start of the day `at` falls on. */
export function localMidnight(at: Date): Date {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate());
}
