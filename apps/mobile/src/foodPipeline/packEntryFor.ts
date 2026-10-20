import { CatalogFood } from '../foodCatalog/CatalogFood';
import type { PackEntry } from '../foodCatalog/PackEntry';
import type { PreparationState } from '../foodCatalog/PreparationState';
import type { TrustTier } from '../foodCatalog/TrustTier';
import { StateError } from '../lang/StateError';
import type { CandidateFood } from './CandidateFood';
import { communityCheckThisReason } from './communityCheckThisReason';
import { plausibleMicros } from './plausibleMicros';

/** What a community record that is complete and comfortably consistent is (MM-153): a label, transcribed by a contributor. */
const communityLabelReason = 'Copied from the package by Open Food Facts contributors; complete and consistent, though nobody checked it.';

function tierOf(food: CandidateFood, asOfSeconds: number): readonly [TrustTier, string] {
  const source = food.source;
  switch (source) {
    case 'usda_foundation':
    case 'usda_sr_legacy':
      return ['reference', 'Analysed food data from USDA FoodData Central.'];
    case 'usda_fndds':
      return ['reference', 'Compiled by USDA from analysed foods and recipes for the national dietary survey.'];
    case 'usda_branded':
      return ['label', 'Label data submitted by the manufacturer to USDA.'];
    case 'off': {
      // MM-153: "Check this" near the energy check's edge, missing fiber or sodium, or five years old; otherwise a label.
      const doubt = communityCheckThisReason(food, asOfSeconds);
      return doubt === undefined ? ['label', communityLabelReason] : ['checkThis', doubt];
    }
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
 * The trust tier (MM-153): analysed USDA foods are `reference`; USDA branded
 * data is `label`; an Open Food Facts record is `label` when it is complete
 * and comfortably consistent and `checkThis` with its reason otherwise; and
 * anything two sources disagree about is `checkThis`. `asOfSeconds` dates the
 * data a community record is judged against. No food is ever called verified.
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
    asOfSeconds = 0,
  }: {
    id: number;
    packId: string;
    gtin14?: string | undefined;
    disagreement?: string | undefined;
    preparation?: PreparationState;
    pairedFoodId?: number | undefined;
    asOfSeconds?: number;
  },
): PackEntry {
  const [tier, reason] = disagreement !== undefined ? (['checkThis', disagreement] as const) : tierOf(food, asOfSeconds);
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
