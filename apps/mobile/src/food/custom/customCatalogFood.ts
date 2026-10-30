import type { CustomFood } from '../../domain/food/custom/CustomFood';
import { CatalogFood } from '../../foodCatalog/CatalogFood';
import { PackMicronutrient } from '../../foodCatalog/PackMicronutrient';
import type { TrustTier } from '../../foodCatalog/TrustTier';
import { foodEvidenceLine } from '../../format/foodEvidenceLine';

/** The tier a saved food's evidence stands for (MM-710): an unverified estimate is one to check; the rest read as a label or a reference. */
function tierOf(food: CustomFood): { tier: TrustTier; tierReason: string } {
  const evidence = food.evidence;
  if (evidence === undefined || evidence.kind === 'yours') return { tier: 'label', tierReason: 'Entered by you.' };
  const reason = `${foodEvidenceLine(evidence)}.`;
  if (evidence.kind === 'estimated') return { tier: 'checkThis', tierReason: reason };
  return { tier: evidence.kind === 'label' ? 'label' : 'reference', tierReason: reason };
}

/**
 * A saved food shown as the catalog food the amount step and trust mark
 * understand (MM-45). Per-100 g numbers follow from its serving weight;
 * with no serving weight the figures are per serving and only servings are
 * offered. Its group and its evidence travel with it (MM-710): the mark
 * says where the numbers came from, and an unverified estimate is one to
 * check.
 */
export function customCatalogFood(food: CustomFood): CatalogFood {
  const grams = food.servingGrams;
  const scale = grams === undefined ? 1.0 : 100 / grams;
  const perHundred = (perServing: number | undefined) => (perServing === undefined ? undefined : perServing * scale);
  return new CatalogFood({
    id: food.id,
    packId: 'custom',
    name: food.name,
    kcal: food.perServing.kcal * scale,
    proteinG: food.perServing.proteinG * scale,
    carbsG: food.perServing.carbsG * scale,
    fatG: food.perServing.fatG * scale,
    // Fiber, sodium and the micronutrients follow the same scale (MM-309).
    fiberG: perHundred(food.fiberG),
    sugarAlcoholsG: perHundred(food.sugarAlcoholsG),
    sodiumMg: perHundred(food.micros.of('sodium')),
    micros: Object.fromEntries(
      PackMicronutrient.values
        .map((n) => [n, perHundred(food.micros.of(n))] as const)
        .filter(([, value]) => value !== undefined),
    ),
    source: 'user',
    group: food.group,
    ...tierOf(food),
  });
}
