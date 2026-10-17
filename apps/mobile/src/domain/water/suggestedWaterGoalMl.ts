import type { BiologicalSex } from '../BiologicalSex';
import type { WaterSuggestionInput } from './WaterSuggestionInput';
import { WaterUnits } from './WaterUnits';

// The owner's choice (2026-10-16) of the panel's formula; product judgement built on NASEM 2004/2005,
// Martin 2006 and sweat data in resistance training (docs/evidence.md).
const baseMl: Readonly<Record<BiologicalSex, number>> = { female: 1_500, male: 2_000 };
/** Water to clear the urea of each gram of protein above the reference intake (renal solute load). */
const perProteinGramMl = 7;
const referenceProteinGPerKg = 0.8;
/** A lifting session's sweat, spread over the week. */
const perTrainingDayMl = 500;
const pregnantMl = 1_750;
const breastfeedingMl = 2_000;
/** The safety specialist's bound: never suggested above 3.5 L, or 120 fl oz in imperial. */
const capMl = 3_500;
const capFlOz = 120;

/**
 * The plain-water goal suggested for a person (MM-358), in millilitres,
 * rounded to a glass (8 fl oz in imperial, 250 mL in metric), or undefined
 * where a care team sets what they drink: chronic kidney disease, after
 * bariatric surgery, or a clinician's fluid limit (MM-359).
 */
export function suggestedWaterGoalMl(input: WaterSuggestionInput): number | undefined {
  const { screening } = input;
  if (screening.chronicKidneyDisease || screening.bariatricSurgery || screening.fluidLimitedByClinician) return undefined;
  let ml: number;
  if (screening.breastfeeding) ml = breastfeedingMl;
  else if (screening.pregnant) ml = pregnantMl;
  else {
    const reference = input.weightKg === undefined ? undefined : input.weightKg * referenceProteinGPerKg;
    const protein =
      reference === undefined || input.proteinTargetG === undefined ? 0 : Math.max(0, input.proteinTargetG - reference);
    ml = baseMl[input.sex] + protein * perProteinGramMl + (perTrainingDayMl * input.trainingDaysPerWeek) / 7;
  }
  const glassMl = input.units === 'imperial' ? WaterUnits.flOzToMl(8) : 250;
  const cap = input.units === 'imperial' ? WaterUnits.flOzToMl(capFlOz) : capMl;
  return Math.min(cap, Math.round(ml / glassMl) * glassMl);
}
