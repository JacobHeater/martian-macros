import type { WeightDisplay } from '../domain/WeightDisplay';

const details: Record<WeightDisplay, string> = {
  everything: 'Every weigh-in and the trend, as numbers.',
  trendOnly: 'The trend and how it changes. No single weigh-in is shown anywhere.',
  hidden: 'No weight anywhere. Progress is said in words against your plan’s pace. Works best with a connected scale.',
};

/** What each weight display shows (MM-118), said the same whether it is chosen or not. */
export function weightDisplayDetail(display: WeightDisplay): string {
  return details[display];
}
