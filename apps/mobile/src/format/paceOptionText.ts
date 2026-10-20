import type { PaceOption } from '../engine/PaceOption';
import { Fmt } from './Fmt';
import { paceConsequence } from './paceConsequence';
import { paceLabel } from './paceLabel';
import { paceName } from './paceName';

/**
 * A fat-loss pace as a choice (MM-128): its name with the percent and the
 * weight a week it means for this person; then what it costs today, the
 * target that results, one sentence of consequence, and whatever limits it,
 * said plainly. A pace that is not offered says why instead.
 */
export function paceOptionText(
  option: PaceOption,
  { weightKg, fmt }: { weightKg: number; fmt: Fmt },
): { label: string; detail: string } {
  const perWeek = fmt.weightDelta(-option.fraction * weightKg);
  const label = `${paceName(option.pace)} · ${paceLabel(option.fraction)} · about ${perWeek.replace(/^[−-]/, '')}`;
  if (!option.offered) {
    const why =
      option.withheld === 'caution'
        ? 'Not offered with your health check or age: the gentle pace is the one the coach will run.'
        : option.withheld === 'bodyFat'
          ? 'Not offered at your body fat: faster loss costs more muscle the leaner you are.'
          : 'Not offered: faster loss is for clearly high body fat, where it costs the least muscle.';
    return { label, detail: why };
  }
  const parts = [
    `About ${Fmt.whole(option.deficitKcal)} kcal a day under your expenditure, for a target of ${Fmt.kcal(option.targetKcal)}.`,
    paceConsequence(option.pace),
  ];
  if (option.limitedBy === 'calorieFloor') {
    parts.push(
      `At your size, your calorie floor limits this to about ${paceLabel(roundPace(option.achievedFraction))}. ` +
        'Choosing it will not lower your target further.',
    );
  } else if (option.limitedBy === 'deficitCap') {
    parts.push(
      `Capped at 35% of your expenditure, which gives about ${paceLabel(roundPace(option.achievedFraction))}.`,
    );
  }
  if (option.aboveFatSupply) parts.push('High for your body fat: more than fat alone can supply in a day, by one model.');
  return { label, detail: parts.join(' ') };
}

/** To the nearest 0.05% a week, so "0.65% a week" rather than "0.6471%". */
function roundPace(fraction: number): number {
  return Math.round(fraction * 2000) / 2000;
}
