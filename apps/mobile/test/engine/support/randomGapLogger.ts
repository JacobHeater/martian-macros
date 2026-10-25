import type { CalendarDate } from '../../../src/domain';
import type { TrendDay } from '../../../src/engine';
import { DartRandom } from '../../support/DartRandom';

/**
 * A person who leaves 2 random days of every week unlogged and has no
 * weekday habit (MM-605). Weeks run from `start`. Deterministic for a seed.
 */
export function randomGapLogger(seed: number, start: CalendarDate, days: number): TrendDay[] {
  const random = new DartRandom(seed);
  const gaps = new Set<number>();
  for (let week = 0; week * 7 < days; week++) {
    const first = random.nextInt(7);
    let second = random.nextInt(6);
    if (second >= first) second += 1;
    gaps.add(week * 7 + first);
    gaps.add(week * 7 + second);
  }
  return Array.from({ length: days }, (_, i): TrendDay => {
    const date = start.addDays(i);
    if (gaps.has(i)) return { date, value: undefined, eligible: false, reason: 'unlogged' };
    return { date, value: 2000 + 300 * (random.nextDouble() - 0.5), eligible: true, reason: undefined };
  });
}
