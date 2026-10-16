/** How many whole days were logged, when too few for the coach (MM-332): none, one, or only some. */
export function wholeDaysLogged(days: number): string {
  if (days === 0) return 'no whole days were logged';
  if (days === 1) return 'only 1 whole day was logged';
  return `only ${days} whole days were logged`;
}
