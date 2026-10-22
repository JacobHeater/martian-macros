import { CalendarDate } from '../domain/CalendarDate';
import { MuscleGroup } from '../domain/training/MuscleGroup';
import type { ItemInsight } from '../engine/ItemInsight';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { Fmt } from './Fmt';
import { muscleGroupLabel } from './muscleGroupLabel';
import { waistAmount } from './waistAmount';
import { waterAmount } from './waterAmount';

type Evidence = readonly (readonly [label: string, value: string])[];

/** Sets as weekly volume shows them: a half where a muscle a lift also works was counted. */
const sets = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

const whole = (n: number) => `${roundHalfAwayFromZero(n) + 0}`;
const percent = (share: number) => `${roundHalfAwayFromZero(share * 100) + 0}%`;
const servings = (n: number) => (n === 1 ? '1 serving' : `${whole(n)} servings`);

/**
 * The fixed words of each kind of inline insight (MM-362), filled from the
 * insight's own figures: one line, a fact and then a general direction,
 * and "The numbers behind this" as label and value pairs. Undefined for a
 * kind with no words, which is then not shown. Nothing praises eating
 * less, names a food or the person in moral words, compares with other
 * people, suggests eating less of anything, or claims an injury (the
 * panel's SA-5, SA-8; the owner's "swap or add, never eat less").
 */
export function itemInsightText(insight: ItemInsight, fmt: Fmt): { line: string; evidence: Evidence } | undefined {
  const figure = (key: string) => insight.figures[key] ?? 0;
  const has = (key: string) => insight.figures[key] !== undefined;
  const units = fmt.imperial ? 'imperial' : 'metric';
  switch (insight.kind) {
    case 'mostlyFat':
      return {
        line:
          `Most of this food’s calories come from fat (${percent(figure('fatShare'))}). ` +
          'A protein food alongside balances the meal.',
        evidence: [
          ['Fat', `${whole(figure('fatG'))} g, ${percent(figure('fatShare'))} of calories`],
          ['Protein', `${whole(figure('proteinG'))} g`],
          ['Calories', whole(figure('kcal'))],
        ],
      };
    case 'lightOnProtein':
      return {
        line: `${whole(figure('proteinG'))} g of protein in ${whole(figure('kcal'))} kcal. A protein food alongside is the easiest way to add some.`,
        evidence: [
          ['Protein', `${whole(figure('proteinG'))} g, ${percent(figure('proteinG') * 4 / Math.max(1, figure('kcal')))} of calories`],
          ['Calories', whole(figure('kcal'))],
          ...(has('proteinMinimumG') ? [['Your protein minimum', `${whole(figure('proteinMinimumG'))} g a day`] as const] : []),
        ],
      };
    case 'portionCheck': {
      const serving = has('servingGrams') ? `; one serving is ${whole(figure('servingGrams'))} g` : '';
      return {
        line: `Logged as ${servings(figure('servings'))} (${whole(figure('kcal'))} kcal)${serving}. Right as logged? If not, the amount can be edited.`,
        evidence: [
          ['Logged', `${servings(figure('servings'))}, ${whole(figure('kcal'))} kcal`],
          ...(has('servingGrams') ? [['One serving', `${whole(figure('servingGrams'))} g`] as const] : []),
        ],
      };
    }
    case 'volumeJump': {
      const group = muscleGroupLabel(MuscleGroup.values[figure('group')] ?? 'chest');
      const week = sets(figure('weekSets'));
      const usual = whole(figure('usualSets'));
      const when = figure('inProgress') === 1 ? 'in the 7 days before this workout' : 'in the 7 days to this workout';
      return {
        line:
          `${week} sets for ${group.toLowerCase()} ${when}. Your usual is about ${usual} a week. A jump this big ` +
          'can bring more soreness; adding sets more slowly is easier to recover from.',
        evidence: [
          [`Sets for ${group.toLowerCase()}, ${figure('inProgress') === 1 ? '7 days before' : '7 days to'} this workout`, week],
          ['Usual week, the 4 weeks before', `About ${usual}`],
          ['Counted', 'Hard sets of finished workouts; half for a muscle a lift also works'],
        ],
      };
    }
    case 'strengthOnFatLoss': {
      const weeks = whole(figure('weeks'));
      const up = figure('up') === 1;
      const fact = up
        ? `Your strength on this lift has gone up during ${weeks} weeks on your fat-loss goal.`
        : `Your strength on this lift has held through ${weeks} weeks on your fat-loss goal.`;
      // Beside the progression suggestion of a workout in progress, the fact alone (the panel's TR-3).
      const direction = figure('inProgress') === 1 ? '' : up ? ' Your training is doing more than holding it.' : ' Keeping it is the aim right now, and your training is doing that.';
      return {
        line: fact + direction,
        evidence: [
          ['Estimated max, smoothed, at the start', fmt.load(figure('fromKg'))],
          ['Now, smoothed', fmt.load(figure('toKg'))],
          ['Counted as held down to', fmt.load(figure('heldDownToKg'))],
          ['Sessions', `${whole(figure('sessions'))} in ${weeks} weeks`],
          ['Fat-loss targets in force since', Fmt.shortDay(CalendarDate.fromEpochDay(figure('startEpochDay')))],
        ],
      };
    }
    case 'waistWithinNoise':
      return {
        line: `About the same as 4 weeks ago. A difference under ${waistAmount(figure('thresholdCm'), fmt)} is within what a tape can tell.`,
        evidence: [
          ['4 weeks ago, smoothed', waistAmount(figure('fromCm'), fmt)],
          ['Now, smoothed', waistAmount(figure('toCm'), fmt)],
          ['A change has to pass', waistAmount(figure('thresholdCm'), fmt)],
          ['This reading, and the one before', `${waistAmount(figure('latestCm'), fmt)}, ${waistAmount(figure('previousCm'), fmt)}`],
        ],
      };
    case 'waterFewDays':
      return {
        line: `Water logged on ${whole(figure('daysWithWater'))} of the last ${whole(figure('windowDays'))} days. Add a glass here logs one in a tap.`,
        evidence: [
          ['Days with water logged', `${whole(figure('daysWithWater'))} of ${whole(figure('windowDays'))}`],
          ['Your goal', `${waterAmount(figure('goalMl'), units)} a day (${figure('suggested') === 1 ? 'suggested for you' : 'your own'})`],
        ],
      };
    default:
      return undefined;
  }
}
