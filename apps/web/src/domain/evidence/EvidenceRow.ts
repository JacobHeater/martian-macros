import type { EvidenceGrade } from './EvidenceGrade';

/** One constant or rule in the evidence register. */
export interface EvidenceRow {
  /** The identifier in code, such as `SafetyBounds.proteinRangeG`. */
  readonly name: string;
  readonly value: string;
  readonly where: string;
  readonly decides: string;

  /** The citation as recorded, or the named product judgement. */
  readonly source: string;
  readonly grade: EvidenceGrade;

  /** Who the evidence comes from; applying it beyond them is an extrapolation. */
  readonly population: string;

  /** Whether someone has read the primary source and confirmed the row. */
  readonly checked: boolean;
}
