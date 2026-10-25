import { Fmt } from '../Fmt';

/**
 * A count with its noun, singular or plural (MM-617's grammar): "1 day",
 * "3 days", "1,054 sets". `many` defaults to the noun with an "s".
 */
export function pluralText(count: number, one: string, many = `${one}s`): string {
  const whole = Fmt.whole(count);
  return `${whole} ${whole === '1' ? one : many}`;
}
