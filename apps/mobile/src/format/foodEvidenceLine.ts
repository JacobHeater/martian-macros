import type { FoodEvidence } from '../domain/food/meal/FoodEvidence';

/** Where a food of an analysed meal got its numbers, as the line under it says (MM-586). */
export function foodEvidenceLine(evidence: FoodEvidence): string {
  const citation = evidence.citation === undefined ? '' : ` · ${evidence.citation}`;
  switch (evidence.kind) {
    case 'cited':
      return `Cited by the AI${citation}`;
    case 'matched':
      return `Matched in the app’s foods${citation}`;
    case 'estimated':
      return `AI estimate, unverified${citation}`;
    case 'yours':
      return 'Entered by you';
  }
}
