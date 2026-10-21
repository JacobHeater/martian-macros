/**
 * A change in a lift's estimate said in words, with no figure (MM-118): a
 * bodyweight lift's estimate carries the body weight, so with the weight
 * hidden its change is "up", "down" or "about the same", never an amount.
 */
export function liftChangeWords(changeKg: number): string {
  if (changeKg >= 0.5) return 'up';
  if (changeKg <= -0.5) return 'down';
  return 'about the same';
}
