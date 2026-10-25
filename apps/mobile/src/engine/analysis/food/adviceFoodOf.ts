import type { FoodEntry } from '../../../domain/FoodEntry';
import { medianOf } from '../../trends/medianOf';
import type { CoachAdviceFood } from '../CoachAdviceFood';
import { foodKeyOf } from './foodKeyOf';

/**
 * A food as an order names it (MM-617): its key (`foodKeyOf`, stable for
 * the record of advice given), its name as logged, and its median calories,
 * fat, protein and sodium a time over `entries` of that food. A food with no
 * entries is named with zeros.
 */
export function adviceFoodOf(name: string, entries: readonly FoodEntry[]): CoachAdviceFood {
  const key = name.trim().toLowerCase();
  const of = entries.filter((e) => foodKeyOf(e) === key);
  const median = (values: readonly number[]) => (values.length === 0 ? 0 : medianOf(values));
  const sodium = of.flatMap((e) => (e.sodiumMg === undefined ? [] : [e.sodiumMg]));
  return {
    key,
    name: name.trim(),
    kcal: median(of.map((e) => e.kcal)),
    fatG: median(of.map((e) => e.fatG)),
    proteinG: median(of.map((e) => e.proteinG)),
    sodiumMg: sodium.length === 0 ? undefined : median(sodium),
  };
}
