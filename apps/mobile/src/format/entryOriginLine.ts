import type { FoodEntry } from '../domain/FoodEntry';
import { onlinePackId } from '../foodCatalog/online/onlinePackId';
import { foodSourceLabel } from './foodSourceLabel';

/**
 * Where a logged entry's numbers came from, in words (MM-657, the owner):
 * the source its portion records, and whether it was found online or in
 * the food database on the phone; an entry with no origin was typed or
 * estimated by the person. Shown on the entry when it is edited.
 */
export function entryOriginLine(entry: FoodEntry): string {
  const origin = entry.portion?.origin;
  if (origin === undefined) return entry.source === 'quickAdd' ? 'Source: your estimate.' : 'Source: entered by you.';
  const where = origin.packId === onlinePackId ? 'found online' : 'from the food database on this phone';
  return `Source: ${foodSourceLabel({ source: origin.source })}, ${where}.`;
}
