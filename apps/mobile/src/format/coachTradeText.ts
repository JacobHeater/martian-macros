import type { CoachTrade } from '../engine';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { Fmt } from './Fmt';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/** A signed change in calories with a true minus, or "about the same calories" once it rounds to zero. */
const deltaText = (kcal: number) => {
  const rounded = whole(kcal);
  if (rounded === 0) return 'about the same calories';
  return `${rounded > 0 ? '+' : '−'}${Fmt.kcal(Math.abs(rounded))} a time`;
};

/** Where the person logs Y: "at breakfast", "as a snack". */
const whereText = (trade: CoachTrade) =>
  trade.meal === undefined ? '' : trade.meal === 'snack' ? ' as a snack' : ` at ${trade.meal}`;

/**
 * MM-607's trade sentence, past or conditional and about the person's own
 * log: X as eaten, Y as the person logs it (or "a food you haven't logged"
 * from the catalog), and what the trade would have changed a day. On 1d
 * (MM-612) it speaks of today only. Nothing is called good or bad; "trade"
 * is the verb.
 */
export function coachTradeText(trade: CoachTrade, { spanDays, today }: { spanDays: number; today: boolean }): string {
  const { x, y } = trade;
  const xLine = today
    ? `${x.name}: ${Fmt.kcal(x.kcal)} with ${Fmt.grams(x.proteinG)} protein and ${Fmt.grams(x.fatG)} fat.`
    : `${x.name} on ${trade.days} of ${spanDays} days: ${Fmt.kcal(x.kcal)} with ${Fmt.grams(x.proteinG)} protein and ${Fmt.grams(x.fatG)} fat.`;
  const dense = trade.motive === 'protein' ? ' It is calorie-dense for its protein.' : '';
  const source = trade.source === 'catalog' ? `${y.name}, a food you haven't logged,` : `${y.name}, which you log${whereText(trade)},`;
  const gives =
    trade.motive === 'fat'
      ? ` has ${Fmt.grams(y.fatG)} fat in ${Fmt.kcal(y.kcal)}.`
      : ` gives ${Fmt.grams(y.proteinG)} protein in ${Fmt.kcal(y.kcal)}.`;
  const gain = whole(trade.gainPerDay);
  const what =
    trade.motive === 'fat'
      ? `${gain} g less fat`
      : trade.motive === 'sodium'
        ? `${Fmt.whole(gain)} mg less sodium`
        : `${Fmt.kcal(gain)} less, with protein no lower`;
  const at = deltaText(trade.deltaKcal);
  const result =
    trade.motive === 'protein'
      ? today
        ? ` Trading it adds about ${gain} g of protein, at ${at}.`
        : ` Trading it on those days would have added about ${gain} g of protein a day, at ${at}.`
      : today
        ? ` Trading it means about ${what} today, at ${at}.`
        : ` Trading it on those days would have meant about ${what} a day, at ${at}.`;
  return `${xLine}${dense} ${source}${gives}${result}`;
}
