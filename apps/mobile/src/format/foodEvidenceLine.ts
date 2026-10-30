import type { FoodEvidence } from '../domain/food/meal/FoodEvidence';

/** Where a food of an analysed meal (MM-586) or a saved food (MM-710) got its numbers, as the line under it says. */
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
    case 'label':
      return 'Read from the label';
  }
}
