import type { CoachTrade, CoachTradeFood } from '../engine';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { Fmt } from './Fmt';
import { portionText } from './portionText';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/** Y's calories against X's in words: "90 kcal fewer each time", "40 kcal more", or "about the same calories". */
const deltaText = (kcal: number, today: boolean) => {
  const rounded = whole(kcal);
  if (rounded === 0) return 'about the same calories';
  return `${Fmt.kcal(Math.abs(rounded))} ${rounded > 0 ? 'more' : 'fewer'}${today ? '' : ' each time'}`;
};

/** Where the person logs Y: "at breakfast", "as a snack". */
const whereText = (trade: CoachTrade) =>
  trade.meal === undefined ? '' : trade.meal === 'snack' ? ' as a snack' : ` at ${trade.meal}`;

/** A side's name with the usual portion the trade picked: "Granola (1 × 1 cup · 80 g)", or the name alone. */
const named = (side: CoachTradeFood) => {
  const portion = portionText(side.portion);
  const amount =
    portion !== undefined && portion !== 'Estimated totals'
      ? portion
      : side.grams !== undefined && side.grams > 0
        ? `${whole(side.grams)} g`
        : undefined;
  return amount === undefined ? side.name : `${side.name} (${amount})`;
};

const sodiumOf = (side: CoachTradeFood) => `${Fmt.whole(side.sodiumMg ?? 0)} mg sodium`;

/**
 * MM-607's trade sentence, past or conditional and about the person's own
 * log: X as eaten, Y as the person logs it (or "a food you haven't logged"
 * from the catalog), each at the usual portion, and what the trade would
 * have changed a day. On 1d (MM-612) it speaks of today only. Nothing is
 * called good or bad; "trade" is the verb, and both foods are named in it.
 *
 * - A sodium trade states both foods' sodium.
 * - A calorie trade says the calories a day and that protein is no lower,
 *   with no change a time beside it.
 * - "It is calorie-dense for its protein" is left out when the finding
 *   already says it (`densityStated`, the calorie-density finding).
 */
export function coachTradeText(
  trade: CoachTrade,
  { spanDays, today, densityStated = false }: { spanDays: number; today: boolean; densityStated?: boolean },
): string {
  const { x, y, motive } = trade;
  const xFigures =
    motive === 'sodium'
      ? `${Fmt.kcal(x.kcal)} with ${sodiumOf(x)}`
      : `${Fmt.kcal(x.kcal)} with ${Fmt.grams(x.proteinG)} protein and ${Fmt.grams(x.fatG)} fat`;
  const xLine = today ? `${named(x)}: ${xFigures}.` : `${named(x)} on ${trade.days} of ${spanDays} days: ${xFigures}.`;
  const dense = motive === 'protein' && !densityStated ? ' It is calorie-dense for its protein.' : '';
  const source = trade.source === 'catalog' ? `${named(y)}, a food you haven't logged,` : `${named(y)}, which you log${whereText(trade)},`;
  const gives =
    motive === 'fat'
      ? ` has ${Fmt.grams(y.fatG)} fat in ${Fmt.kcal(y.kcal)}.`
      : motive === 'sodium'
        ? ` has ${sodiumOf(y)} in ${Fmt.kcal(y.kcal)}.`
        : ` gives ${Fmt.grams(y.proteinG)} protein in ${Fmt.kcal(y.kcal)}.`;
  const gain = whole(trade.gainPerDay);
  const trading = `Trading ${x.name} for ${y.name}`;
  const at = deltaText(trade.deltaKcal, today);
  const what = motive === 'fat' ? `${gain} g less fat` : `${Fmt.whole(gain)} mg less sodium`;
  const result =
    motive === 'protein'
      ? today
        ? ` ${trading} adds about ${gain} g of protein, at ${at}.`
        : ` ${trading} on those days would have added about ${gain} g of protein a day, at ${at}.`
      : motive === 'calories'
        ? today
          ? ` ${trading} means about ${Fmt.kcal(gain)} less today, with protein no lower.`
          : ` ${trading} on those days would have meant about ${Fmt.kcal(gain)} less a day, with protein no lower.`
        : today
          ? ` ${trading} means about ${what} today, at ${at}.`
          : ` ${trading} on those days would have meant about ${what} a day, at ${at}.`;
  return `${xLine}${dense} ${source}${gives}${result}`;
}
