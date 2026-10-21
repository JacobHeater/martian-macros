import type { PaceOption } from '../engine/PaceOption';
import { Fmt } from './Fmt';
import { paceConsequence } from './paceConsequence';
import { paceLabel } from './paceLabel';
import { paceName } from './paceName';

/**
 * The slower pace the relief offer names (MM-117), as the pace choice says
 * it (MM-128): its name and percent, what it costs today and the target
 * that results, and what it is like to live on. A slower pace only raises
 * the target, so nothing here asks for less.
 */
export function reliefPaceText(option: PaceOption): string {
  return (
    `${paceName(option.pace)} is ${paceLabel(option.fraction)}: about ${Fmt.whole(option.deficitKcal)} kcal a day ` +
    `under your expenditure, for a target of ${Fmt.kcal(option.targetKcal)}. ${paceConsequence(option.pace)}`
  );
}
