import type { PhaseRecommendation } from '../engine/PhaseRecommendation';
import { goalModeLabel } from './goalModeLabel';

/** The heading of the next-phase recommendation (MM-36): "Next: Maintenance, then Lean gain". */
export function phaseNextTitle({ next, then }: PhaseRecommendation): string {
  return `Next: ${goalModeLabel(next)}${then === undefined ? '' : `, then ${goalModeLabel(then)}`}`;
}
