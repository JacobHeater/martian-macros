import type { CalendarDate } from '../../../domain/CalendarDate';
import type { CoachFinding } from '../CoachFinding';
import type { CoachAdviceGiven } from './CoachAdviceGiven';

/**
 * What the coach's record keeps of the findings the Coach tab shows today
 * (MM-617): every order about a food to skip, halve or swap (1d and span
 * alike), with its replacement's name and the food's calories a time, and
 * every advice taken said (`taken`, with the calories saved), so it is said
 * once. One for each food key and kind, the first shown.
 */
export function coachAdviceGivenOf(findings: readonly CoachFinding[], today: CalendarDate): CoachAdviceGiven[] {
  const out = new Map<string, CoachAdviceGiven>();
  const keep = (g: CoachAdviceGiven) => {
    const id = `${g.kind}\u0000${g.foodKey}`;
    if (!out.has(id)) out.set(id, g);
  };
  for (const finding of findings) {
    for (const a of finding.advice ?? []) {
      if (a.food === undefined || (a.kind !== 'skip' && a.kind !== 'halve' && a.kind !== 'swap')) continue;
      keep({
        foodKey: a.food.key,
        foodName: a.food.name,
        kind: a.kind,
        replacementName: a.kind === 'swap' ? a.replacement?.name : undefined,
        kcal: a.food.kcal,
        on: today,
      });
    }
    for (const f of finding.followUps ?? []) {
      if (f.kind !== 'adviceTaken' || f.food === undefined) continue;
      keep({ foodKey: f.food.key, foodName: f.food.name, kind: 'taken', replacementName: undefined, kcal: f.savedKcal ?? 0, on: today });
    }
  }
  return [...out.values()];
}
