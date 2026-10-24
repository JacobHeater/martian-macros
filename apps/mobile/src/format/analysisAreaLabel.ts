import type { AnalysisArea } from '../engine/analysis/AnalysisArea';

/** An area of the Coach tab's analysis, as its rows name it (MM-610). */
export function analysisAreaLabel(area: AnalysisArea): string {
  switch (area) {
    case 'food':
      return 'Food';
    case 'training':
      return 'Training';
    case 'strength':
      return 'Strength';
    case 'water':
      return 'Water';
  }
}
