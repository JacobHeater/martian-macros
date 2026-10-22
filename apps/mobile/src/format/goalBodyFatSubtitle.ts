import type { BiologicalSex } from '../domain/BiologicalSex';
import type { GoalBodyFat } from '../domain/GoalBodyFat';
import { PhaseRule } from '../engine/PhaseRule';
import { Fmt } from './Fmt';
import { quantityText } from './quantityText';

/**
 * What the Coach's goal body fat row says (MM-507), kept short: the goal and
 * when it was set ("12%, set Oct 3"); or, with none, the line the plan uses.
 * A soft-floor warning is not here: it is a caution notice under the goal
 * section (goalBodyFatCheckText).
 */
export function goalBodyFatSubtitle(sex: BiologicalSex, goal: GoalBodyFat | undefined): string {
  if (goal === undefined) return `None set: the plan uses ${PhaseRule.cutGoalPercent(sex)}%.`;
  return `${quantityText(goal.percent)}%, set ${Fmt.shortDay(goal.setOn)}`;
}
