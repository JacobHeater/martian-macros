import type { FoodEntry } from '../domain/FoodEntry';
import { Fmt } from '../format/Fmt';
import { HeroFactLine } from './HeroFactLine';

/**
 * The day's alcohol as a row of the hero (MM-127, MM-336), at every detail
 * level, on Food and on Today: its energy, said as part of the day's total.
 * Nothing on a day without any, and never a word about the amount.
 */
export function AlcoholLine({ entries }: { entries: readonly FoodEntry[] }) {
  const kcal = entries.reduce((sum, e) => sum + e.alcoholKcal, 0);
  return kcal > 0 ? <HeroFactLine name="Alcohol" figures={`${Fmt.whole(kcal)} kcal, in the total`} /> : null;
}
