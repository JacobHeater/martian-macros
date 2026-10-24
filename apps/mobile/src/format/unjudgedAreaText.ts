import type { UnjudgedArea } from '../engine/analysis/UnjudgedArea';
import { analysisAreaLabel } from './analysisAreaLabel';

/** A row of "Not enough data in this span" (MM-610): "Training · needs 4 weeks". */
export function unjudgedAreaText({ area, needsDays }: UnjudgedArea): string {
  const needs = needsDays % 7 === 0 ? `${needsDays / 7} ${needsDays === 7 ? 'week' : 'weeks'}` : `${needsDays} days`;
  return `${analysisAreaLabel(area)} · needs ${needs}`;
}
