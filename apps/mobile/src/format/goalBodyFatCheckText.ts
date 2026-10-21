import type { BiologicalSex } from '../domain/BiologicalSex';
import { PhaseRule } from '../engine/PhaseRule';
import { SafetyBounds } from '../engine/SafetyBounds';

/**
 * Why a goal body fat is refused or limited (MM-36, the floors of MM-28),
 * or undefined when it is accepted as it is.
 */
export function goalBodyFatCheckText(sex: BiologicalSex, percent: number): string | undefined {
  const { hard, soft } = SafetyBounds.goalBodyFatFloorsPercent(sex);
  const who = sex === 'male' ? 'men' : 'women';
  switch (SafetyBounds.checkGoalBodyFat(sex, percent)) {
    case 'rejected':
      return `${percent}% is under ${hard}%, the lowest goal body fat the app plans toward for ${who}.`;
    case 'warnAndTimeLimit':
      return (
        `${percent}% is under ${soft}%, low enough that it is hard to hold. ` +
        `Once it is reached the plan holds it ${PhaseRule.lowGoalHoldWeeks} weeks at most, then recommends a lean gain.`
      );
    case 'accepted':
      return undefined;
  }
}
