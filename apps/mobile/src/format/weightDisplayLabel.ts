import type { WeightDisplay } from '../domain/WeightDisplay';

const labels: Record<WeightDisplay, string> = {
  everything: 'Everything',
  trendOnly: 'Trend only',
  hidden: 'Hidden',
};

/** The weight display's name, as Settings shows it (MM-118). */
export function weightDisplayLabel(display: WeightDisplay): string {
  return labels[display];
}
