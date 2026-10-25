import type { CoachTrade, CoachTradeFood } from '../../engine';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { Fmt } from '../Fmt';
import { portionText } from '../portionText';
import { coachPhrase } from './coachPhrase';
import { foodInSentence } from './foodInSentence';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/** Y's calories against X's: "90 kcal fewer each time", "40 kcal more", or "about the same calories". */
const deltaText = (kcal: number, today: boolean) => {
  const rounded = whole(kcal);
  if (rounded === 0) return 'about the same calories';
  return `${Fmt.kcal(Math.abs(rounded))} ${rounded > 0 ? 'more' : 'fewer'}${today ? '' : ' each time'}`;
};

/** Where the person logs Y: " at breakfast", " as a snack". */
const whereText = (trade: CoachTrade) => (trade.meal === undefined ? '' : trade.meal === 'snack' ? ' as a snack' : ` at ${trade.meal}`);

/** A side's name with the usual portion the trade picked: "Granola (80 g)", or the name alone. */
const named = (side: CoachTradeFood, start: boolean) => {
  const portion = portionText(side.portion);
  const amount =
    portion !== undefined && portion !== 'Estimated totals'
      ? portion
      : side.grams !== undefined && side.grams > 0
        ? `${whole(side.grams)} g`
        : undefined;
  const name = start ? side.name : foodInSentence(side.name);
  return amount === undefined ? name : `${name} (${amount})`;
};

/** A side's figures by the trade's motive: sodium for a sodium trade, else calories, protein and fat. */
const figuresOf = (side: CoachTradeFood, motive: CoachTrade['motive']) =>
  motive === 'sodium'
    ? `${Fmt.kcal(side.kcal)}, ${Fmt.whole(side.sodiumMg ?? 0)} mg sodium`
    : `${Fmt.kcal(side.kcal)}, ${Fmt.grams(side.proteinG)} protein, ${Fmt.grams(side.fatG)} fat`;

/**
 * MM-607's trade as an order (MM-617), in the coach's voice: X as eaten
 * and how often, "Swap it for" Y (as the person logs it, or "a food you
 * haven't logged" from the catalog), each at the usual portion, then what
 * it would change a day. On 1d (MM-612) it speaks of today only.
 *
 * - A sodium trade states both foods' sodium.
 * - A calorie trade says the calories a day and that protein is no lower.
 * - "Calorie-dense for its protein" is said of a protein trade's X unless
 *   the finding already says it (`densityStated`, the calorie-density line).
 * - `key` picks the phrasings (`coachPhrase`): a finding and its day.
 */
export function coachTradeText(
  trade: CoachTrade,
  {
    spanDays,
    today,
    densityStated = false,
    key = `${trade.x.name}|${trade.y.name}`,
  }: { spanDays: number; today: boolean; densityStated?: boolean; key?: string },
): string {
  const { x, y, motive } = trade;
  const xValues = { x: named(x, true), figures: figuresOf(x, motive) };
  const xLine = today
    ? coachPhrase('tradeX', key, xValues)
    : coachPhrase('tradeXDays', key, { ...xValues, days: `${trade.days}`, span: `${spanDays}` });
  const dense = motive === 'protein' && !densityStated ? [coachPhrase('calorieDenseVerdict', key)] : [];
  const yValues = { y: named(y, false), figures: figuresOf(y, motive), where: whereText(trade) };
  const swap = trade.source === 'catalog' ? coachPhrase('tradeCatalog', key, yValues) : coachPhrase('tradeLogged', key, yValues);
  const gain = whole(trade.gainPerDay);
  const delta = deltaText(trade.deltaKcal, today);
  const result =
    motive === 'protein'
      ? coachPhrase(today ? 'tradeProteinToday' : 'tradeProtein', key, { gain: `${gain} g`, delta })
      : motive === 'calories'
        ? coachPhrase(today ? 'tradeCaloriesToday' : 'tradeCalories', key, { gain: Fmt.kcal(gain) })
        : coachPhrase(today ? 'tradeOtherToday' : 'tradeOther', key, {
            what: motive === 'fat' ? `${gain} g less fat` : `${Fmt.whole(gain)} mg less sodium`,
            delta,
          });
  return [xLine, ...dense, swap, result].join(' ');
}
