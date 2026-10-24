import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendDay } from './TrendDay';
import type { TrendDetection } from './TrendDetection';
import { TrendRule } from './TrendRule';

/**
 * D5, an unlogged weekday (MM-605, with MM-614's rule): the same day of the
 * week left unlogged in at least 3 of the last 4 weeks, each of those weeks
 * with at least 5 logged days (`TrendRule.weekday.unloggedMinimumLoggedDays`),
 * and that weekday more than half of the unlogged days in the 4 weeks. A
 * weekday that collected 3 of 8 random gaps is not a habit. A day before the
 * first log is not a gap: `firstLogged` is the first logged day of the whole
 * series, or, when left out, the first in `blocks`.
 *
 * Its direction is down and its effect is the count of weeks; δ does not
 * apply. `blocks` are 7-day blocks, most recent first (`weekBlocksOf`).
 * Undefined under 3 weeks.
 */
export function detectUnloggedWeekday(
  blocks: readonly (readonly TrendDay[])[],
  firstLogged?: CalendarDate,
): TrendDetection[] | undefined {
  const rule = TrendRule.weekday;
  if (blocks.length < rule.minimumWeeks) return undefined;
  const recent = blocks.slice(0, rule.unloggedOf);
  const logged = (d: TrendDay) => d.value !== undefined && d.reason !== 'unlogged';
  const first =
    firstLogged ??
    blocks
      .flat()
      .filter(logged)
      .reduce<CalendarDate | undefined>((f, d) => (f === undefined || d.date.isBefore(f) ? d.date : f), undefined);
  const gap = (d: TrendDay) => !logged(d) && first !== undefined && !d.date.isBefore(first);
  const gaps = recent.reduce((sum, block) => sum + block.filter(gap).length, 0);
  let best: { weekday: number; count: number } = { weekday: 0, count: -1 };
  for (let weekday = 0; weekday < 7; weekday++) {
    let count = 0;
    for (const block of recent) {
      const day = block.find((d) => d.date.weekday === weekday);
      if (day !== undefined && gap(day) && block.filter(logged).length >= rule.unloggedMinimumLoggedDays) count += 1;
    }
    if (count > best.count) best = { weekday, count };
  }
  const onset = recent[recent.length - 1]?.[0]?.date;
  const days = recent.reduce((sum, block) => sum + block.filter(logged).length, 0);
  const down: TrendDetection = {
    detector: 'unloggedWeekday',
    direction: 'down',
    fires: best.count >= rule.unlogged && best.count * 2 > gaps,
    strong: false,
    // Both gates as one ratio: the weeks over 3, and twice the weekday's gaps over the gaps plus one (more than half).
    ratio: Math.min(best.count / rule.unlogged, (2 * best.count) / (gaps + 1)),
    effect: best.count,
    n: recent.length,
    k: best.count,
    days,
    onset,
    weekday: best.weekday,
  };
  return [down, { ...down, direction: 'up', fires: false, ratio: 0, effect: 0, k: 0 }];
}
