import { SourceReliabilityRule } from '../foodCatalog/SourceReliabilityRule';
import { compareStrings } from '../lang/compareStrings';
import type { CandidateFood } from './CandidateFood';

/** The ten vitamins and minerals the grade counts, as the pack names them. */
const gradeMicros = ['potassium', 'calcium', 'iron', 'magnesium', 'zinc', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12', 'folate'] as const;

/**
 * Which record of a generic food two sources list under one name is
 * written (MM-383, the panel's IN-4, IN-15, P-6). First the grade's floor:
 * a record stating both fiber and sodium beats one that does not, whatever
 * its source. Then the source with the higher reliability base. Then, so
 * the result never depends on the order the candidates came in, the
 * source named first in the base table, and the lower source id as text.
 * Names match after trimming, lower-casing and collapsing runs of spaces.
 */
export class GenericPrecedencePolicy {
  /** The name as compared. */
  static key(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /** How many of the grade's fourteen inputs (fiber, sodium, sugars, saturated fat, the ten vitamins and minerals) a record states. */
  static statedInputs(c: CandidateFood): number {
    return (
      (c.fiberG === undefined ? 0 : 1) +
      (c.sodiumMg === undefined ? 0 : 1) +
      (c.micros.sugars === undefined ? 0 : 1) +
      (c.micros.saturatedFat === undefined ? 0 : 1) +
      gradeMicros.filter((n) => c.micros[n] !== undefined).length
    );
  }

  /** The record to keep of two with one name. */
  prefer(a: CandidateFood, b: CandidateFood): CandidateFood {
    const floor = (c: CandidateFood) => (c.fiberG !== undefined && c.sodiumMg !== undefined ? 1 : 0);
    if (floor(a) !== floor(b)) return floor(a) > floor(b) ? a : b;
    const base = (c: CandidateFood) => SourceReliabilityRule.bases[c.source] ?? 0;
    if (base(a) !== base(b)) return base(a) > base(b) ? a : b;
    if (a.source !== b.source) {
      const order = Object.keys(SourceReliabilityRule.bases);
      const at = (c: CandidateFood) => (order.includes(c.source) ? order.indexOf(c.source) : order.length);
      if (at(a) !== at(b)) return at(a) < at(b) ? a : b;
      return compareStrings(a.source, b.source) < 0 ? a : b;
    }
    return compareStrings(a.sourceId, b.sourceId) <= 0 ? a : b;
  }
}
