import type { ExplanationReason } from './ExplanationReason';
import type { TargetFlag } from './TargetFlag';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The causes of a change that the user may hold back once. Anything with a
 * safety reason, or a change the user made themselves, is not on the list.
 */
const holdable: ReadonlySet<ExplanationReason> = new Set(['expenditureEstimate', 'paceAndWeight', 'stepLimit']);

const safetyFlags: ReadonlySet<TargetFlag> = new Set([
  'raisedForSafePace',
  'heldAfterSafetyRaise',
  'underweightMaintenance',
  'modeNotAllowed',
  'dietBreak',
  'requestedBreak',
  'requestedOneWeekBreak',
  'heldByUser',
]);

/**
 * Whether the user may keep last week's targets for now (MM-138): only on the
 * latest, ordinary reduction, and not twice running. Never for an increase,
 * a safety change, or a change they made themselves.
 */
export function canHoldReduction(history: readonly TargetsRecord[]): boolean {
  const current = history[history.length - 1];
  const previous = history[history.length - 2];
  if (current === undefined || previous === undefined) return false;
  const explanation = current.explanation;
  if (explanation === undefined || explanation.lines.length === 0) return false;
  if (current.targets.kcal >= previous.targets.kcal - 0.5) return false;
  if (previous.targets.flags.has('heldByUser')) return false;
  if ([...current.targets.flags].some((flag) => safetyFlags.has(flag))) return false;
  return explanation.lines.every((l) => holdable.has(l.reason));
}
