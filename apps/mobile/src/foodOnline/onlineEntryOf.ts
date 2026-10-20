import { checkNutrition } from '../domain/food/checkNutrition';
import { normalizeBarcode } from '../domain/food/normalizeBarcode';
import { onlinePackId } from '../foodCatalog/online/onlinePackId';
import type { PackEntry } from '../foodCatalog/PackEntry';
import type { CandidateFood } from '../foodPipeline/CandidateFood';
import { packEntryFor } from '../foodPipeline/packEntryFor';

/**
 * The catalog entry for a food a service answered with, or undefined when
 * it fails the nutrition checks (MM-53) and so is never offered (MM-58).
 * The same rule and the same trust tiers as the pack build, so a food found
 * online is judged exactly as one in a pack.
 */
export function onlineEntryOf(candidate: CandidateFood): PackEntry | undefined {
  if (checkNutrition(candidate) !== undefined) return undefined;
  const gtin14 = candidate.rawBarcode === undefined ? undefined : normalizeBarcode(candidate.rawBarcode);
  return packEntryFor(candidate, { id: 0, packId: onlinePackId, gtin14 });
}
