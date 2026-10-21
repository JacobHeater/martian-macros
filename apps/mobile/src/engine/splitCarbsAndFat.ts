import { CarbFatBalance } from '../domain/CarbFatBalance';

/**
 * Fat and carbohydrate for a day's calories after protein.
 *
 * Without a balance, MM-24's split: fat the larger of its minimum and 25% of
 * calories, carbohydrate the rest. With one (MM-122), fat its share of
 * calories but never under its minimum, and carbohydrate at least the
 * carbohydrate floor unless the user turned it off. When protein, the fat
 * minimum and the floor do not all fit, the floor gives way first; protein
 * and the fat minimum never do.
 */
export function splitCarbsAndFat({
  kcal,
  proteinG,
  fatMinimumG,
  balance,
}: {
  kcal: number;
  proteinG: number;
  fatMinimumG: number;
  balance?: CarbFatBalance | undefined;
}): { fatG: number; carbsG: number } {
  const afterProteinKcal = kcal - 4 * proteinG;
  if (balance === undefined) {
    let fatG = Math.max(fatMinimumG, (CarbFatBalance.unchosenFatShare * kcal) / 9);
    let carbsG = (afterProteinKcal - 9 * fatG) / 4;
    if (carbsG < 0) {
      fatG = fatMinimumG;
      carbsG = Math.max(0, (afterProteinKcal - 9 * fatG) / 4);
    }
    return { fatG, carbsG };
  }
  const carbFloorG = balance.carbFloorOff ? 0 : CarbFatBalance.carbFloorG;
  const wantedFatG = Math.max(fatMinimumG, (balance.fatShare * kcal) / 9);
  // Fat gives the floor what it needs, down to its own minimum; below that the floor gives way.
  const roomForFatG = (afterProteinKcal - 4 * carbFloorG) / 9;
  const fatG = Math.max(fatMinimumG, Math.min(wantedFatG, roomForFatG));
  return { fatG, carbsG: Math.max(0, (afterProteinKcal - 9 * fatG) / 4) };
}
