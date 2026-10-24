import type { TrendDay } from './TrendDay';
import type { TrendDetection } from './TrendDetection';
import { TrendRule } from './TrendRule';

/**
 * D5, an unlogged weekday (MM-605): the same day of the week left unlogged
 * in at least 3 of the last 4 weeks, each week otherwise logged
 * (`TrendRule.weekday.unloggedMinimumLoggedDays`). Its direction is down
 * and its effect is the count of weeks; δ does not apply. `blocks` are
 * 7-day blocks, most recent first (`weekBlocksOf`). Undefined under 3 weeks.
 */
export function detectUnloggedWeekday(blocks: readonly (readonly TrendDay[])[]): TrendDetection[] | undefined {
  const rule = TrendRule.weekday;
  if (blocks.length < rule.minimumWeeks) return undefined;
  const recent = blocks.slice(0, rule.unloggedOf);
  const logged = (d: TrendDay) => d.value !== undefined && d.reason !== 'unlogged';
  let best: { weekday: number; count: number } = { weekday: 0, count: -1 };
  for (let weekday = 0; weekday < 7; weekday++) {
    let count = 0;
    for (const block of recent) {
      const day = block.find((d) => d.date.weekday === weekday);
      if (day !== undefined && !logged(day) && block.filter(logged).length >= rule.unloggedMinimumLoggedDays) count += 1;
    }
    if (count > best.count) best = { weekday, count };
  }
  const onset = recent[recent.length - 1]?.[0]?.date;
  const days = recent.reduce((sum, block) => sum + block.filter(logged).length, 0);
  const down: TrendDetection = {
    detector: 'unloggedWeekday',
    direction: 'down',
    fires: best.count >= rule.unlogged,
    strong: false,
    ratio: best.count / rule.unlogged,
    effect: best.count,
    n: recent.length,
    k: best.count,
    days,
    onset,
    weekday: best.weekday,
  };
  return [down, { ...down, direction: 'up', fires: false, ratio: 0, effect: 0, k: 0 }];
}
