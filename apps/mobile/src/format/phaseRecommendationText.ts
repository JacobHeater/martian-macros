import type { PhaseEndReason } from '../engine/PhaseEndReason';
import type { PhaseRecommendation } from '../engine/PhaseRecommendation';
import { PhaseRule } from '../engine/PhaseRule';

function endedBecause(reason: PhaseEndReason, line: number | undefined): string {
  switch (reason) {
    case 'goalReached':
      return `The lower end of your body-fat range has reached ${line}%, this cut’s goal.`;
    case 'longestCut':
      return `This cut has run ${PhaseRule.longestCutWeeks} weeks in a deficit, the longest the plan runs one.`;
    case 'stalledAtFloor':
      return 'Progress has stalled with your target already at the lowest the app sets, so the cut cannot go further from here.';
    case 'gainLine':
      return `The upper end of your body-fat range has reached ${line}%, where the plan ends a gain.`;
    case 'longestGain':
      return `This gain has run ${PhaseRule.longestGainWeeks} weeks, the longest the plan runs one.`;
    case 'holdDone':
      return 'This hold at maintenance has run its weeks.';
  }
}

/**
 * Why the phase ended and why the next one is recommended (MM-36), for the
 * Coach's goal section. The goal stays the user's until they choose.
 */
export function phaseRecommendationText(recommendation: PhaseRecommendation, line: number | undefined): string {
  const { reason, next, nextWeeks, then } = recommendation;
  const parts = [endedBecause(reason, line)];
  if (next === 'maintenance') {
    const hold = nextWeeks === undefined ? 'A hold at maintenance' : `About ${nextWeeks} weeks at maintenance`;
    if (then === 'leanGain') parts.push(`${hold} lets the scale settle; then a lean gain, since the goal is reached.`);
    else if (then === 'fatLoss') {
      parts.push(
        reason === 'gainLine' || reason === 'longestGain'
          ? `${hold} lets the scale settle; then a cut, if you want one.`
          : `${hold} gives a rest from dieting; then another cut, since the lower end of your range is still above ${line}%.`,
      );
    } else parts.push(`${hold} comes next.`);
  } else if (next === 'leanGain') {
    parts.push(`A lean gain is next: the lower end of your body-fat range is at ${line}% or under.`);
  } else if (next === 'fatLoss') {
    parts.push(`A cut is next: the lower end of your body-fat range is above ${line}%.`);
  }
  parts.push('Nothing changes until you choose.');
  return parts.join(' ');
}
