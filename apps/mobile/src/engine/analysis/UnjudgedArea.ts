import type { AnalysisArea } from './AnalysisArea';

/**
 * An area the chosen span is too short to judge (MM-610's "Not enough data
 * in this span"): "Training · needs 4 weeks". `needsDays` is the shortest
 * span that judges every signal of the area.
 */
export interface UnjudgedArea {
  readonly area: AnalysisArea;
  readonly needsDays: number;
}
