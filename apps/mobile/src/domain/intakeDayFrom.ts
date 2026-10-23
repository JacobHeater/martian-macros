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
  let hand = 0;
  let palmProtein = 0;
  let estimated = 0;
  for (const e of all) {
    kcal += e.kcal;
    protein += e.proteinG;
    carbs += e.carbsG;
    netCarbs += e.netCarbsG;
    fat += e.fatG;
    if (e.source === 'weighed') weighed += e.kcal;
    if (e.source === 'palm' || e.source === 'cuppedHand' || e.source === 'thumb') hand += e.kcal;
    if (e.source === 'palm') palmProtein += e.proteinG;
    // A meal analysed from a photo is a style of estimating too (MM-586), whatever its numbers cite.
    if (e.source === 'quickAdd' || e.source === 'photoEstimate') estimated += e.kcal;
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
    handShare: kcal <= 0 ? 0 : hand / kcal,
    palmProteinShare: protein <= 0 ? 0 : palmProtein / protein,
    estimatedShare: kcal <= 0 ? 0 : estimated / kcal,
  });
}
