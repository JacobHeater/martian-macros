import type { AnalysisArea } from '../engine/analysis/AnalysisArea';
import { analysisAreaLabel } from './analysisAreaLabel';

/** MM-610's empty state when the data was read and nothing stood out, with the areas that were checked. */
export function nothingFoundText(checked: readonly AnalysisArea[]): string {
  const names = checked.map((area) => analysisAreaLabel(area).toLowerCase());
  if (names.length === 0) return 'Nothing stands out.';
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Nothing stands out. Checked: ${list ?? ''}.`;
}
