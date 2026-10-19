import { CatalogFood } from '../foodCatalog/CatalogFood';
import type { PackEntry } from '../foodCatalog/PackEntry';
import type { PreparationState } from '../foodCatalog/PreparationState';
import type { TrustTier } from '../foodCatalog/TrustTier';
import { StateError } from '../lang/StateError';
import type { CandidateFood } from './CandidateFood';
import { plausibleMicros } from './plausibleMicros';

function tierOf(source: string): readonly [TrustTier, string] {
  switch (source) {
    case 'usda_foundation':
    case 'usda_sr_legacy':
      return ['reference', 'Analysed food data from USDA FoodData Central.'];
    case 'usda_fndds':
      return ['reference', 'Compiled by USDA from analysed foods and recipes for the national dietary survey.'];
    case 'usda_branded':
      return ['label', 'Label data submitted by the manufacturer to USDA.'];
    case 'off':
      return ['checkThis', 'Entered by Open Food Facts contributors and not checked against a package.'];
    default:
      // A source the pipeline does not know must not pass as crowd data (MM-383, the panel's IN-3).
      throw new StateError(`Unknown food source "${source}": add it to packEntryFor before building.`);
  }
}

function stated(value: number | undefined, what: string, food: CandidateFood): number {
  if (value === undefined) {
    throw new StateError(`${food.source} ${food.sourceId} has no ${what}; it should have failed the nutrition checks.`);
  }
  return value;
}

/**
 * The pack entry for `food` with pack id `id`.
 *
 * The trust tier is provisional until MM-153 settles it: analysed USDA
 * foods are `reference`, USDA branded data is `label`, and Open Food Facts
 * data, or anything two sources disagree about, is `checkThis`. No food is
 * ever called verified.
 */
export function packEntryFor(
  food: CandidateFood,
  {
    id,
    packId,
    gtin14,
    disagreement,
    preparation = 'unspecified',
    pairedFoodId,
  }: {
    id: number;
    packId: string;
    gtin14?: string | undefined;
    disagreement?: string | undefined;
    preparation?: PreparationState;
    pairedFoodId?: number | undefined;
  },
): PackEntry {
  const [tier, reason] = disagreement !== undefined ? (['checkThis', disagreement] as const) : tierOf(food.source);
  return {
    food: new CatalogFood({
      id,
      packId,
      name: food.name.trim(),
      brand: food.brand,
      kcal: stated(food.kcal, 'energy', food),
      proteinG: stated(food.proteinG, 'protein', food),
      carbsG: stated(food.carbsG, 'carbohydrate', food),
      fatG: stated(food.fatG, 'fat', food),
      fiberG: food.fiberG,
      // A negative or impossible amount is no amount (the panel's IN-3).
      sugarAlcoholsG:
        food.sugarAlcoholsG === undefined || food.sugarAlcoholsG < 0 || food.sugarAlcoholsG > (food.carbsG ?? 0)
          ? undefined
          : food.sugarAlcoholsG,
      sodiumMg: food.sodiumMg,
      alcoholG: food.alcoholG,
      micros: plausibleMicros(food),
      source: food.source,
      preparation,
      pairedFoodId,
      sourceId: food.sourceId,
      tier,
      tierReason: reason,
    }),
    servings: food.servings,
    barcodes: gtin14 === undefined ? [] : [gtin14],
  };
}
