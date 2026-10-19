import type { CalendarDate } from './CalendarDate';
import { dailyRelativeSigma } from './dailyRelativeSigma';
import type { DayCompleteness } from './DayCompleteness';
import type { FoodEntry } from './FoodEntry';
import { IntakeDay } from './IntakeDay';

/** Aggregates one day's entries into the engine's intake observation. */
export function intakeDayFrom(
  date: CalendarDate,
  entries: Iterable<FoodEntry>,
  { completeness = 'unmarked' }: { completeness?: DayCompleteness } = {},
): IntakeDay {
  const all = [...entries];
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let netCarbs = 0;
  let fat = 0;
  let weighed = 0;
  let estimated = 0;
  for (const e of all) {
    kcal += e.kcal;
    protein += e.proteinG;
    carbs += e.carbsG;
    netCarbs += e.netCarbsG;
    fat += e.fatG;
    if (e.source === 'weighed') weighed += e.kcal;
    if (e.source === 'quickAdd') estimated += e.kcal;
  }
  return new IntakeDay({
    date,
    kcal,
    proteinG: protein,
    carbsG: carbs,
    netCarbsG: netCarbs,
    fatG: fat,
    completeness,
    relativeSigma: dailyRelativeSigma(all.map((e) => [e.kcal, e.source] as const)),
    weighedShare: kcal <= 0 ? 0 : weighed / kcal,
    estimatedShare: kcal <= 0 ? 0 : estimated / kcal,
  });
}
