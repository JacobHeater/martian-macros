import { fatFreeMassKcalPerKg, fatMassKcalPerKg } from './partitionConstants';

/**
 * Energy density of a weight change with lean fraction `leanFraction`,
 * kcal per kg of body weight.
 */
export function energyDensityKcalPerKg(leanFraction: number): number {
  return leanFraction * fatFreeMassKcalPerKg + (1 - leanFraction) * fatMassKcalPerKg;
}
