import { MuscleGroup } from '../domain/training/MuscleGroup';
import type { ItemInsight } from '../engine/ItemInsight';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { muscleGroupLabel } from './muscleGroupLabel';

type Evidence = readonly (readonly [label: string, value: string])[];

/** Sets as weekly volume shows them: a half where a muscle a lift also works was counted. */
const sets = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

/**
 * The fixed words of each kind of inline insight (MM-362), filled from the
 * insight's own figures: one line, a fact and then a general direction,
 * and "The numbers behind this" as label and value pairs. Undefined for a
 * kind with no words, which is then not shown. Nothing praises eating
 * less, names a food or the person in moral words, compares with other
 * people, or claims an injury (the panel's SA-5).
 */
export function itemInsightText(insight: ItemInsight): { line: string; evidence: Evidence } | undefined {
  const figure = (key: string) => insight.figures[key] ?? 0;
  switch (insight.kind) {
    case 'volumeJump': {
      const group = muscleGroupLabel(MuscleGroup.values[figure('group')] ?? 'chest');
      const week = sets(figure('weekSets'));
      const usual = roundHalfAwayFromZero(figure('usualSets')) + 0;
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
    default:
      return undefined;
  }
}
