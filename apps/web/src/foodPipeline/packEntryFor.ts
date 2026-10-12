import { CatalogFood } from '../foodCatalog/CatalogFood';
import type { PackEntry } from '../foodCatalog/PackEntry';
import type { PreparationState } from '../foodCatalog/PreparationState';
import type { TrustTier } from '../foodCatalog/TrustTier';
import { StateError } from '../lang/StateError';
import type { CandidateFood } from './CandidateFood';

function tierOf(source: string): readonly [TrustTier, string] {
  switch (source) {
    case 'usda_foundation':
    case 'usda_sr_legacy':
      return ['reference', 'Analysed food data from USDA FoodData Central.'];
    case 'usda_branded':
      return ['label', 'Label data submitted by the manufacturer to USDA.'];
    default:
      return ['checkThis', 'Entered by Open Food Facts contributors and not checked against a package.'];
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
      sodiumMg: food.sodiumMg,
      alcoholG: food.alcoholG,
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
