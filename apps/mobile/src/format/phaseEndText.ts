import type { PhasePlan } from '../engine/PhasePlan';
import { LeanGainRule } from '../engine/LeanGainRule';
import { PhaseRule } from '../engine/PhaseRule';

/**
 * What the projected end of a phase rests on (MM-36), under its date.
 * Undefined when nothing projects it.
 */
export function phaseEndText(plan: PhasePlan): string | undefined {
  const line = plan.linePercent;
  switch (plan.projectedEndReason) {
    case 'goalReached':
      return `At your current pace, when the lower end of your body-fat range reaches ${line}%.`;
    case 'longestCut':
      return `At ${PhaseRule.longestCutWeeks} weeks in a deficit, the longest the plan runs a cut.`;
    case 'gainLine':
      return `At your current pace, when your estimated body fat reaches ${line}%.`;
    case 'longestGain':
      return `At ${LeanGainRule.stopWeeks} weeks, the longest the plan runs a gain.`;
    case 'holdDone': {
      const end = plan.projectedEndOn;
      const weeks = end === undefined ? 0 : Math.round(plan.startedOn.daysUntil(end) / 7);
      return `After ${weeks} weeks at maintenance, then the next phase.`;
    }
    case 'stalledAtFloor':
    case 'gainWaist':
    case undefined:
      return undefined;
  }
}
