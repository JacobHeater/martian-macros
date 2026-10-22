import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import { explainWeightJump } from '../engine/explainWeightJump';
import type { WeightJumpExplanation } from '../engine/WeightJumpExplanation';
import { WeightJumpRule } from '../engine/WeightJumpRule';
import { weightJumpWithheld } from '../engine/weightJumpWithheld';

/** The days of food read for an explanation: the days searched and the days that make up the usual. */
const foodDays = WeightJumpRule.lookBackDays + WeightJumpRule.usualDays;

/**
 * Why the weigh-in on `date` is far from the trend (MM-142), from the
 * person's own log, kept current; undefined with no date, a reading inside
 * the day-to-day noise, or when the explanation is kept back
 * (`weightJumpWithheld`).
 */
export function useWeightJump(date: CalendarDate | undefined): WeightJumpExplanation | undefined {
  const { state } = useApp();
  const coach = useCell(state.coach);
  const weights = useLoaded(state.weights) ?? [];
  const intake = useLoaded(state.intakeDays) ?? [];
  const workouts = useLoaded(state.workouts) ?? [];
  const flowDays = useLoaded(state.flowDays) ?? [];
  const weightEvents = useLoaded(state.weightEvents) ?? [];
  const history = useLoaded(state.targetsHistory) ?? [];
  // Yesterday is judged against its own target under a shaped week (MM-124).
  const shapes = useLoaded(state.targetShapes) ?? [];
  const limits = useCell(state.targetShapeLimits);
  const safeguards = useCell(state.insightSafeguards);
  // The same number of cells is read on every draw, whatever the date.
  const through = date ?? state.today.value;
  const entries: FoodEntry[] = [];
  for (let daysAgo = 1; daysAgo <= foodDays; daysAgo++) {
    entries.push(...(useLoaded(state.foodForDay(through.addDays(-daysAgo))) ?? []));
  }
  if (date === undefined || coach === undefined || safeguards === undefined || weightJumpWithheld(safeguards)) return undefined;
  const reading = weights.find((w) => w.date === date);
  if (reading === undefined) return undefined;
  return explainWeightJump({
    reading,
    trend: coach.trend,
    intake,
    entries,
    workouts,
    flowDays,
    weightEvents,
    history,
    shapes,
    limits,
  });
}
