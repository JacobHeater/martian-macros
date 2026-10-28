import type { CalendarDate } from '../../domain/CalendarDate';
import { hasHardSet } from '../hasHardSet';
import type { TrendSpan } from '../trends/TrendSpan';
import type { TrainingAnalysisInput } from './TrainingAnalysisInput';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';
import type { UnjudgedArea } from './UnjudgedArea';

/**
 * The areas of MM-609 that a span ending on `asOf` is too short to judge,
 * for MM-610's "Not enough data in this span" ("Training · needs 4
 * weeks"). An area is named only when its log is in use: training once a
 * session is logged, strength on a goal that reads it, water once water is
 * logged and the water line could be said at all; and training also once
 * the wearable's cardio or steps have arrived on a fat-loss or recomp goal
 * (MM-678), whose holding-up lines need 4 weeks.
 */
export function unjudgedTrainingAreas(input: TrainingAnalysisInput, span: TrendSpan, asOf: CalendarDate): UnjudgedArea[] {
  const needs = TrainingAnalysisRule.needsDays;
  const areas: UnjudgedArea[] = [];
  const trained = input.workouts.some((w) => !w.inProgress && !w.date.isAfter(asOf) && hasHardSet(w));
  const restricted = input.safeguards.eatingDisorderHistory || input.safeguards.underEating;
  const longest = (days: readonly number[]) => Math.max(...days.filter((d) => d > span), 0);
  const goalMode = input.setup.goalMode;
  const cardioInUse = (goalMode === 'fatLoss' || goalMode === 'recomp') && (input.cardio.length > 0 || input.steps.length > 0);
  if (!trained && cardioInUse && span < needs.cardioHoldingUp) areas.push({ area: 'training', needsDays: needs.cardioHoldingUp });
  if (trained) {
    const training = longest([
      needs.lapseHoldingUp,
      needs.trainingDays,
      needs.rirUnrecorded,
      needs.proteinByTrainingDay,
      ...(restricted ? [] : [needs.trainingDropped, needs.setsPerMuscle]),
      ...(cardioInUse ? [needs.cardioHoldingUp] : []),
    ]);
    if (training > 0) areas.push({ area: 'training', needsDays: training });
    const goal = input.setup.goalMode;
    if (goal !== 'recomp' && span < needs.strength) {
      // On fat loss with an eating-disorder history only the falling lifts are read, over 3 weeks.
      const strength = goal === 'fatLoss' && restricted ? longest([needs.strengthFalling]) : needs.strength;
      if (strength > 0) areas.push({ area: 'strength', needsDays: strength });
    }
  }
  const water = input.water.some((e) => !e.date.isAfter(asOf));
  if (water && !restricted && input.waterGoal?.suggestedMl !== undefined && span < needs.waterOnTrainingDays) {
    areas.push({ area: 'water', needsDays: needs.waterOnTrainingDays });
  }
  return areas;
}
