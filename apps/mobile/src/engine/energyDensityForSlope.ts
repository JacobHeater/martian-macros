import { energyDensityKcalPerKg } from './energyDensityKcalPerKg';
import { leanFractionOfChange } from './leanFractionOfChange';

/** Energy density of the weight change implied by `slopeKgPerDay`. */
export function energyDensityForSlope({
  slopeKgPerDay,
  fatMassKg,
  resistanceTrained,
}: {
  slopeKgPerDay: number;
  fatMassKg: number;
  resistanceTrained: boolean;
}): number {
  return energyDensityKcalPerKg(leanFractionOfChange({ fatMassKg, losing: slopeKgPerDay < 0, resistanceTrained }));
}
