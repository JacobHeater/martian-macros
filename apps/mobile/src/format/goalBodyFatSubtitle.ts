import type { BiologicalSex } from '../domain/BiologicalSex';
import type { GoalBodyFat } from '../domain/GoalBodyFat';
import { PhaseRule } from '../engine/PhaseRule';
import { Fmt } from './Fmt';
import { goalBodyFatCheckText } from './goalBodyFatCheckText';
import { quantityText } from './quantityText';

/**
 * What the Coach's goal body fat row says (MM-507): the goal and when it was
 * set, with its warning and time limit under the soft floor; or, with none,
 * the line the plan uses.
 */
export function goalBodyFatSubtitle(sex: BiologicalSex, goal: GoalBodyFat | undefined): string {
  if (goal === undefined) return `None set: the plan uses ${PhaseRule.cutGoalPercent(sex)}%.`;
  const reason = goalBodyFatCheckText(sex, goal.percent);
  return reason === undefined
    ? `${quantityText(goal.percent)}%, set ${Fmt.longDate(goal.setOn)}.`
    : `${quantityText(goal.percent)}%. ${reason}`;
}
